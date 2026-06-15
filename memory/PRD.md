# MediGuard AI – Product Requirements Document

## Problem
Patients struggle with medication safety: missed doses, drug interactions, allergy conflicts, poor adherence, and delayed emergency response. Caregivers lack visibility. MediGuard AI is a production healthcare platform that uses Gemini 3 Pro vision OCR, XGBoost/RandomForest ML models, and OpenStreetMap to read prescriptions, detect safety risks, predict adherence, and guide patients to nearby help.

## User personas
- **Patient** (primary): Uploads prescriptions, tracks doses, asks the AI copilot, activates emergency mode.
- **Caregiver** (secondary): Views patient adherence + alerts via caregiver dashboard.

## Core requirements
- Google OAuth (Emergent) with 7-day server sessions
- Patient onboarding (profile, conditions, allergies, language)
- Prescription OCR via Gemini 3 Pro (images + PDFs)
- AI medicine explanations
- Safety analysis (interactions, duplicates, allergies, pregnancy, elderly, confusion)
- Real ML models: adherence (RandomForest), severity (XGBoost), urgency (XGBoost)
- Risk score 0-100 (rule + ML blended)
- Auto-generated 7-day medication schedule
- Adherence tracking with charts + ML future miss-risk
- AI Copilot (Gemini 3 Pro streaming, RAG-style with prescription context)
- Hindi + English voice (Whisper STT + OpenAI TTS)
- Emergency mode: triage via LLM, ML severity + urgency, OSM Overpass nearby facilities, shareable summary
- Caregiver snapshot (read-only view)
- Light + dark mode, glassmorphism, Framer Motion

## Implementation (2026-06-13)
- Backend: FastAPI + Motor + MongoDB. Routers: auth, profile, prescriptions (OCR pipeline), dose-events, adherence, dashboard, emergency, copilot (SSE), voice (STT/TTS), caregiver.
- ML: persisted joblib artifacts in `/app/backend/ml_artifacts/`, trained on synthetic-but-rule-based data at startup.
- Frontend: React + Tailwind + shadcn, Outfit + Manrope fonts, "Organic & Earthy" palette (deep teal #2B4C3B / coral #E07A5F / sage dark mode).
- Pages: Landing, Login, AuthCallback, Onboarding (3-step), Dashboard, Prescriptions, Schedule, Copilot, Emergency, Caregiver, Settings.

## Backlog / Next
- P1: Multi-prescription cross-checking (active meds across prescriptions for global interactions)
- P1: Push reminder notifications (web push / email)
- P1: Caregiver invite + magic-link read-only access
- P2: Pharmacy stock / price lookup
- P2: PDF report export for doctor visits
- P2: WhatsApp / SMS escalation when missed-dose threshold crossed (Twilio)
- P2: Photo of pill confusion check (visual comparison vs database)
