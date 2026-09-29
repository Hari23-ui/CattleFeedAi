// verify_m65_real_backend.mjs
// CattleFeedAI Milestone 6.5 Real Backend Live Verification
// Tests against real Spring Boot backend on http://localhost:8080
// Verifies Animal Health Risk Screening endpoints, data integration, ownership, and non-diagnostic constraints

const BASE_URL = 'http://localhost:8080';

let totalSteps = 0;
let passedSteps = 0;
let failedSteps = 0;

function assert(condition, message, details = null) {
  totalSteps++;
  if (condition) {
    console.log(`  [PASS] Step ${totalSteps}: ${message}`);
    passedSteps++;
  } else {
    console.error(`  [FAIL] Step ${totalSteps}: ${message}`);
    if (details) console.error(`         Details:`, details);
    failedSteps++;
  }
}

async function run() {
  const timestamp = Date.now();
  const farmerEmail = `farmer_m65_${timestamp}@dairyfarm.com`;
  const farmerUser = `farmer_m65_${timestamp}`;
  const farmer2Email = `farmer2_m65_${timestamp}@dairyfarm.com`;
  const farmer2User = `farmer2_m65_${timestamp}`;
  const password = 'Password@123';

  console.log('===============================================================');
  console.log('  STARTING M6.5 LIVE BACKEND VERIFICATION ON http://localhost:8080');
  console.log('===============================================================');

  // 1. Register Farmer A
  const regA = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: farmerUser,
      email: farmerEmail,
      password: password,
      fullName: 'Farmer M6.5 Tester',
      role: 'FARMER',
    }),
  });
  assert(regA.status === 201, 'Register Farmer A returns 201', regA.status);
  const authA = await regA.json();
  const tokenA = authA.token;
  assert(!!tokenA, 'Farmer A JWT token obtained');

  const headersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenA}`,
  };

  // 2. Register Farmer B (for cross-user ownership / 403 test)
  const regB = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: farmer2User,
      email: farmer2Email,
      password: password,
      fullName: 'Farmer B Ownership Tester',
      role: 'FARMER',
    }),
  });
  assert(regB.status === 201, 'Register Farmer B returns 201', regB.status);
  const authB = await regB.json();
  const tokenB = authB.token;

  // 3. Create Farm
  const farmRes = await fetch(`${BASE_URL}/api/farms`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmName: `Health Screening Dairy Farm ${timestamp}`,
      location: 'Anand District Agro Hub',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388001',
      totalAnimals: 15,
      milkingAnimals: 12,
      dryAnimals: 3,
    }),
  });
  assert(farmRes.status === 201, 'Create Farm returns 201', farmRes.status);
  const farm = await farmRes.json();

  // 4. Create Animal 1 (Early Lactation, High Milk Yield 16.5 L, Reduced Intake)
  const animal1Res = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      animalTag: `TAG-M65-01-${timestamp.toString().slice(-4)}`,
      name: 'Surabhi',
      breed: 'Gir',
      gender: 'FEMALE',
      lactationStage: 'EARLY',
      milkProductionPerDay: 16.5,
      feedIntakeStatus: 'REDUCED',
    }),
  });
  assert(animal1Res.status === 201, 'Create Animal 1 (High Yield Lactation) returns 201', animal1Res.status);
  const animal1 = await animal1Res.json();

  // 5. Create Animal 2 (No records yet -> INSUFFICIENT_DATA scenario)
  const animal2Res = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      animalTag: `TAG-M65-02-${timestamp.toString().slice(-4)}`,
      name: 'Nandini',
      breed: 'Sahiwal',
      gender: 'FEMALE',
      lactationStage: 'MID',
      milkProductionPerDay: 10.0,
      feedIntakeStatus: 'NORMAL',
    }),
  });
  assert(animal2Res.status === 201, 'Create Animal 2 (Insufficient Data Scenario) returns 201', animal2Res.status);
  const animal2 = await animal2Res.json();

  // 6. Retrieve Animal 1 profile
  const getAnimal1Res = await fetch(`${BASE_URL}/api/animals/${animal1.id}`, {
    headers: headersA,
  });
  assert(getAnimal1Res.status === 200, 'GET /api/animals/:id returns 200', getAnimal1Res.status);
  const fetchedAnimal1 = await getAnimal1Res.json();
  assert(fetchedAnimal1.animalTag === animal1.animalTag, 'Animal 1 tag verified');
  assert(fetchedAnimal1.lactationStage === 'EARLY', 'Animal 1 lactation stage is EARLY');

  // 7. Animal 2 Health Screening (No records -> INSUFFICIENT_DATA)
  const screen2Res = await fetch(`${BASE_URL}/api/assessments/animals/${animal2.id}/health-screening`, {
    headers: headersA,
  });
  assert(screen2Res.status === 200, 'GET /api/assessments/animals/:id/health-screening returns 200', screen2Res.status);
  const screen2 = await screen2Res.json();
  assert(screen2.screeningStatus === 'INSUFFICIENT_DATA', `Animal 2 status is INSUFFICIENT_DATA (got ${screen2.screeningStatus})`);
  assert(screen2.missingInformation && screen2.missingInformation.length >= 1, 'Animal 2 explains missing requirements');
  assert(screen2.detectedRisks.length === 0, 'Animal 2 has 0 detected risks');
  assert(screen2.disclaimer && screen2.disclaimer.includes('does NOT constitute a veterinary diagnosis'), 'Screening disclaimer is present');

  // 8. Create Feed Sample linked to Animal 1
  const feedSampleRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      animalId: animal1.id,
      sampleCode: `FS-HSCREEN-${timestamp}`,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-27',
      source: 'Local Feed Mill Supplier',
    }),
  });
  assert(feedSampleRes.status === 201, 'Create Feed Sample for Animal 1 returns 201', feedSampleRes.status);
  const feedSample = await feedSampleRes.json();

  // 9. Record Test Result with low protein (10.5%), elevated moisture (19.0%), and mould (true)
  const testRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      feedSampleId: feedSample.id,
      testDate: '2026-09-27',
      analysisSource: 'LAB',
      moisture: 19.0,
      crudeProtein: 10.5,
      fiber: 25.0,
      aflatoxin: 48.0,
      mouldDetected: true,
      spoilageDetected: true,
      adulteration: 'None',
    }),
  });
  assert(testRes.status === 201, 'Record Test Result for Animal 1 Feed returns 201', testRes.status);
  const testResult = await testRes.json();

  // 10. Run Quality Assessment on Test Result
  const qaRes = await fetch(`${BASE_URL}/api/assessments/test-results/${testResult.id}`, {
    headers: headersA,
  });
  assert(qaRes.status === 200, 'GET /api/assessments/test-results/:id returns 200', qaRes.status);
  const qa = await qaRes.json();
  assert(qa.qualityStatus === 'UNSAFE', `Test result quality is UNSAFE (got ${qa.qualityStatus})`);

  // 11. Run Risk Assessment on Test Result
  const riskRes = await fetch(`${BASE_URL}/api/assessments/test-results/${testResult.id}/risk`, {
    headers: headersA,
  });
  assert(riskRes.status === 200, 'GET /api/assessments/test-results/:id/risk returns 200', riskRes.status);
  const riskData = await riskRes.json();
  assert(riskData.overallRiskLevel === 'HIGH', `Risk level is HIGH (got ${riskData.overallRiskLevel})`);

  // 12. Evaluate & Generate Advisories for Animal 1 (POST /api/assessments/test-results/:id)
  const evalRes = await fetch(`${BASE_URL}/api/assessments/test-results/${testResult.id}`, {
    method: 'POST',
    headers: headersA,
  });
  assert(evalRes.status === 200, 'POST /api/assessments/test-results/:id returns 200', evalRes.status);
  const evalSummary = await evalRes.json();
  assert(evalSummary.generatedAdvisories && evalSummary.generatedAdvisories.length >= 1, 'Advisories generated for Animal 1');

  // 13. Animal 1 Health Screening (Now correlates high lactation yield + low crude protein & reduced intake + mould)
  const screen1Res = await fetch(`${BASE_URL}/api/assessments/animals/${animal1.id}/health-screening`, {
    headers: headersA,
  });
  assert(screen1Res.status === 200, 'GET /api/assessments/animals/:id/health-screening (Animal 1) returns 200', screen1Res.status);
  const screen1 = await screen1Res.json();
  assert(screen1.screeningStatus === 'POTENTIAL_CONCERN', `Animal 1 status is POTENTIAL_CONCERN (got ${screen1.screeningStatus})`);
  assert(screen1.detectedRisks && screen1.detectedRisks.length >= 1, `Animal 1 detects potential feed-related risk indicators (count: ${screen1.detectedRisks.length})`);
  assert(screen1.recentTestResultsCount >= 1, `Animal 1 recent test results count >= 1 (got ${screen1.recentTestResultsCount})`);

  // 14. Non-Diagnostic Wording Verification across all detected risks
  let hasDiagnosticClaim = false;
  let hasScreeningTitle = false;
  for (const r of screen1.detectedRisks) {
    if (
      r.riskTitle.toLowerCase().includes('diagnosed') ||
      r.riskTitle.toLowerCase().includes('has disease') ||
      r.description.toLowerCase().includes('confirmed disease') ||
      r.description.toLowerCase().includes('has mastitis') ||
      r.description.toLowerCase().includes('has ketosis')
    ) {
      hasDiagnosticClaim = true;
    }
    if (
      r.riskTitle.includes('Potential') ||
      r.riskTitle.includes('Possible') ||
      r.riskTitle.includes('Risk') ||
      r.riskTitle.includes('Concern')
    ) {
      hasScreeningTitle = true;
    }
  }
  assert(!hasDiagnosticClaim, 'Verified: Detected risks contain ZERO diagnostic disease claims');
  assert(hasScreeningTitle, 'Verified: Detected risks use non-diagnostic screening terminology');

  // 15. Query Feed Samples for Animal 1 (GET /api/feed-samples?animalId=...)
  const animalFeedRes = await fetch(`${BASE_URL}/api/feed-samples?animalId=${animal1.id}`, {
    headers: headersA,
  });
  assert(animalFeedRes.status === 200, 'GET /api/feed-samples?animalId=:id returns 200', animalFeedRes.status);
  const animalFeeds = await animalFeedRes.json();
  assert(animalFeeds.length >= 1, `Animal 1 has associated feed samples (count: ${animalFeeds.length})`);

  // 16. Query Silage Samples for Animal 1 (GET /api/silage-samples?animalId=...)
  const animalSilageRes = await fetch(`${BASE_URL}/api/silage-samples?animalId=${animal1.id}`, {
    headers: headersA,
  });
  assert(animalSilageRes.status === 200, 'GET /api/silage-samples?animalId=:id returns 200', animalSilageRes.status);

  // 17. Query Advisories for Animal 1 (GET /api/advisories?animalId=...)
  const animalAdvRes = await fetch(`${BASE_URL}/api/advisories?animalId=${animal1.id}`, {
    headers: headersA,
  });
  assert(animalAdvRes.status === 200, 'GET /api/advisories?animalId=:id returns 200', animalAdvRes.status);
  const animalAdvisories = await animalAdvRes.json();
  assert(animalAdvisories.length >= 1, `Animal 1 has persisted herd advisories (count: ${animalAdvisories.length})`);

  // 18. Unauthorized Health Screening Request (no JWT header) -> 401
  const unauthRes = await fetch(`${BASE_URL}/api/assessments/animals/${animal1.id}/health-screening`);
  assert(unauthRes.status === 401, 'Unauthorized request without JWT returns 401', unauthRes.status);

  // 19. Cross-User Ownership Access (Farmer B accessing Farmer A\'s animal health screening) -> 403 Forbidden
  const crossUserRes = await fetch(`${BASE_URL}/api/assessments/animals/${animal1.id}/health-screening`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
  });
  assert(crossUserRes.status === 403, 'Cross-user health screening request returns 403 Forbidden', crossUserRes.status);

  // 20. Nonexistent Animal Health Screening -> 404
  const notFoundRes = await fetch(`${BASE_URL}/api/assessments/animals/9999999/health-screening`, {
    headers: headersA,
  });
  assert(notFoundRes.status === 404, 'Nonexistent animal health screening returns 404', notFoundRes.status);

  console.log('\n===============================================================');
  console.log(`M6.5 LIVE BACKEND VERIFICATION COMPLETE:`);
  console.log(`Passed: ${passedSteps}/${totalSteps}`);
  console.log(`Failed: ${failedSteps}/${totalSteps}`);
  console.log('===============================================================');

  if (failedSteps > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('FATAL M6.5 VERIFICATION ERROR:', err);
  process.exit(1);
});
