# CattleFeedAI Quality Assessment & Advisory Engine Integration Test Suite (Milestone 5)
$ErrorActionPreference = "Continue"

$baseUrl = "http://localhost:8080"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$farmerAEmail = "farmer_assess_a_$timestamp@example.com"
$farmerAUser = "farmer_assess_a_$timestamp"
$farmerBEmail = "farmer_assess_b_$timestamp@example.com"
$farmerBUser = "farmer_assess_b_$timestamp"
$adminEmail = "admin_assess_$timestamp@example.com"
$adminUser = "admin_assess_$timestamp"
$password = "Secret@123"

$totalTests = 0
$passedTests = 0
$failedTests = 0

function Assert-Result($testName, $expected, $actual) {
    $global:totalTests++
    if ($expected -eq $actual) {
        Write-Host "  [PASS] $testName (Status: $actual)" -ForegroundColor Green
        $global:passedTests++
    } else {
        Write-Host "  [FAIL] $testName - Expected: $expected, Got: $actual" -ForegroundColor Red
        $global:failedTests++
    }
}

function Invoke-Api($method, $endpoint, $token, $body) {
    $headers = @{}
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    $params = @{
        Uri = "$baseUrl$endpoint"
        Method = $method
        Headers = $headers
        ContentType = "application/json"
    }
    if ($body) {
        $params["Body"] = ($body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-WebRequest @params -UseBasicParsing
        $parsedBody = $null
        if ($response.Content) {
            $parsedBody = $response.Content | ConvertFrom-Json
        }
        return @{
            StatusCode = [int]$response.StatusCode
            Body = $parsedBody
        }
    } catch {
        $ex = $_.Exception
        $statusCode = [int]$ex.Response.StatusCode
        $errorBody = $null
        if ($ex.Response) {
            $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
            $content = $reader.ReadToEnd()
            try { $errorBody = $content | ConvertFrom-Json } catch { $errorBody = $content }
        }
        return @{
            StatusCode = $statusCode
            Body = $errorBody
        }
    }
}

Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '  CattleFeedAI - Milestone 5 Quality Assessment and Advisory Test' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan

# ── 1. User Registration & Authentication ─────────────────────
Write-Host "`n[PHASE 1] User Registration & Authentication" -ForegroundColor Yellow

$regA = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $farmerAUser
    email = $farmerAEmail
    password = $password
    fullName = "Farmer A (Assessment Test)"
    role = "FARMER"
}
Assert-Result "Register Farmer A" 201 $regA.StatusCode

$loginA = Invoke-Api "POST" "/api/auth/login" $null @{
    email = $farmerAEmail
    password = $password
}
Assert-Result "Login Farmer A" 200 $loginA.StatusCode
$tokenA = $loginA.Body.token

$regB = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $farmerBUser
    email = $farmerBEmail
    password = $password
    fullName = "Farmer B (Assessment Test)"
    role = "FARMER"
}
Assert-Result "Register Farmer B" 201 $regB.StatusCode

$loginB = Invoke-Api "POST" "/api/auth/login" $null @{
    email = $farmerBEmail
    password = $password
}
Assert-Result "Login Farmer B" 200 $loginB.StatusCode
$tokenB = $loginB.Body.token

$regAdmin = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $adminUser
    email = $adminEmail
    password = $password
    fullName = "Admin User (Assessment Test)"
    role = "ADMIN"
}
Assert-Result "Register Admin" 201 $regAdmin.StatusCode
& mysql -u root -p"sql@2007" -e "USE cattlefeedai; UPDATE users SET role = 'ADMIN' WHERE email = '$adminEmail';" 2>&1 | Out-Null

$loginAdmin = Invoke-Api "POST" "/api/auth/login" $null @{
    email = $adminEmail
    password = $password
}
Assert-Result "Login Admin" 200 $loginAdmin.StatusCode
$tokenAdmin = $loginAdmin.Body.token

# ── 2. Farm and Animal Setup for Farmer A ─────────────────────
Write-Host "`n[PHASE 2] Farm and Animal Setup" -ForegroundColor Yellow

$farmA = Invoke-Api "POST" "/api/farms" $tokenA @{
    farmName = "Quality Test Dairy Farm $timestamp"
    location = "Maharashtra"
    totalAnimals = 20
    milkingAnimals = 15
    dryAnimals = 5
}
Assert-Result "Create Farm A" 201 $farmA.StatusCode
$farmAId = $farmA.Body.id

$animal1 = Invoke-Api "POST" "/api/animals" $tokenA @{
    farmId = $farmAId
    animalTag = "COW-QA-01-$timestamp"
    name = "Gauri"
    breed = "Gir"
    gender = "FEMALE"
    lactationStage = "EARLY"
    milkProductionPerDay = 16.5
    feedIntakeStatus = "REDUCED"
}
Assert-Result "Create Animal 1 (Early Lactation, Reduced Intake)" 201 $animal1.StatusCode
$animal1Id = $animal1.Body.id

$animal2 = Invoke-Api "POST" "/api/animals" $tokenA @{
    farmId = $farmAId
    animalTag = "COW-QA-02-$timestamp"
    name = "Lakshmi"
    breed = "Sahiwal"
    gender = "FEMALE"
    lactationStage = "MID"
    milkProductionPerDay = 12.0
    feedIntakeStatus = "NORMAL"
}
Assert-Result "Create Animal 2 (Insufficient Data Scenario)" 201 $animal2.StatusCode
$animal2Id = $animal2.Body.id

# ── 3. Samples and Test Results Creation ──────────────────────
Write-Host "`n[PHASE 3] Feed/Silage Samples and Test Results Creation" -ForegroundColor Yellow

$feedSample1 = Invoke-Api "POST" "/api/feed-samples" $tokenA @{
    farmId = $farmAId
    animalId = $animal1Id
    sampleCode = "FS-GOOD-$timestamp"
    feedType = "GREEN_FODDER"
    sampleDate = "2026-09-20"
    source = "Farm Pasture"
}
Assert-Result "Create Clean Feed Sample" 201 $feedSample1.StatusCode
$feedSample1Id = $feedSample1.Body.id

# Test Result 1: Clean Feed (GOOD)
$test1 = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSample1Id
    testDate = "2026-09-21"
    analysisSource = "LAB"
    moisture = 12.5
    crudeProtein = 18.0
    fiber = 19.0
    aflatoxin = 4.2
    mouldDetected = $false
    spoilageDetected = $false
}
Assert-Result "Record Clean Feed Test Result" 201 $test1.StatusCode
$test1Id = $test1.Body.id

$feedSample2 = Invoke-Api "POST" "/api/feed-samples" $tokenA @{
    farmId = $farmAId
    animalId = $animal1Id
    sampleCode = "FS-HAZARD-$timestamp"
    feedType = "CATTLE_FEED_PELLET"
    sampleDate = "2026-09-22"
    source = "Suspect Local Supplier"
}
Assert-Result "Create Hazard Feed Sample" 201 $feedSample2.StatusCode
$feedSample2Id = $feedSample2.Body.id

# Test Result 2: Hazard Feed (High Moisture, Low Protein, High Aflatoxin, Mould, Spoilage) -> UNSAFE
$test2 = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSample2Id
    testDate = "2026-09-23"
    analysisSource = "LAB"
    moisture = 19.0
    crudeProtein = 10.5
    fiber = 25.0
    aflatoxin = 48.5
    mouldDetected = $true
    spoilageDetected = $true
    adulteration = "Suspected urea padding"
}
Assert-Result "Record Hazard Feed Test Result" 201 $test2.StatusCode
$test2Id = $test2.Body.id

# Test Result 3: Missing/Null parameters -> INSUFFICIENT_DATA
$feedSample3 = Invoke-Api "POST" "/api/feed-samples" $tokenA @{
    farmId = $farmAId
    sampleCode = "FS-NULL-$timestamp"
    feedType = "DRY_FODDER"
    sampleDate = "2026-09-24"
}
Assert-Result "Create Feed Sample for Null Tests" 201 $feedSample3.StatusCode
$feedSample3Id = $feedSample3.Body.id

$test3 = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSample3Id
    testDate = "2026-09-24"
    analysisSource = "LAB"
}
Assert-Result "Record Test Result with All Null Parameters" 201 $test3.StatusCode
$test3Id = $test3.Body.id

# Test Result 4: Silage Sample (High pH & Moisture -> NEEDS_ATTENTION)
$silageSample = Invoke-Api "POST" "/api/silage-samples" $tokenA @{
    farmId = $farmAId
    sampleCode = "SS-DEVIATE-$timestamp"
    silageType = "MAIZE"
    sampleDate = "2026-09-25"
}
Assert-Result "Create Silage Sample" 201 $silageSample.StatusCode
$silageSampleId = $silageSample.Body.id

$test4 = Invoke-Api "POST" "/api/test-results" $tokenA @{
    silageSampleId = $silageSampleId
    testDate = "2026-09-25"
    analysisSource = "LAB"
    ph = 5.2
    moisture = 75.0
}
Assert-Result "Record Deviated Silage Test Result" 201 $test4.StatusCode
$test4Id = $test4.Body.id

# ── 4. Quality Assessment Verification ────────────────────────
Write-Host "`n[PHASE 4] Quality Assessment Evaluation" -ForegroundColor Yellow

$qa1 = Invoke-Api "GET" "/api/assessments/test-results/$test1Id" $tokenA $null
Assert-Result "Quality Assessment: Clean feed status is 200" 200 $qa1.StatusCode
Assert-Result "Quality Assessment: Clean feed status is GOOD" "GOOD" $qa1.Body.qualityStatus
Assert-Result "Quality Assessment: 0 rules triggered for clean feed" 0 $qa1.Body.triggeredRulesCount

$qa2 = Invoke-Api "GET" "/api/assessments/test-results/$test2Id" $tokenA $null
Assert-Result "Quality Assessment: Hazard feed status is 200" 200 $qa2.StatusCode
Assert-Result "Quality Assessment: Hazard feed status is UNSAFE" "UNSAFE" $qa2.Body.qualityStatus
$qa2RuleCountCheck = $qa2.Body.triggeredRulesCount -ge 3
Assert-Result "Quality Assessment: Hazard feed triggered multiple rules (>=3)" $true $qa2RuleCountCheck

$qa3 = Invoke-Api "GET" "/api/assessments/test-results/$test3Id" $tokenA $null
Assert-Result "Quality Assessment: Null test status is 200" 200 $qa3.StatusCode
Assert-Result "Quality Assessment: Null test status is INSUFFICIENT_DATA" "INSUFFICIENT_DATA" $qa3.Body.qualityStatus
$nullParamCount = ($qa3.Body.parameters | Where-Object { $_.status -eq "NOT_AVAILABLE" }).Count
$allNotAvailable = $nullParamCount -ge 5
Assert-Result "Quality Assessment: Null parameters marked as NOT_AVAILABLE" $true $allNotAvailable

$qa4 = Invoke-Api "GET" "/api/assessments/test-results/$test4Id" $tokenA $null
Assert-Result "Quality Assessment: Deviated silage status is 200" 200 $qa4.StatusCode
Assert-Result "Quality Assessment: Deviated silage status is NEEDS_ATTENTION" "NEEDS_ATTENTION" $qa4.Body.qualityStatus

# ── 5. Risk Assessment Verification ───────────────────────────
Write-Host "`n[PHASE 5] Risk Assessment Layer" -ForegroundColor Yellow

$risk1 = Invoke-Api "GET" "/api/assessments/test-results/$test1Id/risk" $tokenA $null
Assert-Result "Risk Assessment: Clean feed risk status is 200" 200 $risk1.StatusCode
Assert-Result "Risk Assessment: Clean feed overall risk is LOW" "LOW" $risk1.Body.overallRiskLevel

$risk2 = Invoke-Api "GET" "/api/assessments/test-results/$test2Id/risk" $tokenA $null
Assert-Result "Risk Assessment: Hazard feed risk status is 200" 200 $risk2.StatusCode
Assert-Result "Risk Assessment: Hazard feed overall risk is HIGH" "HIGH" $risk2.Body.overallRiskLevel
$hasContam = $risk2.Body.contaminationRisks.Count -ge 1
Assert-Result "Risk Assessment: Contamination risks identified" $true $hasContam
$hasStorage = $risk2.Body.storageSpoilageRisks.Count -ge 1
Assert-Result "Risk Assessment: Storage/Spoilage risks identified" $true $hasStorage
$hasNutrition = $risk2.Body.nutritionalImbalances.Count -ge 1
Assert-Result "Risk Assessment: Nutritional imbalances identified" $true $hasNutrition

# ── 6. Advisory Engine & Summary Evaluation ───────────────────
Write-Host "`n[PHASE 6] Advisory Generation & Querying" -ForegroundColor Yellow

# Evaluate and generate advisories for hazard test result (linked to animal 1)
$summaryEval = Invoke-Api "POST" "/api/assessments/test-results/$test2Id" $tokenA $null
Assert-Result "Evaluate & Generate Advisories status is 200" 200 $summaryEval.StatusCode
$advisoriesGenerated = $summaryEval.Body.generatedAdvisories.Count -ge 2
Assert-Result "Advisories generated for hazard test result" $true $advisoriesGenerated

# Query advisories endpoint
$allAdvisories = Invoke-Api "GET" "/api/advisories" $tokenA $null
Assert-Result "GET /api/advisories returns 200" 200 $allAdvisories.StatusCode
$hasAdvisories = $allAdvisories.Body.Count -ge 1
Assert-Result "GET /api/advisories returns persisted advisories" $true $hasAdvisories

$firstAdvisoryId = $allAdvisories.Body[0].id
$singleAdvisory = Invoke-Api "GET" "/api/advisories/$firstAdvisoryId" $tokenA $null
Assert-Result "GET /api/advisories/{id} returns 200" 200 $singleAdvisory.StatusCode
Assert-Result "Advisory initially unread" $false $singleAdvisory.Body.isRead

$markRead = Invoke-Api "PUT" "/api/advisories/$firstAdvisoryId/read" $tokenA $null
Assert-Result "PUT /api/advisories/{id}/read returns 200" 200 $markRead.StatusCode
Assert-Result "Advisory successfully marked as read" $true $markRead.Body.isRead

# ── 7. Animal Health Risk Screening ───────────────────────────
Write-Host "`n[PHASE 7] Animal Health Risk Screening" -ForegroundColor Yellow

# Animal 2: No feed tests or observations -> INSUFFICIENT_DATA
$screen2 = Invoke-Api "GET" "/api/assessments/animals/$animal2Id/health-screening" $tokenA $null
Assert-Result "Health Screening (Animal 2 - No records) status is 200" 200 $screen2.StatusCode
Assert-Result "Health Screening status is INSUFFICIENT_DATA" "INSUFFICIENT_DATA" $screen2.Body.screeningStatus
$explCount = $screen2.Body.missingInformation.Count -ge 1
Assert-Result "Health Screening explains missing information" $true $explCount

# Animal 1: Has early lactation (16.5 L/day), reduced intake, and test results with low protein and high moisture
$screen1 = Invoke-Api "GET" "/api/assessments/animals/$animal1Id/health-screening" $tokenA $null
Assert-Result "Health Screening (Animal 1) status is 200" 200 $screen1.StatusCode
Assert-Result "Health Screening identifies POTENTIAL_CONCERN" "POTENTIAL_CONCERN" $screen1.Body.screeningStatus
$risksFound = $screen1.Body.detectedRisks.Count -ge 1
Assert-Result "Health Screening detects feed-related risks" $true $risksFound
$disclaimerOk = $screen1.Body.disclaimer -match "does NOT constitute a veterinary diagnosis"
Assert-Result "Health Screening disclaimer enforces non-diagnostic terminology" $true $disclaimerOk

# ── 8. Webcam / Visual Screening Ingestion ────────────────────
Write-Host "`n[PHASE 8] Webcam / Visual Screening Ingestion" -ForegroundColor Yellow

$visualPayload = @{
    feedSampleId = $feedSample1Id
    imageReference = "https://cdn.cattlefeedai.com/captures/cam_fs1_001.jpg"
    visualQualityIndicators = @("Surface looks uniform", "No visible discolouration")
    mouldIndication = $false
    spoilageIndication = $false
    visibleForeignMaterialIndication = $false
    confidenceScore = 0.94
    notes = "Webcam visual snapshot captured at feed bin"
}

$visualResponse = Invoke-Api "POST" "/api/assessments/visual-screening" $tokenA $visualPayload
Assert-Result "POST /api/assessments/visual-screening returns 201" 201 $visualResponse.StatusCode
Assert-Result "Visual Screening: Visual status is NORMAL" "NORMAL" $visualResponse.Body.visualStatus
Assert-Result "Visual Screening: Mould detected is false" $false $visualResponse.Body.mouldDetected
$visDisclaimerOk = $visualResponse.Body.disclaimer -match "VISUAL SCREENING ONLY"
Assert-Result "Visual Screening: Explicitly marked as VISUAL SCREENING ONLY" $true $visDisclaimerOk

# ── 9. Security, Ownership & Access Control ───────────────────
Write-Host "`n[PHASE 9] Security, Ownership & Access Control" -ForegroundColor Yellow

# Farmer B attempts to access Farmer A's test result assessment -> 403 Forbidden
$crossAssess = Invoke-Api "GET" "/api/assessments/test-results/$test1Id" $tokenB $null
Assert-Result "Cross-farmer Quality Assessment access returns 403" 403 $crossAssess.StatusCode

# Farmer B attempts to access Farmer A's risk assessment -> 403 Forbidden
$crossRisk = Invoke-Api "GET" "/api/assessments/test-results/$test1Id/risk" $tokenB $null
Assert-Result "Cross-farmer Risk Assessment access returns 403" 403 $crossRisk.StatusCode

# Farmer B attempts to access Farmer A's health screening -> 403 Forbidden
$crossScreen = Invoke-Api "GET" "/api/assessments/animals/$animal1Id/health-screening" $tokenB $null
Assert-Result "Cross-farmer Animal Health Screening returns 403" 403 $crossScreen.StatusCode

# Farmer B attempts to access Farmer A's advisories -> 403 Forbidden
$crossAdvisory = Invoke-Api "GET" "/api/advisories/$firstAdvisoryId" $tokenB $null
Assert-Result "Cross-farmer Advisory access returns 403" 403 $crossAdvisory.StatusCode

# Unauthenticated request -> 401 Unauthorized
$unauth = Invoke-Api "GET" "/api/assessments/test-results/$test1Id" $null $null
Assert-Result "Unauthenticated assessment request returns 401" 401 $unauth.StatusCode

# Non-existent test result -> 404 Not Found
$notFound = Invoke-Api "GET" "/api/assessments/test-results/999999" $tokenA $null
Assert-Result "Non-existent test result returns 404" 404 $notFound.StatusCode

# Admin access to Farmer A's assessment -> 200 OK
$adminAssess = Invoke-Api "GET" "/api/assessments/test-results/$test1Id" $tokenAdmin $null
Assert-Result "Admin can view Farmer A's Quality Assessment" 200 $adminAssess.StatusCode

$adminAdvisories = Invoke-Api "GET" "/api/advisories" $tokenAdmin $null
Assert-Result "Admin can view all system advisories" 200 $adminAdvisories.StatusCode

# ── Final Summary ─────────────────────────────────────────────
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Milestone 5 Test Results Summary" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Total Tests Executed : $totalTests" -ForegroundColor Cyan
Write-Host "  Passed Tests         : $passedTests" -ForegroundColor Green
Write-Host "  Failed Tests         : $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })

if ($failedTests -eq 0) {
    Write-Host "`nALL MILESTONE 5 INTEGRATION TESTS PASSED PERFECTLY!" -ForegroundColor Green
} else {
    Write-Host "`nSOME TESTS FAILED! Please review errors above." -ForegroundColor Red
}
