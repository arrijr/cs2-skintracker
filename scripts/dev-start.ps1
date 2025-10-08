# Development Start Script for PowerShell
# Usage: .\scripts\dev-start.ps1

Write-Host "🚀 Starting CS2 Skin Tracker Development Environment..." -ForegroundColor Green

# Start Backend
Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Start Frontend  
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Start Database Studio (optional)
Write-Host "🗄️ Starting Prisma Studio..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npx prisma studio"

Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🗄️ Database: http://localhost:5555" -ForegroundColor Cyan
