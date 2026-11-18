#!/bin/bash
echo "=================================================================="
echo " Starting CSMSS Kanchanwadi Civic Monitor on ThinkPad P1 Edge"
echo "=================================================================="

python3 -m backend.database
python3 -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
