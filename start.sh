#!/bin/bash

# Start script for Aisle - Agentic AI Checkout

echo "🚀 Starting Aisle..."

# Kill any existing processes on ports 3000 and 8000
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:8000) 2>/dev/null

# Start backend
echo "📦 Starting backend server..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip3 install -r requirements.txt -q
python3 main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Check frontend dependencies
echo "🔍 Checking frontend dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 node_modules not found. Installing dependencies..."
    npm install
else
    echo "✅ node_modules already exists."
fi

# Start frontend
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Aisle is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID