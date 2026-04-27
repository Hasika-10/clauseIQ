#!/bin/bash
# ClauseIQ Quick Start Script

echo ""
echo "⚖️  ClauseIQ v4 — AI Contract Intelligence"
echo "============================================"
echo ""

# Check for API key
if [ -z "$GEMINI_API_KEY" ] && [ ! -f "backend/.env" ]; then
  echo "⚠️  WARNING: No GEMINI_API_KEY found."
  echo "   Add it to backend/.env before starting."
  echo ""
fi

# Start backend
echo "🚀 Starting backend on port 3001..."
cd backend && npm install --silent && npm start &
BACKEND_PID=$!

sleep 3

# Start frontend
echo "🎨 Starting frontend on port 3000..."
cd ../frontend && npm install --silent && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ ClauseIQ is starting up!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
