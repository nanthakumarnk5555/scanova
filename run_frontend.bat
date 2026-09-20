@echo off
title Scanova AI - Frontend Diagnostic Studio (React + Vite)
color 0B
echo ===================================================================
echo   SCANOVA.AI - Clinical Radiology Frontend Suite
echo   Studio URL: http://localhost:5173
echo ===================================================================
cd /d "%~dp0frontend"
npm.cmd run dev
if %errorlevel% neq 0 (
    echo.
    echo Error starting frontend dev server. Checking npm dependencies...
    npm.cmd install
    npm.cmd run dev
)
pause
