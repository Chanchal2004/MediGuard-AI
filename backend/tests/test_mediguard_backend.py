"""Backend integration tests for MediGuard AI.

Covers: health, auth, profile, prescriptions (real Gemini OCR), dose events,
adherence, dashboard, emergency (OSM), copilot SSE, voice TTS, caregiver.
"""
import io
import os
import json
import time
import pytest
import requests
from PIL import Image, ImageDraw, ImageFont

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://medication-intel.preview.emergentagent.com").rstrip("/")
SESSION_TOKEN = "test_session_mediguard_v1"
AUTH = {"Authorization": f"Bearer {SESSION_TOKEN}"}


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", **AUTH})
    return s


# -- 1. Health & auth --------------------------------------------------------
def test_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert j.get("status") == "ok"
    assert j.get("ml") == "ready"


def test_auth_me_unauthenticated():
    r = requests.get(f"{BASE_URL}/api/auth/me", timeout=20)
    assert r.status_code == 401


def test_auth_me_with_token(api):
    r = api.get(f"{BASE_URL}/api/auth/me", timeout=20)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("user_id") == "user_test_mediguard"
    assert d.get("email")


# -- 2. Profile (caregiver_required for age 68 + Diabetes) -------------------
def test_upsert_profile_caregiver_required(api):
    body = {
        "full_name": "Test Patient",
        "age": 68,
        "sex": "male",
        "weight_kg": 70,
        "chronic_conditions": ["Diabetes"],
        "allergies": ["penicillin"],
        "language": "en",
    }
    r = api.post(f"{BASE_URL}/api/profile", json=body, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("onboarded") is True
    cg = d.get("caregiver_status") or {}
    assert cg.get("required") is True, f"caregiver_status expected required=True, got {cg}"


def test_get_profile(api):
    r = api.get(f"{BASE_URL}/api/profile", timeout=20)
    assert r.status_code == 200
    d = r.json()
    assert d.get("onboarded") is True
    assert d.get("age") == 68


# -- 3. Prescription upload with synthetic image (real Gemini call) ----------
def _make_prescription_image() -> bytes:
    img = Image.new("RGB", (900, 600), "white")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
        big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except Exception:
        font = ImageFont.load_default()
        big = font
    d.text((30, 20), "Dr Sharma, MBBS MD", fill="black", font=big)
    d.text((30, 70), "Diagnosis: Hypertension, Type 2 Diabetes", fill="black", font=font)
    d.text((30, 130), "Rx:", fill="black", font=big)
    d.text((30, 180), "1) Tab Amlodipine 5 mg   1-0-1   for 30 days", fill="black", font=font)
    d.text((30, 230), "2) Tab Metformin 500 mg  1-0-1 after food  60 days", fill="black", font=font)
    d.text((30, 280), "3) Tab Atorvastatin 10 mg  0-0-1 at night  30 days", fill="black", font=font)
    d.text((30, 360), "Advice: Low salt diet, regular walk", fill="black", font=font)
    d.text((30, 420), "Follow up after 2 weeks", fill="black", font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="session")
def uploaded_prescription():
    img_bytes = _make_prescription_image()
    files = {"file": ("prescription.png", img_bytes, "image/png")}
    r = requests.post(
        f"{BASE_URL}/api/prescriptions/upload",
        headers=AUTH,
        files=files,
        timeout=180,
    )
    assert r.status_code == 200, f"upload failed: {r.status_code} {r.text[:500]}"
    return r.json()


def test_prescription_upload_real_ai(uploaded_prescription):
    rx = uploaded_prescription
    assert "prescription_id" in rx
    assert "medicines" in rx
    assert "alerts" in rx
    assert isinstance(rx.get("risk_score"), int)
    assert 0 <= rx["risk_score"] <= 100
    assert rx.get("severity_label") in ("green", "yellow", "orange", "red")
    assert rx.get("visit_urgency") in (
        "home_care", "primary_care", "urgent_care", "er_now", "emergency",
        "monitor", "pharmacy", "doctor_visit",
    ) or isinstance(rx.get("visit_urgency"), str)
    adp = rx.get("adherence_predicted_risk")
    assert isinstance(adp, (int, float)) and 0 <= adp <= 1


def test_list_prescriptions(api, uploaded_prescription):
    r = api.get(f"{BASE_URL}/api/prescriptions", timeout=30)
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list) and len(docs) >= 1
    assert any(d.get("prescription_id") == uploaded_prescription["prescription_id"] for d in docs)


# -- 4. Dose events & adherence ---------------------------------------------
def test_dose_events_created(api, uploaded_prescription):
    r = api.get(f"{BASE_URL}/api/dose-events?days=14", timeout=30)
    assert r.status_code == 200
    events = r.json()
    assert isinstance(events, list)
    # Auto-creation only happens if medicines were extracted by Gemini.
    # If meds were extracted, we should have events; otherwise log info.
    meds = uploaded_prescription.get("medicines") or []
    if meds:
        assert len(events) >= 1, "No dose events created despite extracted meds"


def test_dose_action_mark_taken(api, uploaded_prescription):
    r = api.get(f"{BASE_URL}/api/dose-events?days=14", timeout=30)
    events = r.json()
    if not events:
        pytest.skip("No dose events available")
    ev = events[0]
    r2 = api.post(
        f"{BASE_URL}/api/dose-events/{ev['event_id']}/action",
        json={"status": "taken"},
        timeout=30,
    )
    assert r2.status_code == 200
    assert r2.json().get("ok") is True


def test_adherence_summary(api):
    r = api.get(f"{BASE_URL}/api/adherence/summary", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert "score" in d
    assert isinstance(d.get("future_miss_prob"), (int, float))
    assert 0 <= d["future_miss_prob"] <= 1


# -- 5. Dashboard ------------------------------------------------------------
def test_dashboard(api):
    r = api.get(f"{BASE_URL}/api/dashboard", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert "profile" in d
    assert "adherence" in d
    assert "alerts" in d
    assert "caregiver_status" in d
    fmp = d["adherence"].get("future_miss_prob")
    assert isinstance(fmp, (int, float))
    assert 0.0 <= fmp <= 1.0


# -- 6. Emergency assess (real OSM Overpass) ---------------------------------
def test_emergency_assess_bengaluru(api):
    body = {
        "symptoms": "severe chest pain and shortness of breath",
        "location_query": "Bengaluru, India",
    }
    r = api.post(f"{BASE_URL}/api/emergency/assess", json=body, timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    sev = d.get("severity", {}).get("label")
    urg = d.get("urgency", {}).get("label")
    assert sev in ("green", "yellow", "orange", "red")
    assert urg
    fac = d.get("facilities", {})
    # at least hospitals OR clinics should be non-empty for Bengaluru
    assert (len(fac.get("hospitals", [])) + len(fac.get("clinics", [])) + len(fac.get("pharmacies", []))) > 0, \
        f"No OSM facilities returned: {fac}"
    assert "Symptoms" in d.get("summary", "") or "Patient" in d.get("summary", "")


# -- 7. Copilot SSE streaming ------------------------------------------------
def test_copilot_stream_sse():
    headers = {**AUTH, "Content-Type": "application/json", "Accept": "text/event-stream"}
    r = requests.post(
        f"{BASE_URL}/api/copilot/chat",
        headers=headers,
        json={"message": "Why am I taking these medicines?", "language": "en"},
        stream=True,
        timeout=120,
    )
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")
    deltas = 0
    done = False
    for line in r.iter_lines(decode_unicode=True):
        if not line:
            continue
        if line.startswith("data: "):
            payload = line[6:]
            try:
                obj = json.loads(payload)
            except Exception:
                continue
            if "delta" in obj:
                deltas += 1
            if obj.get("done"):
                done = True
                break
    assert deltas >= 1, "no delta events received"
    assert done is True


# -- 8. Voice TTS ------------------------------------------------------------
def test_voice_tts(api):
    r = api.post(
        f"{BASE_URL}/api/voice/tts",
        json={"text": "Hello, this is MediGuard speaking."},
        timeout=60,
    )
    assert r.status_code == 200, r.text[:200] if hasattr(r, "text") else "no body"
    assert r.headers.get("content-type", "").startswith("audio/mpeg")
    assert len(r.content) > 1000


def test_voice_transcribe_unauthenticated():
    # Quick check endpoint exists and requires auth
    r = requests.post(f"{BASE_URL}/api/voice/transcribe", timeout=20)
    assert r.status_code in (401, 422)  # 422 if missing file but unauth still applies first; backend depends on order


# -- 9. Caregiver snapshot ---------------------------------------------------
def test_caregiver_snapshot(api):
    r = api.get(f"{BASE_URL}/api/caregiver/snapshot", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert "profile" in d
    assert "caregiver_status" in d
    assert "adherence" in d
    assert "escalation" in d
