#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting CrisisLens Local Environment Setup..."

echo "----------------------------------------"
echo "🐍 1. Setting up Python ML Service..."
echo "----------------------------------------"
cd ml-service
python -m venv .venv
# Activate venv based on OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi

echo "Installing Python dependencies (this might take a moment due to PyTorch)..."
pip install -r requirements.txt
cd ..

echo "----------------------------------------"
echo "⚛️ 2. Setting up Next.js Application..."
echo "----------------------------------------"
npm install

echo "----------------------------------------"
echo "🔄 3. Launching Services..."
echo "----------------------------------------"

# Run Python backend in the background
cd ml-service
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi
uvicorn app:app --port 8000 &
BACKEND_PID=$!
cd ..

# Cleanup background Python process when we close the script
trap "kill $BACKEND_PID" EXIT

# Run Next.js frontend in the foreground
echo "CrisisLens is starting: Frontend (Port 3000) & Backend (Port 8000)..."
npm run dev
