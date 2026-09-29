# CattleFeedAI Farm & Animal Management Integration Test Suite
$ErrorActionPreference = "Continue"

$baseUrl = "http://localhost:8080"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$farmerAEmail = "farmer_a_$timestamp@example.com"
$farmerAUser = "farmer_a_$timestamp"
$farmerBEmail = "farmer_b_$timestamp@example.com"
$farmerBUser = "farmer_b_$timestamp"
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
Write-Host " Starting CattleFeedAI Farm & Animal API Test Suite" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Register Farmer A
Write-Host "`n--- Step 1: Register Farmer A ---" -ForegroundColor Yellow
$regA = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $farmerAUser
    email = $farmerAEmail
    password = $password
    phone = "9876543210"
    language = "en"
}
Assert-Result "Register Farmer A" 201 $regA.StatusCode
$tokenA = $regA.Body.token

# Step 2: Create Farm A as Farmer A
Write-Host "`n--- Step 2: Create Farm A as Farmer A ---" -ForegroundColor Yellow
$farmABody = @{
    farmName = "Sri Dairy Farm"
    location = "Kanchipuram"
    district = "Kanchipuram"
    state = "Tamil Nadu"
    pincode = "631501"
}
$createFarmA = Invoke-Api "POST" "/api/farms" $tokenA $farmABody
Assert-Result "Create Farm A (201 Created)" 201 $createFarmA.StatusCode
$farmAId = $createFarmA.Body.id
Write-Host "  Farm A ID: $farmAId" -ForegroundColor Gray

# Step 3: Get Farm A as Farmer A
Write-Host "`n--- Step 3: Get Farm A as Farmer A ---" -ForegroundColor Yellow
$getFarmA = Invoke-Api "GET" "/api/farms/$farmAId" $tokenA $null
Assert-Result "Get Farm A by ID (200 OK)" 200 $getFarmA.StatusCode
Assert-Result "Farm A name matches" "Sri Dairy Farm" $getFarmA.Body.farmName

# Step 4: Create Animal A under Farm A
Write-Host "`n--- Step 4: Create Animal A under Farm A ---" -ForegroundColor Yellow
$animalABody = @{
    farmId = $farmAId
    animalTag = "COW001"
    name = "Lakshmi"
    breed = "Jersey"
    gender = "FEMALE"
    dateOfBirth = "2022-05-10"
    weight = 420.0
    lactationStage = "MID"
    daysInMilk = 120
    milkProductionPerDay = 14.0
    pregnancyStatus = "NOT_PREGNANT"
    feedIntakeStatus = "NORMAL"
}
$createAnimalA = Invoke-Api "POST" "/api/animals" $tokenA $animalABody
Assert-Result "Create Animal A (201 Created)" 201 $createAnimalA.StatusCode
$animalAId = $createAnimalA.Body.id
Write-Host "  Animal A ID: $animalAId" -ForegroundColor Gray

# Step 5: Retrieve Animal A
Write-Host "`n--- Step 5: Retrieve Animal A ---" -ForegroundColor Yellow
$getAnimalA = Invoke-Api "GET" "/api/animals/$animalAId" $tokenA $null
Assert-Result "Retrieve Animal A (200 OK)" 200 $getAnimalA.StatusCode
Assert-Result "Animal A tag matches" "COW001" $getAnimalA.Body.animalTag
Assert-Result "Animal A name matches" "Lakshmi" $getAnimalA.Body.name

# Step 6: Update Animal A
Write-Host "`n--- Step 6: Update Animal A ---" -ForegroundColor Yellow
$updateAnimalABody = @{
    farmId = $farmAId
    animalTag = "COW001"
    name = "Lakshmi Updated"
    breed = "Jersey"
    gender = "FEMALE"
    dateOfBirth = "2022-05-10"
    weight = 435.5
    lactationStage = "MID"
    daysInMilk = 130
    milkProductionPerDay = 15.5
    pregnancyStatus = "NOT_PREGNANT"
    feedIntakeStatus = "NORMAL"
}
$updateAnimalA = Invoke-Api "PUT" "/api/animals/$animalAId" $tokenA $updateAnimalABody
Assert-Result "Update Animal A (200 OK)" 200 $updateAnimalA.StatusCode
Assert-Result "Animal A updated name" "Lakshmi Updated" $updateAnimalA.Body.name
Assert-Result "Animal A updated daysInMilk" 130 $updateAnimalA.Body.daysInMilk

# Step 7: Test Duplicate animalTag in Same Farm
Write-Host "`n--- Step 7: Duplicate animalTag within Same Farm ---" -ForegroundColor Yellow
$duplicateAnimalBody = @{
    farmId = $farmAId
    animalTag = "COW001"
    name = "Duplicate Lakshmi"
    gender = "FEMALE"
}
$dupRes = Invoke-Api "POST" "/api/animals" $tokenA $duplicateAnimalBody
Assert-Result "Duplicate animalTag rejected (409 Conflict)" 409 $dupRes.StatusCode

# Step 8: Test Invalid Animal Values
Write-Host "`n--- Step 8: Test Invalid Animal Values ---" -ForegroundColor Yellow
# Negative weight
$negWeight = Invoke-Api "POST" "/api/animals" $tokenA @{ farmId = $farmAId; animalTag = "NEG_WT"; gender = "FEMALE"; weight = -10.0 }
Assert-Result "Negative weight rejected (400 Bad Request)" 400 $negWeight.StatusCode

# Negative daysInMilk
$negDim = Invoke-Api "POST" "/api/animals" $tokenA @{ farmId = $farmAId; animalTag = "NEG_DIM"; gender = "FEMALE"; daysInMilk = -5 }
Assert-Result "Negative daysInMilk rejected (400 Bad Request)" 400 $negDim.StatusCode

# Negative milkProductionPerDay
$negMilk = Invoke-Api "POST" "/api/animals" $tokenA @{ farmId = $farmAId; animalTag = "NEG_MLK"; gender = "FEMALE"; milkProductionPerDay = -1.5 }
Assert-Result "Negative milkProductionPerDay rejected (400 Bad Request)" 400 $negMilk.StatusCode

# Missing farmId
$noFarm = Invoke-Api "POST" "/api/animals" $tokenA @{ animalTag = "NO_FARM"; gender = "FEMALE" }
Assert-Result "Missing farmId rejected (400 Bad Request)" 400 $noFarm.StatusCode

# Missing animalTag
$noTag = Invoke-Api "POST" "/api/animals" $tokenA @{ farmId = $farmAId; gender = "FEMALE" }
Assert-Result "Missing animalTag rejected (400 Bad Request)" 400 $noTag.StatusCode

# Invalid gender enum
$badGender = Invoke-Api "POST" "/api/animals" $tokenA @{ farmId = $farmAId; animalTag = "BAD_GEN"; gender = "INVALID_GENDER" }
Assert-Result "Invalid gender enum rejected (400 Bad Request)" 400 $badGender.StatusCode

# Step 9: Register Farmer B
Write-Host "`n--- Step 9: Register Farmer B ---" -ForegroundColor Yellow
$regB = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $farmerBUser
    email = $farmerBEmail
    password = $password
    phone = "9123456780"
    language = "en"
}
Assert-Result "Register Farmer B" 201 $regB.StatusCode
$tokenB = $regB.Body.token

# Step 10: Farmer B attempts unauthorized access to Farmer A's Farm
Write-Host "`n--- Step 10: Farmer B Unauthorized Access to Farmer A's Farm ---" -ForegroundColor Yellow
$bGetFarmA = Invoke-Api "GET" "/api/farms/$farmAId" $tokenB $null
Assert-Result "Farmer B GET Farm A rejected (403 Forbidden)" 403 $bGetFarmA.StatusCode

$bPutFarmA = Invoke-Api "PUT" "/api/farms/$farmAId" $tokenB @{ farmName = "Hacked Farm" }
Assert-Result "Farmer B PUT Farm A rejected (403 Forbidden)" 403 $bPutFarmA.StatusCode

$bDeleteFarmA = Invoke-Api "DELETE" "/api/farms/$farmAId" $tokenB $null
Assert-Result "Farmer B DELETE Farm A rejected (403 Forbidden)" 403 $bDeleteFarmA.StatusCode

# Step 11: Farmer B attempts unauthorized access to Farmer A's Animal
Write-Host "`n--- Step 11: Farmer B Unauthorized Access to Farmer A's Animal ---" -ForegroundColor Yellow
$bGetAnimalA = Invoke-Api "GET" "/api/animals/$animalAId" $tokenB $null
Assert-Result "Farmer B GET Animal A rejected (403 Forbidden)" 403 $bGetAnimalA.StatusCode

$bPutAnimalA = Invoke-Api "PUT" "/api/animals/$animalAId" $tokenB @{ farmId = $farmAId; animalTag = "COW001"; gender = "FEMALE" }
Assert-Result "Farmer B PUT Animal A rejected (403 Forbidden)" 403 $bPutAnimalA.StatusCode

$bDeleteAnimalA = Invoke-Api "DELETE" "/api/animals/$animalAId" $tokenB $null
Assert-Result "Farmer B DELETE Animal A rejected (403 Forbidden)" 403 $bDeleteAnimalA.StatusCode

$bCreateInFarmA = Invoke-Api "POST" "/api/animals" $tokenB @{ farmId = $farmAId; animalTag = "COW_HACK"; gender = "FEMALE" }
Assert-Result "Farmer B POST Animal into Farm A rejected (403 Forbidden)" 403 $bCreateInFarmA.StatusCode

$bListFarmA = Invoke-Api "GET" "/api/animals?farmId=$farmAId" $tokenB $null
Assert-Result "Farmer B GET Animals of Farm A rejected (403 Forbidden)" 403 $bListFarmA.StatusCode

# Step 12: Non-existent Resource Tests (404 Not Found)
Write-Host "`n--- Step 12: Non-Existent Resources (404 Not Found) ---" -ForegroundColor Yellow
$notFoundFarm = Invoke-Api "GET" "/api/farms/999999" $tokenA $null
Assert-Result "Non-existent Farm returns 404" 404 $notFoundFarm.StatusCode

$notFoundAnimal = Invoke-Api "GET" "/api/animals/999999" $tokenA $null
Assert-Result "Non-existent Animal returns 404" 404 $notFoundAnimal.StatusCode

$animalInNonExistentFarm = Invoke-Api "POST" "/api/animals" $tokenA @{ farmId = 999999; animalTag = "COW_LOST"; gender = "FEMALE" }
Assert-Result "Animal with non-existent farmId returns 404" 404 $animalInNonExistentFarm.StatusCode

# Step 13: Create Farm B under Farmer B
Write-Host "`n--- Step 13: Create Farm B under Farmer B ---" -ForegroundColor Yellow
$farmBBody = @{
    farmName = "Green Valley Farm"
    location = "Madurai"
    district = "Madurai"
    state = "Tamil Nadu"
    pincode = "625001"
}
$createFarmB = Invoke-Api "POST" "/api/farms" $tokenB $farmBBody
Assert-Result "Create Farm B (201 Created)" 201 $createFarmB.StatusCode
$farmBId = $createFarmB.Body.id
Write-Host "  Farm B ID: $farmBId" -ForegroundColor Gray

# Step 14: Test that the same animalTag (COW001) CAN exist in Farm B
Write-Host "`n--- Step 14: Same animalTag in Different Farm (Farm B) ---" -ForegroundColor Yellow
$animalBBody = @{
    farmId = $farmBId
    animalTag = "COW001"
    name = "Gauri"
    breed = "Holstein"
    gender = "FEMALE"
    dateOfBirth = "2023-01-15"
    weight = 380.0
    pregnancyStatus = "NOT_PREGNANT"
    feedIntakeStatus = "NORMAL"
}
$createAnimalB = Invoke-Api "POST" "/api/animals" $tokenB $animalBBody
Assert-Result "Create COW001 in Farm B succeeds (201 Created)" 201 $createAnimalB.StatusCode
$animalBId = $createAnimalB.Body.id

# Verify both animals exist and have same tag under their respective farms
$getA = Invoke-Api "GET" "/api/animals/$animalAId" $tokenA $null
$getB = Invoke-Api "GET" "/api/animals/$animalBId" $tokenB $null
Assert-Result "Animal A tag is COW001" "COW001" $getA.Body.animalTag
Assert-Result "Animal B tag is COW001" "COW001" $getB.Body.animalTag
Assert-Result "Animal A farm is Farm A" $farmAId $getA.Body.farmId
Assert-Result "Animal B farm is Farm B" $farmBId $getB.Body.farmId

# Step 15: Delete Animal A as Farmer A
Write-Host "`n--- Step 15: Delete Animal A as Farmer A ---" -ForegroundColor Yellow
$delAnimalA = Invoke-Api "DELETE" "/api/animals/$animalAId" $tokenA $null
Assert-Result "Delete Animal A (204 No Content)" 204 $delAnimalA.StatusCode

$getDeletedAnimalA = Invoke-Api "GET" "/api/animals/$animalAId" $tokenA $null
Assert-Result "Get Deleted Animal A returns 404" 404 $getDeletedAnimalA.StatusCode

# Step 16: Delete Farm A as Farmer A
Write-Host "`n--- Step 16: Delete Farm A as Farmer A ---" -ForegroundColor Yellow
$delFarmA = Invoke-Api "DELETE" "/api/farms/$farmAId" $tokenA $null
Assert-Result "Delete Farm A (204 No Content)" 204 $delFarmA.StatusCode

$getDeletedFarmA = Invoke-Api "GET" "/api/farms/$farmAId" $tokenA $null
Assert-Result "Get Deleted Farm A returns 404" 404 $getDeletedFarmA.StatusCode

# Step 17: Admin Access All Farms & Animals
Write-Host "`n--- Step 17: Admin Access All Resources ---" -ForegroundColor Yellow
$adminEmail = "admin_$timestamp@example.com"
$adminUser = "admin_$timestamp"
$regAdmin = Invoke-Api "POST" "/api/auth/register" $null @{
    username = $adminUser
    email = $adminEmail
    password = $password
    phone = "9999988888"
    language = "en"
}
Assert-Result "Register Admin User" 201 $regAdmin.StatusCode

# Promote to ADMIN in database
& mysql -u root -p"sql@2007" -e "USE cattlefeedai; UPDATE users SET role = 'ADMIN' WHERE email = '$adminEmail';" 2>&1 | Out-Null

# Login as ADMIN to get fresh token with ROLE_ADMIN
$adminLogin = Invoke-Api "POST" "/api/auth/login" $null @{
    email = $adminEmail
    password = $password
}
Assert-Result "Login as ADMIN user" 200 $adminLogin.StatusCode
$adminToken = $adminLogin.Body.token

# Admin gets all farms (sees Farm B)
$adminFarms = Invoke-Api "GET" "/api/farms" $adminToken $null
Assert-Result "Admin GET all farms returns 200" 200 $adminFarms.StatusCode

# Admin gets Farmer B's farm directly
$adminGetFarmB = Invoke-Api "GET" "/api/farms/$farmBId" $adminToken $null
Assert-Result "Admin GET Farmer B's farm returns 200" 200 $adminGetFarmB.StatusCode

# Admin gets all animals (sees Animal B)
$adminAnimals = Invoke-Api "GET" "/api/animals" $adminToken $null
Assert-Result "Admin GET all animals returns 200" 200 $adminAnimals.StatusCode

# Admin gets Farmer B's animal directly
$adminGetAnimalB = Invoke-Api "GET" "/api/animals/$animalBId" $adminToken $null
Assert-Result "Admin GET Farmer B's animal returns 200" 200 $adminGetAnimalB.StatusCode

# Summary
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Total Tests  : $totalTests"
Write-Host " Passed Tests : $passedTests" -ForegroundColor Green
Write-Host " Failed Tests : $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
