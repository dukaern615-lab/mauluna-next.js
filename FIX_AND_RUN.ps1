# Fix and Run Script for kjo-nextjs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIXING AND RUNNING PROJECT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear npm cache
Write-Host "Step 1: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host ""

# Step 2: Check if node_modules needs fixing
Write-Host "Step 2: Checking installation..." -ForegroundColor Yellow
$nextExists = Test-Path "node_modules\next"
if (-not $nextExists) {
    Write-Host "Next.js not found. Installing dependencies..." -ForegroundColor Red
    $env:NODE_OPTIONS = "--max-old-space-size=8192"
    npm install --legacy-peer-deps
} else {
    Write-Host "Next.js found. Verifying installation..." -ForegroundColor Green
    npm install --legacy-peer-deps
}
Write-Host ""

# Step 3: Run dev server
Write-Host "Step 3: Starting development server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
npm run dev


