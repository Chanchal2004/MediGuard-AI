"""
AI services powered directly by Google Gemini.

Features:
- OCR: prescription image/PDF -> structured medicines JSON
- Medicine explanations
- Safety analysis
- Symptom triage
- Pill visual identification
- Copilot chat
"""

from __future__ import annotations

import os
import json
import re
from typing import List, Dict, Optional, AsyncGenerator

from google import genai
from google.genai import types


# ============================================================
# GEMINI CONFIG
# ============================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
print("\n===== GEMINI DEBUG =====")
print("KEY FOUND:", bool(GEMINI_API_KEY))
print("KEY LENGTH:", len(GEMINI_API_KEY))
print("========================\n")

client = genai.Client(
    api_key=GEMINI_API_KEY
)

GEMINI_MODEL = "gemini-2.5-flash"


# ============================================================
# HELPERS
# ============================================================

def _extract_json(text: str) -> Optional[dict]:
    if not text:
        return None

    m = re.search(
        r"```(?:json)?\s*([\s\S]+?)```",
        text,
    )

    if m:
        candidate = m.group(1).strip()
    else:
        first = text.find("{")
        last = text.rfind("}")

        if first == -1 or last == -1:
            return None

        candidate = text[first:last + 1]

    try:
        return json.loads(candidate)

    except Exception:
        try:
            cleaned = re.sub(
                r",\s*}",
                "}",
                candidate,
            )

            cleaned = re.sub(
                r",\s*]",
                "]",
                cleaned,
            )

            return json.loads(cleaned)

        except Exception:
            return None


async def _send_once(
    session_id: str,
    system: str,
    prompt: str,
    file_path: Optional[str] = None,
    mime: Optional[str] = None,
) -> str:

    contents = []

    if file_path:
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        contents.append(
            types.Part.from_bytes(
                data=file_bytes,
                mime_type=mime or "image/jpeg",
            )
        )

    contents.append(prompt)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.2,
        ),
    )

    print("\n===== GEMINI RAW RESPONSE =====")
    print(response)
    print("===============================\n")

    print("\n===== GEMINI TEXT =====")
    print(response.text)
    print("=======================\n")

    return response.text or ""

# ============================================================
# OCR
# ============================================================

OCR_SYSTEM = (
    "You are MediGuard OCR, a precise medical OCR engine. "
    "Read prescriptions (handwritten or printed) and return "
    "ONLY a strict JSON object."
)

OCR_PROMPT = """
Analyse this prescription image.

Extract every medicine with structured fields.

Return ONLY JSON:

{
  "doctor_name": "string or null",
  "diagnosis": "string or null",
  "raw_text": "all text you can read",
  "medicines": [
    {
      "name": "",
      "generic": "",
      "dosage": "",
      "frequency": "",
      "times_per_day": 0,
      "duration_days": 0,
      "food": "",
      "instructions": ""
    }
  ]
}

If image is not a prescription return:

{
  "error":"not_a_prescription",
  "raw_text":"..."
}
"""


async def run_ocr(
    file_path: str,
    mime: str,
    session_id: str,
) -> dict:

    raw = await _send_once(
        session_id=session_id,
        system=OCR_SYSTEM,
        prompt=OCR_PROMPT,
        file_path=file_path,
        mime=mime,
    )

    print("\n===== OCR RESPONSE =====")
    print(raw)
    print("========================\n")

    parsed = _extract_json(raw)

    if not parsed:
        return {
            "medicines": [],
            "raw_text": raw[:2000],
            "error": "parse_failed",
        }

    return parsed


# ============================================================
# MEDICINE EXPLANATIONS
# ============================================================

EXPLAIN_SYSTEM = (
    "You are a friendly clinical pharmacist. "
    "Explain medicines in extremely simple language "
    "that an elderly patient can understand."
)


def _explain_prompt(
    medicines: List[Dict],
    language: str,
) -> str:

    return f"""
Patient language preference: {language}

For each medicine explain it in simple language.

Return ONLY JSON:

{{
  "explanations": [
    {{
      "name": "",
      "why": "",
      "how_it_works": "",
      "when_to_take": "",
      "side_effects": [],
      "precautions": [],
      "missed_dose": ""
    }}
  ]
}}

Medicines:

{json.dumps(medicines, ensure_ascii=False)}
"""


async def explain_medicines(
    medicines: List[Dict],
    language: str,
    session_id: str,
) -> List[Dict]:

    if not medicines:
        return []

    raw = await _send_once(
        session_id=session_id,
        system=EXPLAIN_SYSTEM,
        prompt=_explain_prompt(
            medicines,
            language,
        ),
    )

    parsed = _extract_json(raw) or {}

    return parsed.get(
        "explanations",
        [],
    )
# ============================================================
# SAFETY ANALYSIS
# ============================================================

SAFETY_SYSTEM = (
    "You are a clinical safety analyst. "
    "Identify medication risks accurately. "
    "Return ONLY strict JSON. "
    "Never invent interactions."
)


def _safety_prompt(
    medicines: List[Dict],
    profile: Dict,
) -> str:

    return f"""
Analyse the prescription for clinical safety.

Return ONLY JSON:

{{
  "alerts": [
    {{
      "category": "interaction|duplicate|allergy|pregnancy|elderly|confusion|general",
      "severity": "mild|moderate|severe|critical",
      "title": "",
      "detail": "",
      "medicines": [],
      "action": ""
    }}
  ]
}}

Rules:

- Include drug-drug interactions if any.
- Detect duplicate medicines.
- Check allergies.
- Check pregnancy risks.
- Check elderly risks.
- Check confusion risks.
- If no issue found return empty alerts.

Patient:

{json.dumps(profile, ensure_ascii=False)}

Medicines:

{json.dumps(medicines, ensure_ascii=False)}
"""


async def analyse_safety(
    medicines: List[Dict],
    profile: Dict,
    session_id: str,
) -> List[Dict]:

    if not medicines:
        return []

    raw = await _send_once(
        session_id=session_id,
        system=SAFETY_SYSTEM,
        prompt=_safety_prompt(
            medicines,
            profile,
        ),
    )

    parsed = _extract_json(raw) or {}

    return parsed.get(
        "alerts",
        [],
    )


# ============================================================
# TRIAGE
# ============================================================

TRIAGE_SYSTEM = (
    "You are an emergency triage assistant. "
    "Extract structured clinical features. "
    "Return ONLY strict JSON."
)


def _triage_prompt(
    symptoms: str,
    profile: Dict,
) -> str:

    return f"""
Patient described symptoms.

Return ONLY JSON:

{{
  "symptom_severity": 0,
  "chest_pain": 0,
  "breathing_difficulty": 0,
  "confusion": 0,
  "bleeding": 0,
  "fever_c": 37.0,
  "primary_concern": "",
  "rationale": ""
}}

Patient:

{json.dumps(profile, ensure_ascii=False)}

Symptoms:

{symptoms}
"""


async def triage_symptoms(
    symptoms: str,
    profile: Dict,
    session_id: str,
) -> Dict:

    raw = await _send_once(
        session_id=session_id,
        system=TRIAGE_SYSTEM,
        prompt=_triage_prompt(
            symptoms,
            profile,
        ),
    )

    parsed = _extract_json(raw) or {}

    return {
        "symptom_severity": int(
            parsed.get(
                "symptom_severity",
                3,
            ) or 3
        ),
        "chest_pain": int(
            parsed.get(
                "chest_pain",
                0,
            ) or 0
        ),
        "breathing_difficulty": int(
            parsed.get(
                "breathing_difficulty",
                0,
            ) or 0
        ),
        "confusion": int(
            parsed.get(
                "confusion",
                0,
            ) or 0
        ),
        "bleeding": int(
            parsed.get(
                "bleeding",
                0,
            ) or 0
        ),
        "fever_c": float(
            parsed.get(
                "fever_c",
                37.0,
            ) or 37.0
        ),
        "primary_concern": parsed.get(
            "primary_concern",
            "Unspecified",
        ),
        "rationale": parsed.get(
            "rationale",
            "",
        ),
    }


# ============================================================
# PILL VISION
# ============================================================

PILL_SYSTEM = (
    "You are MediGuard PillVision. "
    "Identify pills, tablets and capsules. "
    "Return ONLY strict JSON."
)


def _pill_prompt(
    claimed: Optional[str],
    active: List[str],
) -> str:

    return f"""
Look at the pill image.

Return ONLY JSON:

{{
  "identified": "",
  "guessed_medicine": "",
  "match_with_claim": "yes|no|uncertain",
  "confusion_risk": "none|low|moderate|high",
  "confusion_with": [],
  "recommendations": [],
  "safety_note": ""
}}

Claimed medicine:

{claimed or "not provided"}

Active medicines:

{json.dumps(active, ensure_ascii=False)}
"""


async def pill_visual_check(
    file_path: str,
    mime: str,
    claimed_medicine: Optional[str],
    active_medicines: List[str],
    session_id: str,
) -> Dict:

    raw = await _send_once(
        session_id=session_id,
        system=PILL_SYSTEM,
        prompt=_pill_prompt(
            claimed_medicine,
            active_medicines,
        ),
        file_path=file_path,
        mime=mime,
    )

    parsed = _extract_json(raw) or {}

    return {
        "identified":
            parsed.get("identified")
            or "Could not identify",

        "guessed_medicine":
            parsed.get("guessed_medicine"),

        "match_with_claim":
            parsed.get(
                "match_with_claim",
                "uncertain",
            ),

        "confusion_risk":
            parsed.get(
                "confusion_risk",
                "none",
            ),

        "confusion_with":
            parsed.get(
                "confusion_with",
                [],
            ),

        "recommendations":
            parsed.get(
                "recommendations",
                [],
            ),

        "safety_note":
            parsed.get(
                "safety_note",
                "",
            ),
    }
# ============================================================
# COPILOT CHAT
# ============================================================

COPILOT_SYSTEM_TEMPLATE = """
You are MediGuard Copilot, a medical assistant.

Rules:

- Speak in patient's chosen language ({language}).
- Use patient profile and prescription context.
- Give safe evidence-based answers.
- Never tell patients to stop medicines without a doctor's advice.
- If symptoms indicate an emergency, advise immediate medical attention.

Patient Profile:
{profile_json}

Current Prescriptions:
{prescriptions_json}
"""


async def copilot_stream(
    session_id: str,
    profile: Dict,
    prescriptions: List[Dict],
    history: List[Dict],
    user_text: str,
    language: str = "en",
) -> AsyncGenerator[str, None]:

    system = COPILOT_SYSTEM_TEMPLATE.format(
        language=language,
        profile_json=json.dumps(
            profile,
            ensure_ascii=False,
        ),
        prescriptions_json=json.dumps(
            prescriptions,
            ensure_ascii=False,
        )[:6000],
    )

    combined = ""

    for m in history[-8:]:
        role = m.get("role", "user")

        combined += (
            f"\n[{role.upper()}]: "
            f"{m.get('content', '')}\n"
        )

    combined += (
        f"\n[USER]: {user_text}\n"
        f"[ASSISTANT]:"
    )

    stream = client.models.generate_content_stream(
        model=GEMINI_MODEL,
        contents=combined,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.4,
        ),
    )

    for chunk in stream:
        if chunk.text:
            yield chunk.text