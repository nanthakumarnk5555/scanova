@echo off
title Scanova AI - Backend Server (FastAPI + PyTorch)
color 0A
echo ===================================================================
echo   SCANOVA.AI - Clinical Radiomics AI Backend Engine
echo   API Base: http://127.0.0.1:8000
echo   Swagger Docs: http://127.0.0.1:8000/docs
echo ===================================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
if %errorlevel% neq 0 (
    echo.
    echo Error starting FastAPI backend. Checking requirements...
    pip install -r requirements.txt
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)
pause
