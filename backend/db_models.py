"""MediGuard AI - Pydantic models and DB helpers."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Literal

from pydantic import BaseModel, Field, ConfigDict


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str = "id") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


# --- User & Auth ----------------------------------------------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=now_utc)


# --- Patient profile ------------------------------------------------------
class PatientProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    full_name: str
    age: int
    sex: Literal["male", "female", "other"] = "other"
    weight_kg: Optional[float] = None
    pregnant: bool = False
    trimester: Optional[int] = None  # 1,2,3
    chronic_conditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    language: Literal["en", "hi"] = "en"
    caregiver_name: Optional[str] = None
    caregiver_email: Optional[str] = None
    caregiver_phone: Optional[str] = None
    location: Optional[dict] = None  # {lat, lon, label}
    onboarded: bool = False
    updated_at: datetime = Field(default_factory=now_utc)


# --- Prescription & medicine ----------------------------------------------
class Medicine(BaseModel):
    medicine_id: str = Field(default_factory=lambda: new_id("med"))
    name: str
    generic: Optional[str] = None
    dosage: Optional[str] = None  # e.g. "500 mg"
    frequency: Optional[str] = None  # e.g. "1-0-1"
    times_per_day: int = 1
    duration_days: Optional[int] = None
    instructions: Optional[str] = None
    food: Optional[str] = None  # before/after food
    notes: Optional[str] = None


class SafetyAlert(BaseModel):
    alert_id: str = Field(default_factory=lambda: new_id("alert"))
    category: Literal[
        "interaction", "duplicate", "allergy", "pregnancy",
        "elderly", "confusion", "general"
    ]
    severity: Literal["mild", "moderate", "severe", "critical"]
    title: str
    detail: str
    medicines: List[str] = Field(default_factory=list)
    action: Optional[str] = None


class Prescription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    prescription_id: str = Field(default_factory=lambda: new_id("rx"))
    user_id: str
    image_b64: Optional[str] = None  # base64 thumbnail
    source_mime: Optional[str] = None
    doctor_name: Optional[str] = None
    diagnosis: Optional[str] = None
    medicines: List[Medicine] = Field(default_factory=list)
    explanations: dict = Field(default_factory=dict)  # medicine_id -> explanation
    alerts: List[SafetyAlert] = Field(default_factory=list)
    risk_score: int = 0
    severity_label: str = "green"
    severity_confidence: float = 0.0
    visit_urgency: str = "routine"
    visit_urgency_confidence: float = 0.0
    adherence_predicted_risk: float = 0.0
    raw_ocr_text: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)


# --- Adherence -----------------------------------------------------------
class DoseEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_id: str = Field(default_factory=lambda: new_id("dose"))
    user_id: str
    prescription_id: str
    medicine_id: str
    medicine_name: str
    scheduled_for: datetime
    status: Literal["pending", "taken", "missed", "delayed"] = "pending"
    taken_at: Optional[datetime] = None
    delay_minutes: Optional[int] = None
    created_at: datetime = Field(default_factory=now_utc)


# --- Copilot chat --------------------------------------------------------
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: new_id("msg"))
    user_id: str
    session_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=now_utc)


# --- helpers --------------------------------------------------------------
def serialize_for_mongo(model: BaseModel) -> dict:
    """Dump a model to dict with datetimes converted to ISO string."""
    doc = model.model_dump()
    return _convert_dt(doc)


def _convert_dt(obj):
    if isinstance(obj, dict):
        return {k: _convert_dt(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_dt(v) for v in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def deserialize_from_mongo(doc: dict) -> dict:
    """Convert ISO strings back to datetime for known fields if present."""
    if not doc:
        return doc
    for k in ("created_at", "updated_at", "expires_at", "scheduled_for", "taken_at", "timestamp"):
        v = doc.get(k)
        if isinstance(v, str):
            try:
                doc[k] = datetime.fromisoformat(v)
            except Exception:
                pass
    return doc
