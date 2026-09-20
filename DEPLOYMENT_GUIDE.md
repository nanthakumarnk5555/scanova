# 🚀 Scanova AI — Complete Publishing & Deployment Guide

This guide provides everything you need to publish and deploy the **Scanova AI Clinical Radiology & AI Governance Platform**.

---

## ⚡ Option 1: Instant 1-Click Publishing on Vercel (Recommended)

Thanks to the **built-in standalone AI simulation & Grad-CAM engine**, your project works immediately upon publishing to Vercel with zero extra server setup!

### Step 1: Push Your Code to GitHub
```bash
git add .
git commit -m "Update project for cloud publishing with standalone AI engine"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... ➔ Project**.
2. Select your `scanova` GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `cd frontend && npm install && npm run build` (automatically picked up from `vercel.json`)
   - **Output Directory**: `frontend/dist`
4. Click **Deploy**.

> [!TIP]
> **What works immediately on Vercel:**
> - Full User Authentication (Radiologist, Clinician, Safety QA personas)
> - Image Upload & CXR Validation
> - DenseNet-121 Inference with Biomarkers (Cardiothoracic Ratio, Aeration, Symmetry)
> - Real-Time Grad-CAM Thermal Overlays rendered on HTML5 Canvas
> - Interactive Split-Curtain & Side-by-Side Radiograph Visualizer
> - Radiologist Ground Truth Review & Concordance Scoring
> - Daily 07:00 AM Cryptographically Signed Governance Reports
> - HHS Section 1557 Algorithmic Bias & Subgroup Fairness Dashboards
> - Population Stability Index (PSI) Drift Analytics & Safety Alerts

---

## 🌐 Option 2: Full-Stack Cloud Deployment (Vercel + Live Python Backend)

If you want your live PyTorch DenseNet-121 model and SQLite/MySQL database hosted on a cloud server:

### Step 1: Deploy Python Backend to Render (Free)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New ➔ Web Service** (or **Blueprint** using `render.yaml`).
2. Connect your GitHub repository.
3. Choose **Python** as the environment:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, add:
   - `ENVIRONMENT`: `production`
   - `DATABASE_URL`: `sqlite:////tmp/scanova_surveillance.db` *(or your cloud MySQL URL)*
   - `JWT_SECRET`: `your-random-secret-key`
5. Click **Create Web Service**.
6. Once deployed, copy your Render service URL (e.g., `https://scanova-ai-backend.onrender.com`).

### Step 2: Connect Frontend to Backend on Vercel
1. Open your project on the [Vercel Dashboard](https://vercel.com/).
2. Navigate to **Settings ➔ Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://scanova-ai-backend.onrender.com` *(your Render URL without trailing slash)*
4. Go to **Deployments** and click **Redeploy**.

---

## 🐳 Option 3: Local / Docker Deployment

To run the complete stack locally or on a private VPS using Docker:

```bash
docker compose up --build -d
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **MySQL Database**: `localhost:3306`

---

## 🔑 Default Demo Login Credentials

You can log in with any of these pre-configured clinical personas:

| Persona | Email | Password | Role Access |
|---|---|---|---|
| **Lead Thoracic Radiologist** | `radiologist@scanova.health` | `Scanova2026!` | Doctor Review, Ground Truth, Adjudication |
| **Emergency Clinician** | `clinician@scanova.health` | `Scanova2026!` | CXR Upload, Live DenseNet-121 Studio |
| **AI Safety & QA Officer** | `admin@scanova.health` | `ScanovaAdmin2026!` | Governance, Drift, Fairness, Morning Reports |
