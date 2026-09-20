import time
import logging
from collections import defaultdict
from datetime import datetime, timezone
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import init_db, SessionLocal
from app.seed.seed_data import seed_database
from app.api.v1 import auth, xrays, predictions, radiologist, monitoring, drift, alerts, reports, simulation, governance

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("LatticeHealthPlatform")

app = FastAPI(
    title="Lattice Health — AI Governance as a Managed Service for Hospitals",
    description="See every AI model running in your hospital, before it surprises you. Continuous drift, fairness, posture, and reader pushback monitoring with 07:00 AM cryptographically signed governance reports.",
    version="2.5.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sliding window rate limiter
client_request_counts = defaultdict(list)

@app.middleware("http")
async def rate_limit_and_metrics_middleware(request: Request, call_next):
    start_time = time.time()
    client_ip = request.client.host if request.client else "127.0.0.1"
    current_ts = time.time()
    
    # Sliding 60s window
    client_request_counts[client_ip] = [
        ts for ts in client_request_counts[client_ip] if current_ts - ts < 60
    ]
    
    if len(client_request_counts[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded (300 requests/min). Compliance throttle active."}
        )
    
    client_request_counts[client_ip].append(current_ts)
    
    response: Response = await call_next(request)
    
    duration_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Lattice-Health-Governance"] = "Active"
    response.headers["X-Response-Time-MS"] = str(duration_ms)
    return response

# Register API v1 Routers
api_v1 = FastAPI()
api_v1.include_router(auth.router)
api_v1.include_router(governance.router)
api_v1.include_router(xrays.router)
api_v1.include_router(predictions.router)
api_v1.include_router(radiologist.router)
api_v1.include_router(monitoring.router)
api_v1.include_router(drift.router)
api_v1.include_router(alerts.router)
api_v1.include_router(reports.router)
api_v1.include_router(simulation.router)

app.mount("/api/v1", api_v1)
app.mount("/api", api_v1)

# Serve sample data images if directory exists
if settings.SAMPLE_DATA_DIR:
    app.mount("/samples", StaticFiles(directory=settings.SAMPLE_DATA_DIR), name="samples")

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Scanova Database Schema & Triggers...")
    init_db()
    with SessionLocal() as db:
        seed_database(db)
    logger.info("Scanova Platform initialized and ready.")

@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "name": "Scanova Medical AI Platform API",
        "version": "2.5.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Scanova Medical AI Engine",
        "system": "Lattice Health",
        "ai_model": "DenseNet-121 (Chest X-Ray Pneumonia Classifier)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

