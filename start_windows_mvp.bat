@echo off
REM ==============================================================================
REM CSMSS Kanchanwadi Smart Civic & Security Monitoring System
REM Windows Startup Script (ThinkPad P1)
REM ==============================================================================

echo ==================================================================
echo  Starting CSMSS Kanchanwadi Civic Monitor on ThinkPad P1 Edge
echo ==================================================================

python -m backend.database

echo [1/2] Starting Python FastAPI & SQLite Edge Backend on port 8000...
start "CSMSS Backend (Port 8000)" cmd /k "python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000"

echo [2/2] Starting React Vite Frontend on port 3000...
start "CSMSS Frontend (Port 3000)" cmd /k "npm.cmd run dev"

echo.
echo ==================================================================
echo  Both servers started in separate terminal windows!
echo  - Frontend Dashboard: http://localhost:3000
echo  - Backend API Docs:   http://localhost:8000/docs
echo ==================================================================
echo.
