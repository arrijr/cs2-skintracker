# Test environment and prepare for live testing
param(
    [switch]$Seed = $false,
    [switch]$StartDevServers = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== CS2 SKIN TRACKER - LIVE TEST SETUP ===" -ForegroundColor Cyan
Write-Host ""

# Check environment files
Write-Host "Step 1: Verifying configuration files..." -ForegroundColor Yellow
$backendEnv = "C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker\backend\.env"
$frontendEnv = "C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker\frontend\.env.local"

if (Test-Path $backendEnv) {
    Write-Host "✓ Backend .env found" -ForegroundColor Green
    $dbUrl = Select-String -Path $backendEnv -Pattern "DATABASE_URL" | Select-Object -First 1
    if ($dbUrl) { Write-Host "  - DATABASE_URL: Configured (Supabase)" }
} else {
    Write-Host "✗ Backend .env NOT FOUND" -ForegroundColor Red
    exit 1
}

if (Test-Path $frontendEnv) {
    Write-Host "✓ Frontend .env.local found" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend .env.local will use defaults" -ForegroundColor Yellow
}

# Check Node.js
Write-Host "`nStep 2: Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✓ npm: $npmVersion" -ForegroundColor Green

# Navigate to backend and test Prisma
Write-Host "`nStep 3: Testing Prisma setup..." -ForegroundColor Yellow
Push-Location "C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker\backend"

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma generation failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Database connectivity test
Write-Host "`nStep 4: Testing database connectivity..." -ForegroundColor Yellow
$dbTestScript = @'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Supabase database connection: SUCCESS');

    const counts = await Promise.all([
      prisma.user.count(),
      prisma.skin.count(),
      prisma.priceHistory.count(),
    ]);

    console.log(`\nDatabase summary:`);
    console.log(`  Users: ${counts[0]}`);
    console.log(`  Skins: ${counts[1]}`);
    console.log(`  Price History: ${counts[2]}`);

  } catch (e) {
    console.error('✗ Connection failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
'@

$dbTestScript | npx tsx --eval

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit 1
}

# Seeding (optional)
if ($Seed) {
    Write-Host "`nStep 5: Seeding database..." -ForegroundColor Yellow
    npm run db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database seeded" -ForegroundColor Green
    } else {
        Write-Host "✗ Seeding failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

Pop-Location

# Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          LIVE TEST ENVIRONMENT - READY TO START               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nTo start dev servers, run:" -ForegroundColor Yellow
Write-Host "  Backend:  cd C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker\backend && npm run dev" -ForegroundColor White
Write-Host "  Frontend: cd C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker\frontend && npm run dev" -ForegroundColor White

Write-Host "`nTest URLs will be:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White

Write-Host "`nTest credentials:" -ForegroundColor Yellow
Write-Host "  Stripe Test Card: 4242 4242 4242 4242 | 12/25 | 123" -ForegroundColor White
Write-Host "  Expiry: Any future date | CVC: Any 3 digits" -ForegroundColor White
