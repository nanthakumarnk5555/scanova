# Scanova — Lattice Health Medical AI & Surveillance Platform

![Scanova Clinical Platform](https://img.shields.io/badge/FDA_21_CFR_820.198-Compliant-emerald?style=for-the-badge)
![AI Model](https://img.shields.io/badge/AI_Model-DenseNet--121_CheXNet-blue?style=for-the-badge)
![Surveillance Agent](https://img.shields.io/badge/Surveillance-Statistical_Drift_%26_SLA-purple?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-100%25_Operational-teal?style=for-the-badge)

**Scanova** is an enterprise-grade medical AI and clinical surveillance platform built for **Lattice Health Systems**. It integrates **DenseNet-121 deep learning** for automated chest radiograph classification (Normal vs Pneumonia) with an autonomous **AI Monitoring Agent** that continuously tracks diagnostic accuracy, statistical drift, inter-observer concordance against radiologist ground truth, and SLA-governed clinical safety alerts.

---

## 🏗️ Architectural Overview & Modules Breakdown

The platform is designed in accordance with **FDA 21 CFR 820.198** post-market surveillance guidelines, **ISO 13485** medical software quality systems, and **HIPAA de-identification standards**.

```
                           ┌──────────────────────────────────────────────┐
                           │      Scanova React.js Web Application        │
                           │  (Dark-mode Clinical UI, Recharts, Grad-CAM) │
                           └──────────────────────┬───────────────────────┘
                                                  │ REST API / JWT
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │            FastAPI Backend Engine            │
                           ├──────────────────────────────────────────────┤
                           │  • RBAC Authentication & Session Guard       │
                           │  • DenseNet-121 Disease Inference & Grad-CAM │
                           │  • Radiologist Comparison & Concordance      │
                           │  • Autonomous AI Monitoring Surveillance     │
                           │  • Statistical Drift Engine (PSI / KS-Test)  │
                           │  • Clinical Alert & SLA Notification System  │
                           │  • ReportLab Regulatory PDF Export Engine    │
                           └──────────────────────┬───────────────────────┘
                                                  │ SQLAlchemy ORM
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │           MySQL 8.0 / SQLite RDBMS           │
                           │  (Users, Images, Predictions, Reports,       │
                           │   Metrics, Drift, Alerts, Append Audit Logs) │
                           └──────────────────────────────────────────────┘
```

### The 10 Core Modules

| # | Module | Core Functionality & Clinical Capability |
|---|---|---|
| **1** | **User Authentication & RBAC** | JWT token authentication, bcrypt password security, role permissions for `clinician`, `radiologist`, and `admin` with 1-click clinical switchers. |
| **2** | **X-Ray Image Upload & Storage** | Multipart radiograph ingestion (PNG, JPEG, DICOM), automated SHA-256 integrity hashing, patient metadata de-identification, and curated sample CXR gallery. |
| **3** | **AI Disease Prediction (DenseNet-121)** | PyTorch DenseNet-121 CheXNet classifier predicting Normal vs Pneumonia, probability breakdown, inference latency tracking, and Grad-CAM localization heatmaps. |
| **4** | **Radiologist Comparison & Adjudication** | Radiologist ground-truth assessment interface, confidence levels, clinical notes, instant Concordant vs Discordant status calculation, and automated feedback loops. |
| **5** | **Model Performance Monitoring Agent** | Autonomous background surveillance agent computing Multi-Window Performance Metrics (All-Time, Rolling 7-Day, Rolling 30-Day): Accuracy, Sensitivity, Specificity, PPV, NPV, F1-Score, Cohen's Kappa, and ROC-AUC. |
| **6** | **Statistical Drift Detection Engine** | Evaluates Population Stability Index (PSI), Kolmogorov-Smirnov 2-sample tests, and KL Divergence between baseline training cohorts and current ingestion streams. |
| **7** | **Alert & Notification System** | SLA countdown timers (24h/48h/72h), severity levels (Critical, High, Medium, Low), incident investigation, and root-cause resolution workflows. |
| **8** | **Executive Dashboard & Analytics** | 6 high-level KPI cards, 14-day performance surveillance trend charts, 2x2 confusion matrix heatmap, quick-action launchpad, and live telemetry audit stream. |
| **9** | **Clinical PDF Report Generation** | ReportLab PDF compilation for individual patient case dossiers (with original CXR, Grad-CAM heatmap, and digital signatures) and aggregate enterprise surveillance reports. |
| **10** | **Database Management & Case Archive** | MySQL relational schema with 8 relational tables, indexes, and full case search/inspection capabilities. |

---

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Recharts, Lucide Icons
- **Backend**: Python 3.14, FastAPI, Uvicorn, SQLAlchemy 2.0, PyMySQL
- **AI & Deep Learning**: PyTorch, Torchvision, DenseNet-121 (CheXNet), OpenCV, NumPy, SciPy, Scikit-Learn
- **PDF Compilation**: ReportLab Enterprise Engine
- **Database**: MySQL 8.0 (with automatic failover to SQLite WAL)

---

## 🚀 Quickstart & Setup Guide

### Option A: 🐳 1-Command Docker Deployment (Recommended)
With [Docker Desktop](https://www.docker.com/) installed, launch the entire multi-container stack (MySQL 8.0 + FastAPI PyTorch Backend + React Nginx Frontend) with a single command:
```bash
docker compose up -d --build
```
- **Frontend App**: `http://localhost:5173` or `http://localhost:80`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **MySQL Database**: `localhost:3306` (`scanova_db`)

To stop:
```bash
docker compose down
```

---

### Option B: 💻 Local Native Development

#### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm

#### 2. Database Configuration
If using MySQL, execute the provided DDL script:
```sql
mysql -u root -p < backend/init_mysql.sql
```
Set the environment variable (optional, defaults automatically to local SQLite WAL mode if unset):
```bash
export DATABASE_URL="mysql+pymysql://scanova_user:ScanovaSecure2026!@localhost:3306/scanova_db"
```

#### 3. Backend Setup & Run
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

#### 4. Frontend Setup & Run
```bash
cd frontend
npm.cmd install
npm.cmd run dev
```
npm.cmd run dev
```
- Web Application: `http://127.0.0.1:5173`

---

## 👥 Demo Personas & Credentials

The platform comes pre-seeded with 3 clinical demo personas:

| Role | Demo Email | Password | Primary Platform View |
|---|---|---|---|
| **Clinician** | `clinician@scanova.health` | `Scanova2026!` | X-Ray Upload, DenseNet-121 Inference, Grad-CAM Viewer |
| **Radiologist** | `radiologist@scanova.health` | `Scanova2026!` | Study Reading Queue, Ground Truth Adjudication, Notes |
| **QA / Admin** | `admin@scanova.health` | `Scanova2026!` | AI Surveillance Agent, Drift Analytics, Incident Response |

---

## 🧪 Testing & Verification

### Running Backend Unit & Integration Tests (15 Tests)
```bash
cd backend
pytest tests/ -v
```

### Running Automated Live System Verification
```bash
python verify_live_api.py
```

---

## 📄 Regulatory & Clinical Compliance
- **FDA 21 CFR 820.198**: Continuous complaint and incident surveillance tracking.
- **ISO 13485:2016**: Medical devices quality management system compliant.
- **HIPAA Privacy Rule**: All patient records de-identified with cryptographic SHA-256 hashes.
