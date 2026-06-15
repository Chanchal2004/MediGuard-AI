# 🩺 MediGuard AI
### AI-Powered Healthcare Safety & Medication Intelligence Platform

> "Because patient safety should never depend on guesswork."

MediGuard AI is an intelligent healthcare safety platform that helps patients understand prescriptions, manage medications, prevent medication errors, improve adherence, and stay connected with caregivers.

By combining **Gemini AI, Computer Vision OCR, Machine Learning, Emergency Intelligence, Medication Adherence Analytics, and Caregiver Monitoring**, MediGuard AI transforms a simple prescription into a complete healthcare protection system.

---

# 🚨 The Problem

Every day, millions of patients face challenges that directly impact their health and safety:

- Handwritten prescriptions are difficult to understand
- Medication instructions are often confusing
- Patients frequently miss doses
- Drug interactions go unnoticed
- Elderly patients struggle with medicine management
- Family members lack visibility into patient adherence
- Emergency situations are often recognized too late

A single medication mistake can result in complications, hospitalization, or even life-threatening consequences.

Healthcare should not rely on guesswork.

---

# 💡 Our Solution

MediGuard AI acts as an intelligent healthcare companion that continuously assists patients throughout their medication journey.

The platform:

✅ Reads prescriptions automatically

✅ Explains medicines in simple language

✅ Detects medication risks

✅ Generates medication schedules

✅ Predicts adherence issues

✅ Answers medication-related questions

✅ Assists during emergencies

✅ Enables caregiver monitoring

Instead of reacting after problems occur, MediGuard AI helps prevent them before they happen.

---

# 🧠 AI & Machine Learning Innovation

Unlike traditional healthcare apps that simply store information, MediGuard AI actively analyzes, predicts, and assists.

### Gemini Vision OCR

Used for:

- Handwritten prescription reading
- Printed prescription analysis
- Medicine extraction
- Dosage extraction
- Frequency detection

---

### Gemini AI Medical Copilot

Provides:

- Medication explanations
- Drug guidance
- Personalized healthcare assistance
- Context-aware medical responses

---

### Random Forest Model

Used for:

- Medication adherence prediction

Predicts:

- Missed-dose probability
- Adherence score
- Future compliance trends

---

### XGBoost Models

Used for:

- Emergency severity prediction
- Visit urgency prediction
- Risk classification

Outputs:

- Green
- Yellow
- Orange
- Red

severity levels.

---

# 🏗️ Platform Workflow

Patient
↓
Google Authentication
↓
Health Profile Creation
↓
Prescription Upload
↓
Gemini OCR Extraction
↓
Medication Safety Analysis
↓
Machine Learning Risk Prediction
↓
Schedule Generation
↓
AI Medical Copilot
↓
Emergency Assistance
↓
Caregiver Monitoring

---

# 📸 Application Walkthrough

## 🏠 Landing Page

MediGuard AI introduces all core capabilities including Prescription OCR, Safety Analysis, Medication Scheduling, AI Medical Assistance, Emergency Intelligence, and Caregiver Monitoring.

📷 Add Screenshot:
`landing-page.png`

---

## ⚙️ AI Capabilities

The platform showcases its core AI-powered modules including OCR, Machine Learning risk prediction, adherence monitoring, multilingual assistance, and emergency intelligence.

📷 Add Screenshot:
`features-section.png`

---

## 🔄 Patient Journey

A complete medication safety workflow from prescription upload to long-term adherence monitoring.

📷 Add Screenshot:
`patient-journey.png`

---

## 🤖 Machine Learning Engine

Production-ready Machine Learning models process adherence, severity, urgency, and risk predictions in real time.

📷 Add Screenshot:
`ml-engine.png`

---

## 🔐 Secure Authentication

Users securely authenticate using Google Sign-In before accessing personalized healthcare services.

📷 Add Screenshot:
`login-page.png`

---

## 👤 Patient Profile Setup

Users provide personal information including age, gender, language, and weight to personalize recommendations and safety analysis.

📷 Add Screenshot:
`about-you.png`

---

## ❤️ Health Context Collection

Patients specify chronic conditions and allergies.

This context enables safer medication analysis and personalized recommendations.

📷 Add Screenshot:
`health-context.png`

---

## 👨‍👩‍👧 Caregiver Registration

Users can register trusted caregivers who can later monitor medication adherence and risk indicators.

📷 Add Screenshot:
`caregiver-setup.png`

---

# 📊 Main Dashboard

The Overview Dashboard serves as the healthcare command center.

Displays:

- Risk Score
- Adherence Analytics
- Missed Dose Predictions
- Active Medicines
- Safety Alerts

📷 Add Screenshot:
`dashboard-overview.png`

---

# 📄 Prescription Intelligence

Patients upload prescription images or PDFs.

Gemini Vision OCR automatically extracts:

- Medicine names
- Dosages
- Frequencies
- Instructions

without manual entry.

📷 Add Screenshot:
`prescription-analysis.png`

---

# 📅 Smart Medication Scheduling

Automatically generated medication schedules help patients track treatment adherence.

Users can mark medicines as:

- Taken
- Missed

which continuously updates adherence analytics.

📷 Add Screenshot:
`schedule-page.png`

---

# 🤖 AI Medical Copilot

Patients can ask natural-language healthcare questions.

Examples:

- Can I take these medicines together?
- What is this medicine for?
- Are there any risks?

The AI responds using the patient's prescription and health profile.

📷 Add Screenshot:
`ai-copilot.png`

---

# 💊 Pill Verification System

Patients upload pill images.

The system compares visual characteristics against active medications and identifies possible mismatches.

This helps prevent medication confusion.

📷 Add Screenshot:
`pill-check.png`

---

# 🚑 Emergency Intelligence

Patients describe symptoms and location.

Machine Learning models generate:

- Severity Level
- Urgency Level
- Risk Score
- Emergency Summary

and recommend nearby healthcare facilities.

📷 Add Screenshot:
`emergency-page.png`

---

# 👨‍👩‍👧 Caregiver Dashboard

Patients can generate secure caregiver links.

Caregivers can monitor:

- Adherence Score
- Active Medicines
- Risk Indicators
- Safety Alerts
- Escalation Status

📷 Add Screenshot:
`caregiver-dashboard.png`

---

# 🔗 Caregiver Read-Only Portal

A dedicated caregiver interface provides secure access without exposing patient credentials.

📷 Add Screenshot:
`caregiver-view.png`

---

# ⚙️ Settings

Users can update:

- Profile Information
- Language Preferences
- Caregiver Details

ensuring healthcare data remains accurate and current.

📷 Add Screenshot:
`settings-page.png`

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Tailwind CSS
- Framer Motion
- Recharts

Runs on:

```bash
http://localhost:3000
```

---

## Backend

- FastAPI
- Python
- Scikit-Learn
- Gemini API

Runs on:

```bash
http://localhost:8000
```

---

## Database

MongoDB Collections:

- users
- user_sessions
- prescriptions
- patient_profiles
- dose_events
- caregiver_invites
- chat_messages

---

# 🚀 Installation

## Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

---

## Frontend

```bash
cd frontend

npm install

npm start
```

Application URLs:

```bash
Frontend → http://localhost:3000

Backend → http://localhost:8000
```

---

# 🌍 Real-World Impact

MediGuard AI directly addresses critical healthcare challenges by:

- Reducing medication errors
- Improving treatment adherence
- Supporting caregivers
- Enhancing patient safety
- Detecting risks early
- Assisting during emergencies

The platform is particularly valuable for:

- Elderly patients
- Chronic disease patients
- Multi-medication users
- Family caregivers

---

# 🔮 Future Scope

- WhatsApp Caregiver Alerts
- Smart Wearable Integration
- Voice-Based Medication Reminders
- E-Prescription Integration
- Hospital System Integration
- Multi-Language Expansion

---

# 🏆 Vision

MediGuard AI doesn't just read prescriptions — it actively protects patients.

By combining Artificial Intelligence, Machine Learning, and caregiver support into one unified platform, we transform healthcare from reactive treatment to proactive prevention.

Our vision is simple:

**Every prescription understood.**

**Every medicine taken correctly.**

**Every risk detected early.**

**Every patient protected.**

Because one missed dose can become a complication, one medication error can become an emergency, but one intelligent intervention can prevent both.

## MediGuard AI — because patient safety should never depend on guesswork.
