<#
.SYNOPSIS
Interactive API Test Runner for Navodisha Connect Backend
#>

$baseUrl = "http://localhost:8081"
$ErrorActionPreference = "Stop"

function Show-Menu {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "       NAVODISHA CONNECT - API TEST RUNNER" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "1. Test Ping (Health & Database Connection)"
    Write-Host "2. Send OTP to Phone (+917620149253)"
    Write-Host "3. Verify OTP"
    Write-Host "4. Register New Student (Returns JWT Tokens)"
    Write-Host "5. Register New Alumnus (Pending Verification)"
    Write-Host "6. Get Current User Profile (Protected - Uses saved JWT)"
    Write-Host "7. Run Full Automated Smoke Test"
    Write-Host "0. Exit"
    Write-Host "==========================================================" -ForegroundColor Cyan
}

do {
    Show-Menu
    $choice = Read-Host "Select an option [0-7]"
    Write-Host ""

    switch ($choice) {
        "1" {
            Write-Host "--> GET $baseUrl/api/v1/ping" -ForegroundColor Yellow
            try {
                $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/ping" -Method Get
                $res | Format-List
            } catch {
                Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "2" {
            $phone = Read-Host "Enter Phone Number (default: +917620149253)"
            if (-not $phone) { $phone = "+917620149253" }
            Write-Host "--> POST $baseUrl/api/v1/auth/otp/send" -ForegroundColor Yellow
            try {
                $body = @{ phoneNumber = $phone } | ConvertTo-Json
                $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/otp/send" -Method Post -ContentType "application/json" -Body $body
                $res | Format-List
                Write-Host "Check your IntelliJ Run Console tab for the 6-digit OTP code!" -ForegroundColor Green
            } catch {
                Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "3" {
            $phone = Read-Host "Enter Phone Number (default: +917620149253)"
            if (-not $phone) { $phone = "+917620149253" }
            $otp = Read-Host "Enter 6-digit OTP from IntelliJ Console"
            Write-Host "--> POST $baseUrl/api/v1/auth/otp/verify" -ForegroundColor Yellow
            try {
                $body = @{ phoneNumber = $phone; otp = $otp } | ConvertTo-Json
                $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/otp/verify" -Method Post -ContentType "application/json" -Body $body
                $res | Format-List
                if ($res.auth -and $res.auth.accessToken) {
                    $global:savedToken = $res.auth.accessToken
                    Write-Host "Saved JWT token for profile queries!" -ForegroundColor Green
                }
            } catch {
                Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "4" {
            $phone = Read-Host "Enter Phone Number (default: +918888877777)"
            if (-not $phone) { $phone = "+918888877777" }
            Write-Host "--> POST $baseUrl/api/v1/auth/register (STUDENT)" -ForegroundColor Yellow
            try {
                $body = @{
                    phoneNumber = $phone
                    fullName = "Alok Student"
                    role = "STUDENT"
                    jnvName = "JNV Cuttack"
                } | ConvertTo-Json
                $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method Post -ContentType "application/json" -Body $body
                $res | Format-List
                if ($res.accessToken) {
                    $global:savedToken = $res.accessToken
                    Write-Host "Saved JWT token for profile queries!" -ForegroundColor Green
                }
            } catch {
                Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "5" {
            $phone = Read-Host "Enter Phone Number (default: +919999988888)"
            if (-not $phone) { $phone = "+919999988888" }
            Write-Host "--> POST $baseUrl/api/v1/auth/register (ALUMNUS)" -ForegroundColor Yellow
            try {
                $body = @{
                    phoneNumber = $phone
                    fullName = "Senior Navodayan"
                    role = "ALUMNUS"
                    jnvName = "JNV Nagpur"
                } | ConvertTo-Json
                $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method Post -ContentType "application/json" -Body $body
                $res | Format-List
            } catch {
                Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "6" {
            if (-not $global:savedToken) {
                $global:savedToken = Read-Host "Enter Bearer Access Token"
            }
            Write-Host "--> GET $baseUrl/api/v1/users/me" -ForegroundColor Yellow
            try {
                $headers = @{ Authorization = "Bearer $global:savedToken" }
                $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/me" -Method Get -Headers $headers
                $res | Format-List
            } catch {
                Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        "7" {
            Write-Host "Running End-to-End Smoke Test..." -ForegroundColor Cyan
            $ping = Invoke-RestMethod -Uri "$baseUrl/api/v1/ping" -Method Get
            Write-Host "1. Ping Status: $($ping.status)" -ForegroundColor Green

            $randomSuffix = Get-Random -Minimum 1000 -Maximum 9999
            $testPhoneNum = "+9190000$randomSuffix"
            $regBody = @{
                phoneNumber = $testPhoneNum
                fullName = "Smoke Test User"
                role = "STUDENT"
                jnvName = "JNV Test"
            } | ConvertTo-Json
            $reg = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method Post -ContentType "application/json" -Body $regBody
            Write-Host "2. Registered User: $($reg.user.fullName) (Role: $($reg.user.role), Status: $($reg.user.status))" -ForegroundColor Green
            Write-Host "3. Token Issued: $($reg.accessToken.Substring(0, 30))..." -ForegroundColor Green

            $headers = @{ Authorization = "Bearer $($reg.accessToken)" }
            $me = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/me" -Method Get -Headers $headers
            Write-Host "4. Verified Profile from Protected Endpoint: $($me.fullName) from $($me.jnvName)" -ForegroundColor Green
            Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
        }
    }
} while ($choice -ne "0")
