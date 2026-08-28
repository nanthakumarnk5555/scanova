import os
import sys
import io
import pytest

# Ensure backend and model are on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.db.session import init_db, SessionLocal
from app.models.entities import UploadedImage, Prediction, RadiologistReport, User

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "DenseNet-121" in data["ai_model"]

def test_auth_flow():
    # 1. Register
    reg_payload = {
        "email": "test_clinician_99@scanova.health",
        "password": "SecurePassword123!",
        "full_name": "Dr. Test Clinician",
        "role": "clinician"
    }
    r = client.post("/api/v1/auth/register", json=reg_payload)
    if r.status_code == 400:
        # already registered
        pass
    else:
        assert r.status_code == 200
        assert "access_token" in r.json()

    # 2. Login
    login_payload = {
        "email": "test_clinician_99@scanova.health",
        "password": "SecurePassword123!"
    }
    r_login = client.post("/api/v1/auth/login", json=login_payload)
    assert r_login.status_code == 200
    token = r_login.json()["access_token"]
    assert token is not None

    # 3. Get /me
    r_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "test_clinician_99@scanova.health"

def test_samples_and_upload_flow():
    # 1. List samples
    r_samples = client.get("/api/v1/xrays/samples")
    assert r_samples.status_code == 200
    samples = r_samples.json()
    assert len(samples) > 0

    # 2. Upload and predict directly with a synthetic byte image
    img = Image.new("RGB", (256, 256), color=(40, 40, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_upload_cxr.jpg", buf, "image/jpeg")}
    data = {
        "patient_id": "PAT-TEST-001",
        "patient_age": "45",
        "patient_sex": "F",
        "site_id": "Unit Test Facility"
    }

    r_upload = client.post("/api/v1/xrays/upload-and-predict", files=files, data=data)
    assert r_upload.status_code == 200
    res = r_upload.json()
    assert res["status"] == "success"
    assert "image" in res
    assert "prediction" in res
    assert res["prediction"]["prediction"] in ["Normal", "Pneumonia"]
    assert 0.0 <= res["prediction"]["confidence"] <= 1.0

    image_id = res["image"]["id"]

    # 3. Submit Radiologist Ground Truth
    rad_payload = {
        "image_id": image_id,
        "finding_label": "Normal",
        "confidence_level": "High",
        "clinical_notes": "Clear lung fields, sharp costophrenic angles.",
        "radiologist_id_code": "RAD_TEST",
        "radiologist_name": "Dr. Test Radiologist, MD"
    }
    r_rad = client.post("/api/v1/radiologist/report", json=rad_payload)
    assert r_rad.status_code == 200
    rad_res = r_rad.json()
    assert rad_res["report"]["agreement_status"] in ["Concordant", "Discordant"]

    # 4. Check Monitoring Metrics & Drift
    r_metrics = client.get("/api/v1/monitoring/metrics")
    assert r_metrics.status_code == 200
    m_data = r_metrics.json()
    assert m_data["all_time"]["sample_size"] > 0
    assert 0.0 <= m_data["all_time"]["accuracy"] <= 1.0

    r_drift = client.get("/api/v1/drift/status")
    assert r_drift.status_code == 200
    d_data = r_drift.json()
    assert d_data["drift_event"]["drift_status"] in ["None", "Moderate", "Severe"]

    # 5. Check Alerts
    r_alerts = client.get("/api/v1/alerts/")
    assert r_alerts.status_code == 200
    assert "alerts" in r_alerts.json()

    # 6. Test Case PDF Report Generation
    r_case_pdf = client.get(f"/api/v1/reports/case/{image_id}/pdf")
    assert r_case_pdf.status_code == 200
    assert r_case_pdf.headers["content-type"] == "application/pdf"

    # 7. Test Surveillance Executive PDF Report Generation
    r_surv_pdf = client.get("/api/v1/reports/surveillance/pdf")
    assert r_surv_pdf.status_code == 200
    assert r_surv_pdf.headers["content-type"] == "application/pdf"
