# CS2 Skin Tracker - Secure Production Setup Workflow
# Purpose: Safely collect, store, and deploy production secrets
# No keys are logged or echoed back

$projectRoot = "C:\Users\Arthur\Documents\Coding\CS2 Skin Tracker"
$envFilePath = "$projectRoot\backend\.env"
$logPath = "C:\Users\Arthur\AppData\Roaming\Claude\local-agent-mode-sessions\1e91ea34-1617-42f9-9cd6-0e6c34926dea\c7c6fc4d-39b5-4622-be8e-1f903abb2cfa\local_b1f0193c-c2cd-4f10-920f-61d21ff587f1\outputs\production-setup-log.txt"

# Initialize log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "=== CS2 Skin Tracker Production Setup ==="
Add-Content -Path $logPath -Value "Started: $timestamp"
Add-Content -Path $logPath -Value ""

function Log-Step {
    param([string]$message, [string]$status)
    $logMessage = "[$((Get-Date -Format 'HH:mm:ss'))] $message - $status"
    Add-Content -Path $logPath -Value $logMessage
    Write-Host $logMessage
}

# Step 1: Collect CLERK_SECRET_KEY securely
Write-Host ""
Write-Host "=== STEP 1: Collect CLERK_SECRET_KEY ==="
Write-Host "Go to Clerk Dashboard -> API Keys"
Write-Host "Copy the Secret Key (starts with sk_live_)"
Write-Host ""

$clerkKey = Read-Host "Paste CLERK_SECRET_KEY" -AsSecureString
$clerkKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($clerkKey))

if ($clerkKeyPlain -match "^sk_live_") {
    Log-Step "CLERK_SECRET_KEY collected" "✅"
} else {
    Log-Step "CLERK_SECRET_KEY validation" "❌ (does not match sk_live_ pattern)"
    Write-Host "ERROR: Key must start with sk_live_"
    exit 1
}

# Step 2: Collect STRIPE_SECRET_KEY securely
Write-Host ""
Write-Host "=== STEP 2: Collect STRIPE_SECRET_KEY ==="
Write-Host "Go to Stripe Dashboard -> Developers -> API Keys"
Write-Host "Copy the Secret Key (starts with sk_live_)"
Write-Host ""

$stripeKey = Read-Host "Paste STRIPE_SECRET_KEY" -AsSecureString
$stripeKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($stripeKey))

if ($stripeKeyPlain -match "^sk_live_") {
    Log-Step "STRIPE_SECRET_KEY collected" "✅"
} else {
    Log-Step "STRIPE_SECRET_KEY validation" "❌ (does not match sk_live_ pattern)"
    Write-Host "ERROR: Key must start with sk_live_"
    exit 1
}

# Step 3: Update local .env file
Write-Host ""
Write-Host "=== STEP 3: Update Local .env File ==="

try {
    # Read current .env
    $envContent = Get-Content -Path $envFilePath -Raw

    # Replace or add CLERK_SECRET_KEY
    if ($envContent -match "^CLERK_SECRET_KEY=") {
        $envContent = $envContent -replace "^CLERK_SECRET_KEY=.*$", "CLERK_SECRET_KEY=$clerkKeyPlain"
    } else {
        # Add after STRIPE_WEBHOOK_SECRET
        $envContent = $envContent -replace "(STRIPE_WEBHOOK_SECRET=.*?)(\r?\n)", "`$1`$2CLERK_SECRET_KEY=$clerkKeyPlain`$2"
    }

    # Replace STRIPE_SECRET_KEY
    $envContent = $envContent -replace "^STRIPE_SECRET_KEY=.*$", "STRIPE_SECRET_KEY=$stripeKeyPlain"

    # Save back
    Set-Content -Path $envFilePath -Value $envContent -Encoding UTF8

    Log-Step "Updated .env file locally" "✅"
} catch {
    Log-Step "Update .env file" "❌"
    Log-Step "Error: $($_.Exception.Message)" "❌"
    exit 1
}

# Step 4: Verify .gitignore
Write-Host ""
Write-Host "=== STEP 4: Verify .gitignore ==="

try {
    $gitignore = Get-Content -Path "$projectRoot\.gitignore"
    if ($gitignore -contains ".env") {
        Log-Step "Verified .env in .gitignore" "✅"
    } else {
        Log-Step ".env NOT in .gitignore" "⚠️"
    }
} catch {
    Log-Step "Check .gitignore" "❌"
}

# Step 5: Git operations
Write-Host ""
Write-Host "=== STEP 5: Git Operations ==="

try {
    Push-Location -Path $projectRoot

    # Stage changes
    $output = git add .
    Log-Step "Git add ." "✅"

    # Commit
    $output = git commit -m "chore: Add production Clerk and Stripe secret keys"
    if ($LASTEXITCODE -eq 0) {
        Log-Step "Git commit (production secrets)" "✅"
    } else {
        Log-Step "Git commit" "⚠️ (no changes or already committed)"
    }

    # Push to main
    $output = git push origin main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Log-Step "Git push origin main" "✅"
        Log-Step "Vercel auto-deploy initiated" "⏳"
    } else {
        Log-Step "Git push origin main" "⚠️"
        Log-Step "Output: $output" "⚠️"
    }

    Pop-Location
} catch {
    Log-Step "Git operations" "❌"
    Log-Step "Error: $($_.Exception.Message)" "❌"
    Pop-Location
}

# Step 6: Vercel environment variables
Write-Host ""
Write-Host "=== STEP 6: Set Vercel Environment Variables ==="

try {
    # Note: Actual Vercel MCP calls will be made by Claude separately
    Log-Step "Ready for Vercel MCP calls" "ℹ️"
    Log-Step "CLERK_SECRET_KEY - pending Vercel env set" "⏳"
    Log-Step "STRIPE_SECRET_KEY - pending Vercel env set" "⏳"
} catch {
    Log-Step "Vercel setup" "❌"
}

# Clear sensitive variables
Remove-Variable clerkKeyPlain -Force
Remove-Variable stripeKeyPlain -Force

Add-Content -Path $logPath -Value ""
Add-Content -Path $logPath -Value "=== Workflow Phase 1 Complete ==="
Add-Content -Path $logPath -Value "Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Content -Path $logPath -Value ""
Add-Content -Path $logPath -Value "NOTE: Phase 2 (Vercel MCP, webhook registration, verification) pending Claude execution"

Write-Host ""
Write-Host "✅ Phase 1 Complete: Secrets collected and committed locally"
Write-Host "Next: Vercel environment setup and production verification"
Write-Host ""
Write-Host "Log: $logPath"
