# CattleFeedAI Feed, Silage & Test Result Management Integration Test Suite
$ErrorActionPreference = "Continue"

$baseUrl = "http://localhost:8080"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$farmerAEmail = "farmer_feed_a_$timestamp@example.com"
$farmerAUser = "farmer_feed_a_$timestamp"
$farmerBEmail = "farmer_feed_b_$timestamp@example.com"
$farmerBUser = "farmer_feed_b_$timestamp"
$adminEmail = "admin_feed_$timestamp@example.com"
$adminUser = "admin_feed_$timestamp"
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

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " CattleFeedAI Feed, Silage & Test Result API Test Suite" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ── Setup: Register Farmers & Create Farm/Animal ─────────────
Write-Host "`n--- Setup: Register Farmer A & Create Farm A + Animal A ---" -ForegroundColor Yellow
$regA = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $farmerAUser
    email = $farmerAEmail
    password = $password
    phone = "9876500001"
    language = "en"
}
Assert-Result "Register Farmer A" 201 $regA.StatusCode
$tokenA = $regA.Body.token

$farmA = Invoke-Api "POST" "/api/farms" $tokenA @{
    farmName = "Cauvery Dairy Farm"
    location = "Thanjavur"
    district = "Thanjavur"
    state = "Tamil Nadu"
    pincode = "613001"
}
Assert-Result "Create Farm A" 201 $farmA.StatusCode
$farmAId = $farmA.Body.id

$animalA = Invoke-Api "POST" "/api/animals" $tokenA @{
    farmId = $farmAId
    animalTag = "COW-FS-01"
    name = "Kaveri"
    breed = "Holstein"
    gender = "FEMALE"
    dateOfBirth = "2021-08-15"
    weight = 450.0
    pregnancyStatus = "NOT_PREGNANT"
    feedIntakeStatus = "NORMAL"
}
Assert-Result "Create Animal A" 201 $animalA.StatusCode
$animalAId = $animalA.Body.id

# Setup Farmer B & Farm B + Animal B
Write-Host "`n--- Setup: Register Farmer B & Create Farm B + Animal B ---" -ForegroundColor Yellow
$regB = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $farmerBUser
    email = $farmerBEmail
    password = $password
    phone = "9876500002"
    language = "en"
}
Assert-Result "Register Farmer B" 201 $regB.StatusCode
$tokenB = $regB.Body.token

$farmB = Invoke-Api "POST" "/api/farms" $tokenB @{
    farmName = "Vaigai Dairy Farm"
    location = "Madurai"
    district = "Madurai"
    state = "Tamil Nadu"
    pincode = "625001"
}
Assert-Result "Create Farm B" 201 $farmB.StatusCode
$farmBId = $farmB.Body.id

$animalB = Invoke-Api "POST" "/api/animals" $tokenB @{
    farmId = $farmBId
    animalTag = "COW-FS-02"
    name = "Meenakshi"
    breed = "Jersey"
    gender = "FEMALE"
    weight = 410.0
}
Assert-Result "Create Animal B" 201 $animalB.StatusCode
$animalBId = $animalB.Body.id

# ── 1. FEED SAMPLE CRUD ──────────────────────────────────────
Write-Host "`n--- 1. Feed Sample CRUD (Farmer A) ---" -ForegroundColor Yellow
$feedCode = "FEED-$timestamp-001"
$createFeed = Invoke-Api "POST" "/api/feed-samples" $tokenA @{
    farmId = $farmAId
    animalId = $animalAId
    sampleCode = $feedCode
    feedType = "CATTLE_FEED_PELLET"
    sampleDate = "2026-09-26"
    source = "Local Feed Supplier"
    notes = "Morning feed batch"
}
Assert-Result "Create Feed Sample A (201 Created)" 201 $createFeed.StatusCode
$feedSampleId = $createFeed.Body.id
Assert-Result "Feed sample code matches" $feedCode $createFeed.Body.sampleCode
Assert-Result "Feed sample farmId matches" $farmAId $createFeed.Body.farmId
Assert-Result "Feed sample animalId matches" $animalAId $createFeed.Body.animalId

# Get Feed Sample by ID
$getFeed = Invoke-Api "GET" "/api/feed-samples/$feedSampleId" $tokenA $null
Assert-Result "Get Feed Sample A by ID (200 OK)" 200 $getFeed.StatusCode
Assert-Result "Retrieved Feed Sample feedType" "CATTLE_FEED_PELLET" $getFeed.Body.feedType

# Update Feed Sample
$updateFeed = Invoke-Api "PUT" "/api/feed-samples/$feedSampleId" $tokenA @{
    farmId = $farmAId
    animalId = $animalAId
    sampleCode = $feedCode
    feedType = "FEED_MASH"
    sampleDate = "2026-09-26"
    source = "Cooperative Dairy Store"
    notes = "Updated to mash batch"
}
Assert-Result "Update Feed Sample A (200 OK)" 200 $updateFeed.StatusCode
Assert-Result "Updated feedType is FEED_MASH" "FEED_MASH" $updateFeed.Body.feedType
Assert-Result "Updated source" "Cooperative Dairy Store" $updateFeed.Body.source

# Duplicate feed sample code
$dupFeedCode = Invoke-Api "POST" "/api/feed-samples" $tokenA @{
    farmId = $farmAId
    sampleCode = $feedCode
    feedType = "CATTLE_FEED_PELLET"
    sampleDate = "2026-09-26"
}
Assert-Result "Duplicate feed sampleCode rejected (409 Conflict)" 409 $dupFeedCode.StatusCode

# ── 2. SILAGE SAMPLE CRUD ────────────────────────────────────
Write-Host "`n--- 2. Silage Sample CRUD (Farmer A) ---" -ForegroundColor Yellow
$silageCode = "SILAGE-$timestamp-001"
$createSilage = Invoke-Api "POST" "/api/silage-samples" $tokenA @{
    farmId = $farmAId
    animalId = $animalAId
    sampleCode = $silageCode
    silageType = "MAIZE"
    sampleDate = "2026-09-26"
    source = "Farm Silo 1"
    notes = "First sample from current batch"
}
Assert-Result "Create Silage Sample A (201 Created)" 201 $createSilage.StatusCode
$silageSampleId = $createSilage.Body.id
Assert-Result "Silage sample code matches" $silageCode $createSilage.Body.sampleCode

# Get Silage Sample by ID
$getSilage = Invoke-Api "GET" "/api/silage-samples/$silageSampleId" $tokenA $null
Assert-Result "Get Silage Sample A by ID (200 OK)" 200 $getSilage.StatusCode
Assert-Result "Retrieved Silage silageType" "MAIZE" $getSilage.Body.silageType

# Update Silage Sample
$updateSilage = Invoke-Api "PUT" "/api/silage-samples/$silageSampleId" $tokenA @{
    farmId = $farmAId
    sampleCode = $silageCode
    silageType = "SORGHUM"
    sampleDate = "2026-09-26"
    source = "Bunker Silo 2"
    notes = "Corrected to Sorghum"
}
Assert-Result "Update Silage Sample A (200 OK)" 200 $updateSilage.StatusCode
Assert-Result "Updated silageType is SORGHUM" "SORGHUM" $updateSilage.Body.silageType

# Duplicate silage sample code
$dupSilageCode = Invoke-Api "POST" "/api/silage-samples" $tokenA @{
    farmId = $farmAId
    sampleCode = $silageCode
    silageType = "MAIZE"
    sampleDate = "2026-09-26"
}
Assert-Result "Duplicate silage sampleCode rejected (409 Conflict)" 409 $dupSilageCode.StatusCode

# ── 3. TEST RESULT RECORDING & HISTORY ───────────────────────
Write-Host "`n--- 3. Test Result Recording & History Tracking ---" -ForegroundColor Yellow

# Test Result 1: September 20 (Protein = 18)
$res1 = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    testDate = "2026-09-20"
    moisture = 10.5
    crudeProtein = 18.0
    fiber = 14.0
    energyValue = 2750.0
    mineralStatus = "NORMAL"
    aflatoxin = 4.0
    analysisSource = "MANUAL"
}
Assert-Result "Record Feed Test Result 1 (201 Created)" 201 $res1.StatusCode
$testResult1Id = $res1.Body.id
Assert-Result "Result 1 protein is 18.0" 18.0 $res1.Body.crudeProtein

# Test Result 2: September 23 (Protein = 20)
$res2 = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    testDate = "2026-09-23"
    moisture = 10.2
    crudeProtein = 20.0
    fiber = 13.5
    energyValue = 2820.0
    mineralStatus = "NORMAL"
    aflatoxin = 3.5
    analysisSource = "MANUAL"
}
Assert-Result "Record Feed Test Result 2 (201 Created)" 201 $res2.StatusCode
$testResult2Id = $res2.Body.id
Assert-Result "Result 2 protein is 20.0" 20.0 $res2.Body.crudeProtein

# Test Result 3: September 26 (Protein = 17)
$res3 = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    testDate = "2026-09-26"
    moisture = 11.0
    crudeProtein = 17.0
    fiber = 15.0
    energyValue = 2700.0
    mineralStatus = "NORMAL"
    aflatoxin = 5.0
    analysisSource = "MANUAL"
}
Assert-Result "Record Feed Test Result 3 (201 Created)" 201 $res3.StatusCode
$testResult3Id = $res3.Body.id
Assert-Result "Result 3 protein is 17.0" 17.0 $res3.Body.crudeProtein

# Verify Historical Integrity: All 3 records exist and are ordered
$feedHistory = Invoke-Api "GET" "/api/feed-samples/$feedSampleId/test-results" $tokenA $null
Assert-Result "Get Feed Test History (200 OK)" 200 $feedHistory.StatusCode
Assert-Result "Feed History has exactly 3 records" 3 $feedHistory.Body.Count
Assert-Result "Feed History record 1 date is 2026-09-20" "2026-09-20" $feedHistory.Body[0].testDate
Assert-Result "Feed History record 2 date is 2026-09-23" "2026-09-23" $feedHistory.Body[1].testDate
Assert-Result "Feed History record 3 date is 2026-09-26" "2026-09-26" $feedHistory.Body[2].testDate

# Record Silage Test Result (with pH)
$silageRes = Invoke-Api "POST" "/api/test-results" $tokenA @{
    silageSampleId = $silageSampleId
    testDate = "2026-09-26"
    moisture = 68.0
    crudeProtein = 9.0
    fiber = 24.0
    aflatoxin = 12.0
    ph = 4.1
    mouldDetected = $true
    spoilageDetected = $false
    analysisSource = "MANUAL"
}
Assert-Result "Record Silage Test Result (201 Created)" 201 $silageRes.StatusCode
$silageTestResultId = $silageRes.Body.id
Assert-Result "Silage Test pH is 4.1" 4.1 $silageRes.Body.ph
Assert-Result "Silage Test mouldDetected is true" $true $silageRes.Body.mouldDetected

# Verify Silage History endpoint
$silageHistory = Invoke-Api "GET" "/api/silage-samples/$silageSampleId/test-results" $tokenA $null
Assert-Result "Get Silage Test History (200 OK)" 200 $silageHistory.StatusCode
Assert-Result "Silage History has at least 1 record" 1 $silageHistory.Body.Count

# ── 4. CROSS-FARMER OWNERSHIP SECURITY (403 Forbidden) ───────
Write-Host "`n--- 4. Cross-Farmer Ownership Security (Farmer B Access Denied) ---" -ForegroundColor Yellow

# Farmer B tries to GET Farmer A's feed sample
$bGetFeed = Invoke-Api "GET" "/api/feed-samples/$feedSampleId" $tokenB $null
Assert-Result "Farmer B GET Feed Sample A rejected (403 Forbidden)" 403 $bGetFeed.StatusCode

# Farmer B tries to PUT Farmer A's feed sample
$bPutFeed = Invoke-Api "PUT" "/api/feed-samples/$feedSampleId" $tokenB @{
    farmId = $farmAId
    sampleCode = $feedCode
    feedType = "CATTLE_FEED_PELLET"
    sampleDate = "2026-09-26"
}
Assert-Result "Farmer B PUT Feed Sample A rejected (403 Forbidden)" 403 $bPutFeed.StatusCode

# Farmer B tries to DELETE Farmer A's feed sample
$bDelFeed = Invoke-Api "DELETE" "/api/feed-samples/$feedSampleId" $tokenB $null
Assert-Result "Farmer B DELETE Feed Sample A rejected (403 Forbidden)" 403 $bDelFeed.StatusCode

# Farmer B tries to GET Farmer A's silage sample
$bGetSilage = Invoke-Api "GET" "/api/silage-samples/$silageSampleId" $tokenB $null
Assert-Result "Farmer B GET Silage Sample A rejected (403 Forbidden)" 403 $bGetSilage.StatusCode

# Farmer B tries to PUT Farmer A's silage sample
$bPutSilage = Invoke-Api "PUT" "/api/silage-samples/$silageSampleId" $tokenB @{
    farmId = $farmAId
    sampleCode = $silageCode
    silageType = "MAIZE"
    sampleDate = "2026-09-26"
}
Assert-Result "Farmer B PUT Silage Sample A rejected (403 Forbidden)" 403 $bPutSilage.StatusCode

# Farmer B tries to DELETE Farmer A's silage sample
$bDelSilage = Invoke-Api "DELETE" "/api/silage-samples/$silageSampleId" $tokenB $null
Assert-Result "Farmer B DELETE Silage Sample A rejected (403 Forbidden)" 403 $bDelSilage.StatusCode

# Farmer B tries to record test result against Farmer A's feed sample
$bRecordFeedTest = Invoke-Api "POST" "/api/test-results" $tokenB @{
    feedSampleId = $feedSampleId
    moisture = 10.0
    crudeProtein = 18.0
}
Assert-Result "Farmer B record test on Feed Sample A rejected (403 Forbidden)" 403 $bRecordFeedTest.StatusCode

# Farmer B tries to record test result against Farmer A's silage sample
$bRecordSilageTest = Invoke-Api "POST" "/api/test-results" $tokenB @{
    silageSampleId = $silageSampleId
    moisture = 65.0
    ph = 4.2
}
Assert-Result "Farmer B record test on Silage Sample A rejected (403 Forbidden)" 403 $bRecordSilageTest.StatusCode

# Farmer B tries to view Farmer A's test result directly
$bGetTestRes = Invoke-Api "GET" "/api/test-results/$testResult1Id" $tokenB $null
Assert-Result "Farmer B GET Test Result A rejected (403 Forbidden)" 403 $bGetTestRes.StatusCode

# Farmer B tries to view Farmer A's feed test history
$bGetFeedHistory = Invoke-Api "GET" "/api/feed-samples/$feedSampleId/test-results" $tokenB $null
Assert-Result "Farmer B GET Feed History A rejected (403 Forbidden)" 403 $bGetFeedHistory.StatusCode

# Farmer B tries to view Farmer A's silage test history
$bGetSilageHistory = Invoke-Api "GET" "/api/silage-samples/$silageSampleId/test-results" $tokenB $null
Assert-Result "Farmer B GET Silage History A rejected (403 Forbidden)" 403 $bGetSilageHistory.StatusCode

# ── 5. VALIDATION & ERROR HANDLING ───────────────────────────
Write-Host "`n--- 5. Validation & Edge Cases ---" -ForegroundColor Yellow

# Negative moisture
$negMoisture = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    moisture = -5.0
}
Assert-Result "Negative moisture rejected (400 Bad Request)" 400 $negMoisture.StatusCode

# Negative crudeProtein
$negProtein = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    crudeProtein = -2.0
}
Assert-Result "Negative crudeProtein rejected (400 Bad Request)" 400 $negProtein.StatusCode

# Negative fiber
$negFiber = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    fiber = -1.0
}
Assert-Result "Negative fiber rejected (400 Bad Request)" 400 $negFiber.StatusCode

# Negative energyValue
$negEnergy = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    energyValue = -100.0
}
Assert-Result "Negative energyValue rejected (400 Bad Request)" 400 $negEnergy.StatusCode

# Negative aflatoxin
$negAflatoxin = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    aflatoxin = -0.5
}
Assert-Result "Negative aflatoxin rejected (400 Bad Request)" 400 $negAflatoxin.StatusCode

# Negative pH
$negPh = Invoke-Api "POST" "/api/test-results" $tokenA @{
    silageSampleId = $silageSampleId
    ph = -1.0
}
Assert-Result "Negative pH rejected (400 Bad Request)" 400 $negPh.StatusCode

# TestResult with neither feedSampleId nor silageSampleId
$noTargetTest = Invoke-Api "POST" "/api/test-results" $tokenA @{
    moisture = 10.0
}
Assert-Result "TestResult missing sample ID rejected (400 Bad Request)" 400 $noTargetTest.StatusCode

# TestResult with both feedSampleId and silageSampleId
$bothTargetTest = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = $feedSampleId
    silageSampleId = $silageSampleId
    moisture = 10.0
}
Assert-Result "TestResult with both sample IDs rejected (400 Bad Request)" 400 $bothTargetTest.StatusCode

# Invalid relationship: Animal belongs to Farm B, but farmId is Farm A
$invalidAnimalFarm = Invoke-Api "POST" "/api/feed-samples" $tokenA @{
    farmId = $farmAId
    animalId = $animalBId
    sampleCode = "FEED-MISMATCH-$timestamp"
    feedType = "CATTLE_FEED_PELLET"
    sampleDate = "2026-09-26"
}
Assert-Result "Animal not in Farm rejected (400 Bad Request)" 400 $invalidAnimalFarm.StatusCode

# ── 6. NON-EXISTENT RESOURCES (404 Not Found) ────────────────
Write-Host "`n--- 6. Non-Existent Resource Tests (404 Not Found) ---" -ForegroundColor Yellow

$notFoundFeed = Invoke-Api "GET" "/api/feed-samples/999999" $tokenA $null
Assert-Result "Non-existent Feed Sample returns 404" 404 $notFoundFeed.StatusCode

$notFoundSilage = Invoke-Api "GET" "/api/silage-samples/999999" $tokenA $null
Assert-Result "Non-existent Silage Sample returns 404" 404 $notFoundSilage.StatusCode

$notFoundTestRes = Invoke-Api "GET" "/api/test-results/999999" $tokenA $null
Assert-Result "Non-existent Test Result returns 404" 404 $notFoundTestRes.StatusCode

$testOnNonExistentFeed = Invoke-Api "POST" "/api/test-results" $tokenA @{
    feedSampleId = 999999
    moisture = 12.0
}
Assert-Result "Test on non-existent Feed Sample returns 404" 404 $testOnNonExistentFeed.StatusCode

$testOnNonExistentSilage = Invoke-Api "POST" "/api/test-results" $tokenA @{
    silageSampleId = 999999
    moisture = 65.0
}
Assert-Result "Test on non-existent Silage Sample returns 404" 404 $testOnNonExistentSilage.StatusCode

# ── 7. ADMIN PRIVILEGES ACROSS FARMERS ───────────────────────
Write-Host "`n--- 7. Admin Privileges Across Farmers ---" -ForegroundColor Yellow

$regAdmin = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $adminUser
    email = $adminEmail
    password = $password
    phone = "9999900001"
    language = "en"
}
Assert-Result "Register Admin User" 201 $regAdmin.StatusCode

# Promote to ADMIN in database
& mysql -u root -p"sql@2007" -e "USE cattlefeedai; UPDATE users SET role = 'ADMIN' WHERE email = '$adminEmail';" 2>&1 | Out-Null

$adminLogin = Invoke-Api "POST" "/api/auth/login" $null @{
    email = $adminEmail
    password = $password
}
Assert-Result "Login as ADMIN user" 200 $adminLogin.StatusCode
$adminToken = $adminLogin.Body.token

# Admin can view all feed samples
$adminAllFeeds = Invoke-Api "GET" "/api/feed-samples" $adminToken $null
Assert-Result "Admin GET all feed samples returns 200" 200 $adminAllFeeds.StatusCode

# Admin can view Farmer A's feed sample directly
$adminGetFeedA = Invoke-Api "GET" "/api/feed-samples/$feedSampleId" $adminToken $null
Assert-Result "Admin GET Farmer A feed sample returns 200" 200 $adminGetFeedA.StatusCode

# Admin can view all silage samples
$adminAllSilage = Invoke-Api "GET" "/api/silage-samples" $adminToken $null
Assert-Result "Admin GET all silage samples returns 200" 200 $adminAllSilage.StatusCode

# Admin can view Farmer A's silage sample directly
$adminGetSilageA = Invoke-Api "GET" "/api/silage-samples/$silageSampleId" $adminToken $null
Assert-Result "Admin GET Farmer A silage sample returns 200" 200 $adminGetSilageA.StatusCode

# Admin can view Farmer A's test result directly
$adminGetTestA = Invoke-Api "GET" "/api/test-results/$testResult1Id" $adminToken $null
Assert-Result "Admin GET Farmer A test result returns 200" 200 $adminGetTestA.StatusCode

# ── 8. DELETION & CLEANUP ────────────────────────────────────
Write-Host "`n--- 8. Deletion & Cleanup ---" -ForegroundColor Yellow

# Delete Feed Sample A (should also delete its 3 test results)
$delFeed = Invoke-Api "DELETE" "/api/feed-samples/$feedSampleId" $tokenA $null
Assert-Result "Delete Feed Sample A (204 No Content)" 204 $delFeed.StatusCode

$getDelFeed = Invoke-Api "GET" "/api/feed-samples/$feedSampleId" $tokenA $null
Assert-Result "Get Deleted Feed Sample returns 404" 404 $getDelFeed.StatusCode

$getDelFeedTest = Invoke-Api "GET" "/api/test-results/$testResult1Id" $tokenA $null
Assert-Result "Get Cascaded Deleted Test Result returns 404" 404 $getDelFeedTest.StatusCode

# Delete Silage Sample A
$delSilage = Invoke-Api "DELETE" "/api/silage-samples/$silageSampleId" $tokenA $null
Assert-Result "Delete Silage Sample A (204 No Content)" 204 $delSilage.StatusCode

$getDelSilage = Invoke-Api "GET" "/api/silage-samples/$silageSampleId" $tokenA $null
Assert-Result "Get Deleted Silage Sample returns 404" 404 $getDelSilage.StatusCode

# ── SUMMARY ──────────────────────────────────────────────────
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " FEED & SILAGE INTEGRATION TEST SUMMARY" -ForegroundColor Cyan
Write-Host " Total Tests  : $totalTests"
Write-Host " Passed Tests : $passedTests" -ForegroundColor Green
Write-Host " Failed Tests : $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
