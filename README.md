# 🍃 CarbonAware — Carbon Footprint & Behavioural Awareness Platform

[![FastAPI Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License: Custom Proprietary](https://img.shields.io/badge/License-Proprietary%20Non--Commercial-red.svg)](LICENSE.txt)
[![Tests Passing](https://img.shields.io/badge/Tests-39%20Passed-brightgreen.svg)](backend/tests/)

> "Raw Carbon Data → Personal Understanding → Actionable Decisions → Behavior Change"

CarbonAware is a premium, web-based platform designed to shift the focus from abstract, static carbon calculations to **actionable behavioral changes** through dynamic context-aware nudging, personalized baseline calculations, and interactive visualizations.

---

## 📖 Table of Contents

1. [Key Features](#-key-features)
2. [Technical Architecture](#%EF%B8%8F-technical-architecture)
3. [Screenshots & Asset Organization](#-screenshots--asset-organization)
4. [Getting Started & Local Setup](#-getting-started--local-setup)
   - [Linux Setup](#1-linux-setup)
   - [Windows Setup](#2-windows-setup)
   - [macOS Setup](#3-macos-setup)
   - [Docker Compose (Universal)](#4-docker-compose-universal)
5. [Security & Compliance](#-security--compliance)
6. [Offline Resiliency & Fallback](#-offline-resiliency--fallback)
7. [Running the Test Suite](#-running-the-test-suite)
8. [Author & Contact](#-author--contact)
9. [License](#-license)

---

## 🌟 Key Features

*   **Custom Baseline Onboarding**: Rather than comparing you to generic national averages, CarbonAware builds a personalized footprint baseline based on your transit, diet, and heating habits. All savings are tracked relative to *your* baseline.
*   **The Digital Forest**: Visualizes carbon savings as a growing forest. Every **12 kg of CO₂e** saved grows a new tree in your digital landscape, keeping users motivated.
*   **Priority Nudge Engine**: A 4-priority nudge advisor analyzing your history. It highlights fast fashion impact, AC usage patterns, dietary switches, and solo-driving habits, using priority-ranked rules to display the most critical interventions first.
*   **What-If Simulator**: An interactive playground spanning all categories (Transit, Food, Energy, Shopping). Adjust the sliders to see what savings look like in terms of equivalencies (e.g. smartphone charges, TV hours, or days running a fridge).
*   **Dynamic Impact Breakdown**: Compiles data logs to generate visual percentage charts of your main emission categories and total carbon saved.
*   **Offline First Mode**: Full-featured client-side calculations and persistence (`localStorage`) let the app remain functional even if backend communication fails.

---

## 🛠 Technical Architecture

```
                      +-----------------------------+
                      |        User's Browser       |
                      +--------------+--------------+
                                     |
                +--------------------+--------------------+
                | (Online API calls)                      | (Offline local fallback)
                ▼                                         ▼
+-------------------------------+               +-------------------+
|    Vite React Frontend        |               |   Local Storage   |
|  - React SPA (Vite + TS)      |               |  - Offline Cache  |
|  - Accessibility First (a11y) |               |  - Mock calculations|
+---------------+---------------+               +-------------------+
                |
                | REST API (JSON / CORS Secure)
                ▼
+-------------------------------+
|      FastAPI Backend          |
|  - Rate Limiter (SlowAPI)     |
|  - Dynamic Nudge Logic        |
|  - Security Header Middleware |
+---------------+---------------+
                |
                ▼
+-------------------------------+
|      Repository Layer         |
|  - MockMemory (Default / Dev) |
|  - Google Firestore (Prod)    |
+-------------------------------+
```

---

## 📸 Screenshots & Asset Organization

To display screenshots in the application documentation, please capture the following screens and place them in the `/docs/assets/` directory of this project repository:

1.  **`onboarding.png`**  
    *Location to save:* `/docs/assets/onboarding.png`  
    *Page to capture:* The initial 2-step onboarding screen when visiting the application for the first time.
2.  **`dashboard.png`**  
    *Location to save:* `/docs/assets/dashboard.png`  
    *Page to capture:* The main dashboard route (`/`) showing the Digital Forest, current streaks, smart nudges, and the active weekly challenge.
3.  **`impact_breakdown.png`**  
    *Location to save:* `/docs/assets/impact_breakdown.png`  
    *Page to capture:* The bottom portion of the dashboard showing the dynamic pie/bar charts and the worst-category spotlight (appears after logging 2+ activities).
4.  **`simulator.png`**  
    *Location to save:* `/docs/assets/simulator.png`  
    *Page to capture:* The What-If Simulator route (`/simulator`) showing the interactive sliders, category buttons, and baseline-comparison cards.
5.  **`logs_history.png`**  
    *Location to save:* `/docs/assets/logs_history.png`  
    *Page to capture:* The Activity Logs route (`/history`) showing the semantic tabular view of all logged carbon-saving choices.

---

## 💻 Getting Started & Local Setup

Clone this repository and choose the startup process for your operating system:

```bash
git clone https://github.com/arsinghin/Carbon_Footprint_Awareness.git
cd Carbon_Footprint_Awareness
```

### 1. Linux Setup

#### Prerequisites
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm -y
```

#### Run the Backend
```bash
# From root directory
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=backend python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

#### Run the Frontend
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```

---

### 2. Windows Setup

#### Prerequisites
- Install **Python 3.11+** from the Microsoft Store or official website (ensure "Add to PATH" is ticked).
- Install **Node.js LTS** from the official website.

#### Run the Backend
Using PowerShell or CMD:
```powershell
# From root directory
python -m venv venv
.\venv\Scripts\Activate.ps1   # PowerShell
# or .\venv\Scripts\activate.bat (Command Prompt)

pip install -r backend/requirements.txt
$env:PYTHONPATH="backend"     # PowerShell
# or set PYTHONPATH=backend (Command Prompt)

python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

#### Run the Frontend
Using a new shell window:
```powershell
cd frontend
npm install
npm run dev
```

---

### 3. macOS Setup

#### Prerequisites
Install Homebrew if not present, then install Python and Node.js:
```bash
brew install python node
```

#### Run the Backend
```bash
# From root directory
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=backend python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

#### Run the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

---

### 4. Docker Compose (Universal)

If you have Docker and Docker Compose installed, you can spin up both frontend and backend concurrently without installing language toolchains locally:

```bash
docker-compose up --build
```
*   **Frontend Dashboard:** Available at `http://localhost:5173`
*   **Backend FastAPI:** Available at `http://localhost:8080`
*   **Interactive Swagger Documentation:** Available at `http://localhost:8080/docs` (Development mode only)

---

## 🔒 Security & Compliance

CarbonAware implements modern cloud-native security standards:
1.  **Secure Header Middleware**: Emits strict `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and customized `Permissions-Policy`.
2.  **Strict Transport Security (HSTS)**: Active when the `ENVIRONMENT` variable is configured to `production`.
3.  **CORS Lockdowns**: REST API origins are restricted to explicit origins via `CORS_ORIGINS` config environment variables.
4.  **No PII Logs**: Logs are sanitized to prevent accidental leaks of Firebase UIDs.
5.  **Rate Limiting**: Critical endpoints (activity logging, onboarding, and insight generation) are guarded against abuse using `slowapi` decorators.

---

## 🔌 Offline Resiliency & Fallback

A key feature of the platform is its robust offline design:
- The React application continuously monitors network states.
- If backend requests fail, a global `isOffline` context banner appears.
- All carbon calculations, equivalents (TV hours, smartphone charges, tree absorption), and onboarding baseline comparisons are computed client-side using embedded coefficients.
- Data is securely persisted into the browser's `localStorage` and synced when connectivity is restored.

---

## 🧪 Running the Test Suite

Our robust test suite validates emission calculations, streak handling, nudge prioritizations, database mock merges, and security policies.

To run the backend tests:
```bash
# Activate your virtual environment first
source venv/bin/activate # Linux/macOS
# or .\venv\Scripts\Activate.ps1 # Windows

PYTHONPATH=backend pytest backend/tests/ -v
```

---

## 👥 Author & Contact

**Alok Ranjan Singh**
*   **LinkedIn Profile**: [https://www.linkedin.com/in/arsinghin](https://www.linkedin.com/in/arsinghin)
*   **GitHub**: [@arsinghin](https://github.com/arsinghin)

Feel free to connect or contact regarding questions about this implementation.

---

## 📄 License

This repository is distributed under a custom **Proprietary Non-Commercial License**.  
Commercial distribution, modification for sale, or hosting as a paid SaaS is strictly prohibited.  
Refer to [LICENSE.txt](LICENSE.txt) and [NOTICE](NOTICE) files for permitted and prohibited uses.  
Copyright (c) 2026 Alok Ranjan Singh. All rights reserved.
