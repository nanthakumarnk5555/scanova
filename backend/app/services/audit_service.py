import json
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import AuditLog

def log_audit_event(
    db: Session,
    user_id: str = None,
    event_type: str = "general_event",
    entity_type: str = "system",
    entity_id: str = "none",
    action_summary: str = "",
    payload: dict = None
) -> AuditLog:
    """
    Logs an audit event with SHA-256 integrity hash.
    """
    payload = payload or {}
    ts = datetime.now(timezone.utc).isoformat()
    
    hash_material = f"{user_id}|{event_type}|{entity_type}|{entity_id}|{action_summary}|{json.dumps(payload, sort_keys=True)}|{ts}"
    sha256_hash = hashlib.sha256(hash_material.encode("utf-8")).hexdigest()
    
    audit_entry = AuditLog(
        user_id=user_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        action_summary=action_summary,
        payload=payload,
        sha256_hash=sha256_hash,
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry

