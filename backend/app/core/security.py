import os
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
import jwt
from app.core.config import settings

ROLE_PERMISSIONS = {
    "admin": ["read", "write", "manage_users", "manage_models", "adjudicate", "export_compliance", "configure_thresholds"],
    "clinical_qa": ["read", "adjudicate", "export_compliance", "view_alerts", "comment"],
    "biomedical_engineer": ["read", "manage_models", "view_alerts", "configure_thresholds", "export_compliance"],
    "compliance_officer": ["read", "export_compliance", "view_audit_logs", "view_alerts"],
    "auditor": ["read", "export_compliance", "view_audit_logs"]
}

def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    kdf = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"pbkdf2_sha256${salt.hex()}${kdf.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split('$')
        if len(parts) != 3 or parts[0] != 'pbkdf2_sha256':
            return False
        salt = bytes.fromhex(parts[1])
        stored_kdf = bytes.fromhex(parts[2])
        computed_kdf = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(stored_kdf, computed_kdf)
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], role: str, tenant_id: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": tenant_id
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
