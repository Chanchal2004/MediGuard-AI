"""Iteration-2 backend tests: caregiver magic-link, PDF export, pill visual check."""
import io
import os
import time
from datetime import datetime, timezone, timedelta

import pytest
import requests
from PIL import Image, ImageDraw
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
SESSION_TOKEN = "test_session_mediguard_v1"
AUTH = {"Authorization": f"Bearer {SESSION_TOKEN}"}

# Direct DB handle for synthetic insertions (expired invite)
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
mongo = MongoClient(MONGO_URL)[DB_NAME]


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", **AUTH})
    return s


# ---------------------------------------------------------------------------
# Caregiver magic-link invites
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def fresh_invite(api):
    r = api.post(
        f"{BASE_URL}/api/caregiver/invite",
        json={"caregiver_name": "TEST_Carer", "caregiver_email": "test.carer@example.com"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert "token" in d and isinstance(d["token"], str) and len(d["token"]) >= 16
    assert "expires_at" in d
    yield d["token"]
    # cleanup
    try:
        api.delete(f"{BASE_URL}/api/caregiver/invite/{d['token']}", timeout=10)
        mongo.caregiver_invites.delete_one({"token": d["token"]})
    except Exception:
        pass


def test_caregiver_invite_create(fresh_invite):
    assert fresh_invite


def test_caregiver_invites_list(api, fresh_invite):
    r = api.get(f"{BASE_URL}/api/caregiver/invites", timeout=20)
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list)
    assert any(d.get("token") == fresh_invite and d.get("revoked") is False for d in docs)


def test_public_caregiver_view_no_auth(fresh_invite):
    # IMPORTANT: no auth header / cookie used here
    r = requests.get(f"{BASE_URL}/api/public/caregiver/{fresh_invite}", timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "patient" in d and "adherence" in d
    patient = d["patient"]
    assert patient.get("full_name")
    # No sensitive leakage
    assert "email" not in patient
    assert "caregiver_email" not in patient
    if d.get("latest_prescription"):
        lp = d["latest_prescription"]
        assert "raw_ocr_text" not in lp
        assert "image_b64" not in lp


def test_caregiver_invite_revoke(api):
    # Create then revoke a fresh one to assert 404 on public view
    r = api.post(f"{BASE_URL}/api/caregiver/invite", json={"caregiver_name": "TEST_revoke"}, timeout=20)
    token = r.json()["token"]
    rev = api.delete(f"{BASE_URL}/api/caregiver/invite/{token}", timeout=20)
    assert rev.status_code == 200
    pub = requests.get(f"{BASE_URL}/api/public/caregiver/{token}", timeout=20)
    assert pub.status_code == 404


def test_public_caregiver_expired_returns_410():
    # Insert an expired invite directly into mongo
    expired_token = "cgt_expired_test_" + os.urandom(6).hex()
    mongo.caregiver_invites.insert_one({
        "token": expired_token,
        "user_id": "user_test_mediguard",
        "caregiver_name": "TEST_expired",
        "caregiver_email": None,
        "expires_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "created_at": (datetime.now(timezone.utc) - timedelta(days=40)).isoformat(),
        "revoked": False,
    })
    try:
        r = requests.get(f"{BASE_URL}/api/public/caregiver/{expired_token}", timeout=20)
        assert r.status_code == 410, f"expected 410 got {r.status_code} {r.text}"
    finally:
        mongo.caregiver_invites.delete_one({"token": expired_token})


# ---------------------------------------------------------------------------
# PDF export
# ---------------------------------------------------------------------------
def _get_some_prescription_id(api) -> str:
    r = api.get(f"{BASE_URL}/api/prescriptions", timeout=30)
    assert r.status_code == 200
    docs = r.json()
    if not docs:
        pytest.skip("No prescriptions seeded; previous iteration suite must run first.")
    return docs[0]["prescription_id"]


def test_pdf_export_returns_pdf(api):
    pid = _get_some_prescription_id(api)
    r = requests.get(
        f"{BASE_URL}/api/reports/{pid}/pdf",
        headers=AUTH,
        timeout=60,
    )
    assert r.status_code == 200, r.text[:200]
    assert r.headers.get("content-type", "").startswith("application/pdf")
    cd = r.headers.get("content-disposition", "")
    assert "attachment" in cd.lower()
    assert r.content.startswith(b"%PDF"), "Not a real PDF magic header"
    assert len(r.content) > 1500


def test_pdf_export_not_found():
    r = requests.get(
        f"{BASE_URL}/api/reports/nonexistent-id-xxxx/pdf",
        headers=AUTH,
        timeout=30,
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Pill visual check (real Gemini vision)
# ---------------------------------------------------------------------------
def _make_pill_image(color="white", text="A5") -> bytes:
    img = Image.new("RGB", (480, 480), "white")
    d = ImageDraw.Draw(img)
    d.ellipse((90, 90, 390, 390), fill=color, outline="black", width=3)
    d.line((90, 240, 390, 240), fill="black", width=2)
    d.text((220, 200), text, fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_pill_check_basic(api):
    img = _make_pill_image(color="white", text="A5")
    files = {"file": ("pill.png", img, "image/png")}
    data = {"medicine_name": "Amlodipine"}
    r = requests.post(
        f"{BASE_URL}/api/pill/check",
        headers=AUTH,
        files=files,
        data=data,
        timeout=120,
    )
    assert r.status_code == 200, r.text[:300]
    d = r.json()
    for key in ("identified", "match_with_claim", "confusion_risk", "confusion_with", "recommendations", "safety_note"):
        assert key in d, f"missing field {key} in {d}"
    assert d["confusion_risk"] in ("none", "low", "moderate", "high")
    assert d["match_with_claim"] in ("yes", "no", "uncertain")
    assert isinstance(d["confusion_with"], list)
    assert isinstance(d["recommendations"], list)


def test_pill_check_different_images_give_different_outputs(api):
    """Confirm real Gemini vision is in use — two visually different images
    must not produce identical `identified` strings (i.e. not hardcoded)."""
    img_a = _make_pill_image(color="white", text="A5")
    img_b = _make_pill_image(color="#FF4444", text="ZZZ9")
    out = []
    for tag, img in (("a", img_a), ("b", img_b)):
        r = requests.post(
            f"{BASE_URL}/api/pill/check",
            headers=AUTH,
            files={"file": (f"pill_{tag}.png", img, "image/png")},
            data={"medicine_name": "Amlodipine"},
            timeout=120,
        )
        assert r.status_code == 200, r.text[:300]
        out.append(r.json())
    # Either identified text differs OR confusion_risk differs — both being identical
    # for two clearly different inputs would be evidence of hardcoded output.
    diff_identified = (out[0].get("identified") or "").strip() != (out[1].get("identified") or "").strip()
    diff_risk = out[0].get("confusion_risk") != out[1].get("confusion_risk")
    diff_match = out[0].get("match_with_claim") != out[1].get("match_with_claim")
    assert diff_identified or diff_risk or diff_match, f"Outputs look hardcoded: {out}"
