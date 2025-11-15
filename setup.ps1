# Microservices Graph Manager - Setup Script

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Microservices Graph Manager Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Setup Backend
Write-Host "Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host "Please edit backend/.env with your Neo4j credentials before running the app" -ForegroundColor Magenta
}

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..
Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Setup Frontend
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..
Write-Host "Frontend setup complete!" -ForegroundColor Green
Write-Host ""

# Final instructions
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Make sure Neo4j is running (see README.md for Docker instructions)" -ForegroundColor White
Write-Host "2. Update backend/.env with your Neo4j credentials" -ForegroundColor White
Write-Host "3. Start the backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "4. Start the frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Default URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  Neo4j:    http://localhost:7474" -ForegroundColor White
Write-Host ""
