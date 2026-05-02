# Unified CrisisLens Service Boot
# This script handles booting the heavy Python ML PyTorch service and the Next.js frontend concurrently.

Write-Host "Initializing Backend Machine Learning Inference Service..." -ForegroundColor Cyan
Set-Location -Path ".\ml-service"
# Utilizing Uvicorn to host the FastAPI server asynchronously so it doesn't block the UI
Start-Process -FilePath ".\.venv311\Scripts\python.exe" -ArgumentList "-m uvicorn app:app --port 8000 --reload" -WindowStyle Normal

Write-Host "Inference Service Booted on Port 8000." -ForegroundColor Green
Write-Host "Booting Next.js Application Server..." -ForegroundColor Cyan

Set-Location -Path ".."
npm run dev
