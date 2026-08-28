import os
import io
import pytest
from PIL import Image
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal, init_db, Base, engine
from app.models.entities import (
    User, UploadedImage, Prediction, RadiologistReport, PerformanceMetric, DriftEvent, Alert, AuditLog
)
from app.services.auth_service import get_password_hash, create_access_token
from app.services.drift_service import calculate_psi, calculate_kl_divergence, evaluate_drift
from app.services.monitoring_service import run_full_monitoring_cycle, calculate_performance_metrics_for_window
from app.services.report_service import generate_case_pdf_report, generate_surveillance_pdf_report
from app.services.alert_service import check_and_generate_alerts
from app.seed.seed_data import seed_database

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

def test_module_1_user_authentication(db_session: Session):
    import uuid
    test_email = f"test_clinician_{uuid.uuid4().hex[:6]}@scanova.health"
    reg_payload = {
        "email": test_email,
        "password": "Password123!",
        "full_name": "Dr. Test Clinician, MD",
        "role": "clinician"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == reg_payload["email"]
    assert data["user"]["role"] == "clinician"

    login_payload = {
        "email": test_email,
        "password": "Password123!"
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()
    token = token_data["access_token"]
    assert token is not None

    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == reg_payload["email"]


def test_module_2_xray_upload_and_samples(db_session: Session):
    clinician = db_session.query(User).filter(User.role == "clinician").first()
    token = create_access_token(data={"sub": clinician.id, "email": clinician.email, "role": clinician.role})

    res_samples = client.get("/api/v1/xrays/samples", headers={"Authorization": f"Bearer {token}"})
    assert res_samples.status_code == 200
    samples = res_samples.json()
    assert len(samples) > 0

    img = Image.new('L', (224, 224), color=128)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)

    files = {"file": ("test_cxr.jpg", buf, "image/jpeg")}
    data = {
        "patient_id": "TEST_PAT_900",
        "patient_age": 45,
        "patient_sex": "F",
        "site_id": "Main Campus Hospital"
    }

    res_upload = client.post(
        "/api/v1/xrays/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_upload.status_code == 200
    upload_res = res_upload.json()
    assert upload_res["status"] == "success"
    assert "image" in upload_res
    assert upload_res["image"]["patient_age"] == 45


def test_module_3_densenet121_prediction(db_session: Session):
    clinician = db_session.query(User).filter(User.role == "clinician").first()
    token = create_access_token(data={"sub": clinician.id, "email": clinician.email, "role": clinician.role})

    img = Image.new('L', (224, 224), color=140)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)

    files = {"file": ("test_predict_cxr.jpg", buf, "image/jpeg")}
    data = {
        "patient_id": "TEST_PAT_PRED_1",
        "patient_age": 58,
        "patient_sex": "M",
        "site_id": "North Pavilion"
    }

    res = client.post(
        "/api/v1/xrays/upload-and-predict",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "success"
    assert res_data["prediction"]["prediction"] in ["Normal", "Pneumonia"]
    assert 0.0 <= res_data["prediction"]["confidence"] <= 1.0
    assert "latency_ms" in res_data["prediction"]
    assert "heatmap_url" in res_data["prediction"]


def test_module_4_radiologist_comparison(db_session: Session):
    rad_user = db_session.query(User).filter(User.role == "radiologist").first()
    token = create_access_token(data={"sub": rad_user.id, "email": rad_user.email, "role": rad_user.role})

    latest_img = db_session.query(UploadedImage).first()
    assert latest_img is not None

    report_payload = {
        "image_id": latest_img.id,
        "finding_label": "Pneumonia",
        "confidence_level": "High",
        "clinical_notes": "Dense consolidation in right lower lobe consistent with lobar pneumonia.",
        "radiologist_id_code": "RAD_702",
        "radiologist_name": "Dr. Julian Reed, MD"
    }

    res = client.post("/api/v1/radiologist/report", json=report_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["report"]["agreement_status"] in ["Concordant", "Discordant"]

    res_queue = client.get("/api/v1/radiologist/discordance-queue", headers={"Authorization": f"Bearer {token}"})
    assert res_queue.status_code == 200
    queue_data = res_queue.json()
    assert "total_discordant" in queue_data


def test_module_5_ai_monitoring_agent(db_session: Session):
    admin = db_session.query(User).filter(User.role == "admin").first()
    token = create_access_token(data={"sub": admin.id, "email": admin.email, "role": admin.role})

    res_metrics = client.get("/api/v1/monitoring/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res_metrics.status_code == 200
    metrics_data = res_metrics.json()
    assert "all_time" in metrics_data
    assert metrics_data["all_time"]["accuracy"] > 0.50
    assert metrics_data["all_time"]["sensitivity"] > 0.50
    assert metrics_data["all_time"]["specificity"] > 0.50

    res_trends = client.get("/api/v1/monitoring/trends", headers={"Authorization": f"Bearer {token}"})
    assert res_trends.status_code == 200
    trends_data = res_trends.json()
    assert len(trends_data["trend_points"]) > 0

    res_eval = client.post("/api/v1/monitoring/evaluate", headers={"Authorization": f"Bearer {token}"})
    assert res_eval.status_code == 200
    assert res_eval.json()["status"] == "success"


def test_module_6_drift_detection(db_session: Session):
    base_probs = [0.2, 0.25, 0.3, 0.28, 0.35, 0.22, 0.31, 0.29] * 10
    similar_probs = [0.21, 0.24, 0.31, 0.29, 0.34, 0.23, 0.30, 0.28] * 10
    psi_res = calculate_psi(base_probs, similar_probs)
    psi_stable = psi_res[0] if isinstance(psi_res, tuple) else psi_res
    assert psi_stable < 0.10

    shifted_probs = [0.75, 0.82, 0.88, 0.91, 0.84, 0.79, 0.89, 0.95] * 10
    psi_res_shifted = calculate_psi(base_probs, shifted_probs)
    psi_drifted = psi_res_shifted[0] if isinstance(psi_res_shifted, tuple) else psi_res_shifted
    assert psi_drifted > 0.20

    # KL Divergence check
    kl = calculate_kl_divergence(np.array([0.7, 0.2, 0.1]), np.array([0.1, 0.2, 0.7]))
    assert kl > 0.05

    admin = db_session.query(User).filter(User.role == "admin").first()
    token = create_access_token(data={"sub": admin.id, "email": admin.email, "role": admin.role})

    res_drift = client.get("/api/v1/drift/status", headers={"Authorization": f"Bearer {token}"})
    assert res_drift.status_code == 200
    drift_data = res_drift.json()
    assert "drift_event" in drift_data
    assert "histogram_comparison" in drift_data


def test_module_7_alerts_and_notifications(db_session: Session):
    admin = db_session.query(User).filter(User.role == "admin").first()
    token = create_access_token(data={"sub": admin.id, "email": admin.email, "role": admin.role})

    res_alerts = client.get("/api/v1/alerts/", headers={"Authorization": f"Bearer {token}"})
    assert res_alerts.status_code == 200
    alerts_data = res_alerts.json()
    assert alerts_data["total_count"] > 0

    target_alert = alerts_data["alerts"][0]
    alert_id = target_alert["id"]

    res_ack = client.patch(f"/api/v1/alerts/{alert_id}/acknowledge", headers={"Authorization": f"Bearer {token}"})
    assert res_ack.status_code == 200
    assert res_ack.json()["alert"]["status"] == "Investigating"

    res_res = client.patch(
        f"/api/v1/alerts/{alert_id}/resolve",
        json={"status": "Resolved", "resolution_notes": "Investigated sensor noise. Recalibrated scanner."},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_res.status_code == 200
    assert res_res.json()["alert"]["status"] == "Resolved"


def test_module_8_predictions_history(db_session: Session):
    clinician = db_session.query(User).filter(User.role == "clinician").first()
    token = create_access_token(data={"sub": clinician.id, "email": clinician.email, "role": clinician.role})

    res = client.get("/api/v1/predictions/history?limit=10", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "cases" in data
    assert len(data["cases"]) > 0


def test_module_9_pdf_report_generation(db_session: Session):
    admin = db_session.query(User).filter(User.role == "admin").first()
    token = create_access_token(data={"sub": admin.id, "email": admin.email, "role": admin.role})

    latest_img = db_session.query(UploadedImage).first()
    assert latest_img is not None

    res_case_pdf = client.get(f"/api/v1/reports/case/{latest_img.id}/pdf", headers={"Authorization": f"Bearer {token}"})
    assert res_case_pdf.status_code == 200
    assert res_case_pdf.headers["content-type"] == "application/pdf"
    assert len(res_case_pdf.content) > 1000

    res_surv_pdf = client.get("/api/v1/reports/surveillance/pdf", headers={"Authorization": f"Bearer {token}"})
    assert res_surv_pdf.status_code == 200
    assert res_surv_pdf.headers["content-type"] == "application/pdf"
    assert len(res_surv_pdf.content) > 1000


def test_module_10_database_and_audit(db_session: Session):
    users_count = db_session.query(User).count()
    images_count = db_session.query(UploadedImage).count()
    preds_count = db_session.query(Prediction).count()
    rads_count = db_session.query(RadiologistReport).count()
    perf_count = db_session.query(PerformanceMetric).count()
    drift_count = db_session.query(DriftEvent).count()
    alerts_count = db_session.query(Alert).count()

    assert users_count >= 3
    assert images_count >= 10
    assert preds_count >= 10
    assert rads_count >= 10
    assert perf_count >= 1
    assert drift_count >= 1
    assert alerts_count >= 1
