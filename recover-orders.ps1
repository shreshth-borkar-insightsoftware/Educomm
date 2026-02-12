# PowerShell script to help recover historical orders
# Run this AFTER you've obtained session IDs from Stripe

Write-Host "=== Educomm Historical Order Recovery Tool ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Stripe CLI is installed
Write-Host "Step 1: Checking Stripe CLI installation..." -ForegroundColor Yellow
try {
    $stripeVersion = stripe --version 2>&1
    Write-Host "✓ Stripe CLI is installed: $stripeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Stripe CLI not found!" -ForegroundColor Red
    Write-Host "  Install from: https://stripe.com/docs/stripe-cli" -ForegroundColor Yellow
    Write-Host "  Or use: scoop install stripe" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Get session IDs
Write-Host "Step 2: Fetching recent Stripe checkout sessions..." -ForegroundColor Yellow
Write-Host "  (This requires Stripe CLI to be authenticated)" -ForegroundColor Gray
Write-Host ""

try {
    $sessions = stripe checkout sessions list --limit 20 2>&1
    
    if ($sessions -match "not authenticated" -or $sessions -match "login") {
        Write-Host "✗ Not authenticated with Stripe CLI" -ForegroundColor Red
        Write-Host "  Run: stripe login" -ForegroundColor Yellow
        exit 1
    }
    
    # Parse session IDs (this is a simplified parser, may need adjustment)
    $sessionIds = $sessions | Select-String -Pattern 'cs_[a-zA-Z0-9_]+' -AllMatches | 
                  ForEach-Object { $_.Matches.Value } | Select-Object -Unique
    
    if ($sessionIds.Count -eq 0) {
        Write-Host "✗ No sessions found" -ForegroundColor Red
        Write-Host "  Run manually: stripe checkout sessions list" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✓ Found $($sessionIds.Count) session(s):" -ForegroundColor Green
    $sessionIds | ForEach-Object { Write-Host "  - $_" -ForegroundColor Cyan }
    
} catch {
    Write-Host "✗ Error fetching sessions: $_" -ForegroundColor Red
    Write-Host "  Run manually: stripe checkout sessions list" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Prepare API call
Write-Host "Step 3: Preparing sync request..." -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to call the sync API with these session IDs." -ForegroundColor White
Write-Host "You'll need an admin JWT token first." -ForegroundColor White
Write-Host ""

# Create JSON payload
$jsonPayload = $sessionIds | ConvertTo-Json
Write-Host "Copy this payload:" -ForegroundColor Yellow
Write-Host $jsonPayload -ForegroundColor Cyan
Write-Host ""

# Step 4: Show API call example
Write-Host "Step 4: Call the sync API" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option A: Using PowerShell (replace YOUR_TOKEN):" -ForegroundColor White
Write-Host @"
`$headers = @{
    'Authorization' = 'Bearer YOUR_ADMIN_JWT_TOKEN'
    'Content-Type' = 'application/json'
}
`$body = '$jsonPayload'
`$response = Invoke-RestMethod -Uri 'https://localhost:50135/api/Admin/sync-historical-payments' ``
    -Method Post ``
    -Headers `$headers ``
    -Body `$body ``
    -SkipCertificateCheck
`$response
"@ -ForegroundColor Green

Write-Host ""
Write-Host "Option B: Using curl:" -ForegroundColor White
Write-Host @"
curl -k -X POST https://localhost:50135/api/Admin/sync-historical-payments \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '$($jsonPayload -replace "'", "\'")'
"@ -ForegroundColor Green

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Get an admin JWT token by logging in as admin" -ForegroundColor White
Write-Host "2. Replace YOUR_ADMIN_JWT_TOKEN in the command above" -ForegroundColor White
Write-Host "3. Run the command to create historical orders" -ForegroundColor White
Write-Host "4. Check 'My Orders' page to verify orders appear" -ForegroundColor White
Write-Host ""
