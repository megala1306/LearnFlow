# 🧬 LearnFlow: Unified Mainframe Startup
# This script launches all three cognitive layers in parallel.

Write-Host "--- 🧬 STARTING LEARNFLOW MAINFRAME ---" -ForegroundColor Cyan

# 1. Start ML Service (Intelligence Layer)
Write-Host "[1/3] Awakening Neural Engine (ML Service)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python ml-service/main.py"

# 2. Start Backend (Logic Layer)
Write-Host "[2/3] Initializing Main API Gateway (Backend)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# 3. Start Frontend (Interface Layer)
Write-Host "[3/3] Opening Neural Interface (Frontend)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "--- ✅ ALL LAYERS INITIALIZED ---" -ForegroundColor Green
Write-Host "The cognitive ecosystem is now active!"
