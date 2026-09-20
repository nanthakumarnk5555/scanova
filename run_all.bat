@echo off
title Scanova AI - Complete System Master Launcher
color 0E
echo ===================================================================
echo   SCANOVA.AI - Clinical Diagnostic & Radiomics System
echo   Launching Full Stack (Backend + Frontend)
echo ===================================================================
echo.
echo [1/2] Starting FastAPI + PyTorch Backend on Port 8000...
start "Scanova Backend Server (Port 8000)" cmd /c "%~dp0run_backend.bat"

echo [2/2] Starting React + Vite Diagnostic Frontend on Port 5173...
start "Scanova Frontend Suite (Port 5173)" cmd /c "%~dp0run_frontend.bat"

echo.
echo ===================================================================
echo   All servers initialized successfully!
echo   Opening Clinical Diagnostic Studio in your default browser...
echo ===================================================================
timeout /t 3 /nobreak >nul
start http://localhost:5173
exit
