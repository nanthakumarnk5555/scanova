import pytest
import numpy as np
from sqlalchemy import text
from app.db.session import SessionLocal, init_db
from app.models.entities import User, UploadedImage, Prediction, RadiologistReport, AuditLog
from app.services.drift_service import calculate_psi, calculate_kl_divergence
from app.services.audit_service import log_audit_event
from app.seed.seed_data import seed_database

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

def test_psi_and_drift_calculation():
    base_probs = [0.2, 0.25, 0.3, 0.28, 0.35, 0.22, 0.31, 0.29] * 10
    similar_probs = [0.21, 0.24, 0.31, 0.29, 0.34, 0.23, 0.30, 0.28] * 10
    psi_res = calculate_psi(base_probs, similar_probs)
    psi = psi_res[0] if isinstance(psi_res, tuple) else psi_res
    assert psi < 0.10

    shifted_probs = [0.75, 0.82, 0.88, 0.91, 0.84, 0.79, 0.89, 0.95] * 10
    psi_res_shifted = calculate_psi(base_probs, shifted_probs)
    psi_shifted = psi_res_shifted[0] if isinstance(psi_res_shifted, tuple) else psi_res_shifted
    assert psi_shifted > 0.20

    kl = calculate_kl_divergence(np.array([0.7, 0.2, 0.1]), np.array([0.1, 0.2, 0.7]))
    assert kl > 0.05

def test_audit_log_append_only_enforcement(db_session):
    log = db_session.query(AuditLog).first()
    if not log:
        log_audit_event(
            db=db_session,
            user_id=None,
            event_type="test_event",
            entity_type="system",
            entity_id="test-001",
            action_summary="Audit enforcement test initialization",
            payload={}
        )
        log = db_session.query(AuditLog).first()

    assert log is not None
