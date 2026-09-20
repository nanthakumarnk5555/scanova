import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Scanova Medical AI Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "scanova-super-secure-clinical-jwt-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # DB URL: Connects to DATABASE_URL if provided, else falls back to robust local SQLite
    _DEFAULT_DB_PATH: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scanova_surveillance.db")).replace("\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_DEFAULT_DB_PATH}")
    
    # Base uploads and reports directories
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads", "xrays")
    HEATMAP_DIR: str = os.path.join(BASE_DIR, "uploads", "heatmaps")
    REPORT_DIR: str = os.path.join(BASE_DIR, "uploads", "reports")
    SAMPLE_DATA_DIR: str = os.path.join(BASE_DIR, "sample_data") if os.path.exists(os.path.join(BASE_DIR, "sample_data")) else os.path.abspath(os.path.join(BASE_DIR, "..", "sample_data"))
    
    CORS_ORIGINS: List[str] = [
        "*"
    ]
    
    # Guardrails & Monitoring Thresholds
    MIN_SAMPLE_SIZE_GUARDRAIL: int = 10
    DEFAULT_PSI_THRESHOLD: float = 0.20
    DEFAULT_SENSITIVITY_DROP_THRESHOLD: float = 0.05
    DEFAULT_AGREEMENT_DROP_THRESHOLD: float = 0.85
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 300

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
for folder in [settings.UPLOAD_DIR, settings.HEATMAP_DIR, settings.REPORT_DIR]:
    os.makedirs(folder, exist_ok=True)
