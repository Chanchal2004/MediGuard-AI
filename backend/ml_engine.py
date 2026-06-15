"""ML models for MediGuard AI.

Trains real XGBoost (severity, urgency) and RandomForest (adherence)
models at startup on synthetic-but-realistic generated datasets,
persists them with joblib, and provides predict helpers.

The synthetic dataset is generated with explicit clinical rules so the
models learn meaningful decision boundaries (no hardcoded outputs).
"""
from __future__ import annotations

import os
import math
import json
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, List, Tuple

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb


MODEL_DIR = Path(__file__).parent / "ml_artifacts"
MODEL_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Synthetic training data generators – realistic rule-based with noise so
# the ML model actually generalises rather than memorising.
# ---------------------------------------------------------------------------
def _gen_adherence(n=5000, seed=42):
    rng = np.random.default_rng(seed)
    n_meds = rng.integers(1, 8, n)
    complexity = rng.integers(1, 5, n)  # dosing complexity 1-4
    age = rng.integers(18, 95, n)
    history = rng.uniform(0, 1, n)  # past adherence ratio
    reminders_used = rng.uniform(0, 1, n)
    chronic = rng.integers(0, 2, n)

    # Probability of FUTURE miss: more meds + complexity + low history + age extremes
    score = (
        0.06 * n_meds
        + 0.10 * complexity
        + 0.55 * (1 - history)
        - 0.20 * reminders_used
        + 0.04 * (age > 70).astype(float)
        + 0.05 * chronic
    )
    p = 1 / (1 + np.exp(-(score - 0.7) * 3))
    y = (rng.uniform(0, 1, n) < p).astype(int)
    X = np.stack([n_meds, complexity, age, history, reminders_used, chronic], axis=1)
    return X, y


def _gen_severity(n=6000, seed=7):
    rng = np.random.default_rng(seed)
    # features: symptom_severity(0-10), chest_pain(0/1), breathing_difficulty(0/1),
    # confusion(0/1), bleeding(0/1), num_meds, age, chronic_count, fever_c(35-41)
    sev = rng.integers(0, 11, n)
    chest = rng.integers(0, 2, n)
    breath = rng.integers(0, 2, n)
    confusion = rng.integers(0, 2, n)
    bleeding = rng.integers(0, 2, n)
    n_meds = rng.integers(0, 10, n)
    age = rng.integers(0, 95, n)
    chronic = rng.integers(0, 5, n)
    fever = rng.uniform(35.5, 41.0, n)

    raw = (
        0.45 * sev
        + 2.5 * chest
        + 2.2 * breath
        + 1.8 * confusion
        + 2.6 * bleeding
        + 0.15 * n_meds
        + 0.03 * (age > 65).astype(float) * age / 10
        + 0.6 * chronic
        + 1.2 * np.maximum(fever - 38.5, 0)
    )
    # 4-class label
    y = np.zeros(n, dtype=int)
    y[raw > 3] = 1  # yellow
    y[raw > 7] = 2  # orange
    y[raw > 11] = 3  # red

    X = np.stack(
        [sev, chest, breath, confusion, bleeding, n_meds, age, chronic, fever], axis=1
    )
    return X, y


def _gen_urgency(n=5000, seed=11):
    rng = np.random.default_rng(seed)
    sev = rng.integers(0, 11, n)
    risk_score = rng.integers(0, 101, n)
    severe_alerts = rng.integers(0, 5, n)
    age = rng.integers(0, 95, n)
    missed_doses_7d = rng.integers(0, 15, n)
    chronic = rng.integers(0, 5, n)

    raw = (
        0.5 * sev
        + 0.06 * risk_score
        + 1.8 * severe_alerts
        + 0.03 * (age > 65).astype(float) * age / 10
        + 0.2 * missed_doses_7d
        + 0.4 * chronic
    )
    y = np.zeros(n, dtype=int)
    y[raw > 3] = 1   # within 7 days
    y[raw > 6.5] = 2  # within 24 hours
    y[raw > 10] = 3  # immediate
    X = np.stack([sev, risk_score, severe_alerts, age, missed_doses_7d, chronic], axis=1)
    return X, y


SEVERITY_LABELS = ["green", "yellow", "orange", "red"]
URGENCY_LABELS = ["routine", "within_7_days", "within_24_hours", "immediate"]


class MLEngine:
    def __init__(self):
        self.adherence = None
        self.severity = None
        self.urgency = None

    def train_or_load(self):
        adh_path = MODEL_DIR / "adherence.joblib"
        sev_path = MODEL_DIR / "severity.joblib"
        urg_path = MODEL_DIR / "urgency.joblib"

        if adh_path.exists() and sev_path.exists() and urg_path.exists():
            self.adherence = joblib.load(adh_path)
            self.severity = joblib.load(sev_path)
            self.urgency = joblib.load(urg_path)
            return {"loaded": True}

        # Train adherence (RandomForest)
        Xa, ya = _gen_adherence()
        adh = RandomForestClassifier(n_estimators=120, max_depth=10, random_state=1)
        adh.fit(Xa, ya)
        self.adherence = adh
        joblib.dump(adh, adh_path)

        # Train severity (XGBoost multi-class)
        Xs, ys = _gen_severity()
        sev = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=5,
            objective="multi:softprob",
            num_class=4,
            tree_method="hist",
            eval_metric="mlogloss",
        )
        sev.fit(Xs, ys)
        self.severity = sev
        joblib.dump(sev, sev_path)

        # Train urgency (XGBoost multi-class)
        Xu, yu = _gen_urgency()
        urg = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=5,
            objective="multi:softprob",
            num_class=4,
            tree_method="hist",
            eval_metric="mlogloss",
        )
        urg.fit(Xu, yu)
        self.urgency = urg
        joblib.dump(urg, urg_path)
        return {"loaded": False, "trained": True}

    # -------------------- predict helpers ---------------------------------
    def predict_adherence(
        self,
        n_meds: int,
        complexity: int,
        age: int,
        history: float,
        reminders_used: float,
        chronic: int,
    ) -> Tuple[float, str]:
        X = np.array([[n_meds, complexity, age, history, reminders_used, chronic]])
        proba = self.adherence.predict_proba(X)[0]
        miss_prob = float(proba[1])
        if miss_prob > 0.7:
            level = "high"
        elif miss_prob > 0.4:
            level = "moderate"
        else:
            level = "low"
        return miss_prob, level

    def predict_severity(
        self,
        symptom_severity: int,
        chest_pain: int,
        breathing_difficulty: int,
        confusion: int,
        bleeding: int,
        n_meds: int,
        age: int,
        chronic_count: int,
        fever_c: float,
    ) -> Tuple[str, float, Dict[str, float]]:
        X = np.array(
            [[symptom_severity, chest_pain, breathing_difficulty, confusion,
              bleeding, n_meds, age, chronic_count, fever_c]]
        )
        proba = self.severity.predict_proba(X)[0]
        idx = int(np.argmax(proba))
        return SEVERITY_LABELS[idx], float(proba[idx]), {
            SEVERITY_LABELS[i]: float(proba[i]) for i in range(4)
        }

    def predict_urgency(
        self,
        symptom_severity: int,
        risk_score: int,
        severe_alerts: int,
        age: int,
        missed_doses_7d: int,
        chronic_count: int,
    ) -> Tuple[str, float, Dict[str, float]]:
        X = np.array(
            [[symptom_severity, risk_score, severe_alerts, age,
              missed_doses_7d, chronic_count]]
        )
        proba = self.urgency.predict_proba(X)[0]
        idx = int(np.argmax(proba))
        return URGENCY_LABELS[idx], float(proba[idx]), {
            URGENCY_LABELS[i]: float(proba[i]) for i in range(4)
        }


# Risk score blends rule-based clinical factors with ML signals.
def compute_risk_score(
    alerts: list,
    profile: dict | None,
    n_meds: int,
    adherence_miss_prob: float,
    severity_label: str,
) -> int:
    score = 0
    sev_weights = {"mild": 4, "moderate": 10, "severe": 22, "critical": 35}
    for a in alerts:
        score += sev_weights.get(a.get("severity", "mild"), 4)
    if profile:
        age = profile.get("age", 30)
        if age >= 75:
            score += 12
        elif age >= 60:
            score += 7
        if profile.get("pregnant"):
            score += 10
        score += min(len(profile.get("chronic_conditions") or []), 6) * 4
    score += min(n_meds, 10) * 1
    score += int(adherence_miss_prob * 20)
    sev_extra = {"green": 0, "yellow": 8, "orange": 18, "red": 30}
    score += sev_extra.get(severity_label, 0)
    return max(0, min(100, int(score)))


ml_engine = MLEngine()
