// verify_m64_real_backend.mjs
// CattleFeedAI Milestone 6.4 Real Backend Live Verification
// Tests against real Spring Boot backend on http://localhost:8080
// Verifies M5 Quality, Risk & Advisory Endpoints directly

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
  const farmerEmail = `farmer_m64_${timestamp}@dairyfarm.com`;
  const farmerUser = `farmer_m64_${timestamp}`;
  const farmer2Email = `farmer2_m64_${timestamp}@dairyfarm.com`;
  const farmer2User = `farmer2_m64_${timestamp}`;
  const password = 'Password@123';

  console.log('===============================================================');
  console.log('  STARTING M6.4 LIVE BACKEND VERIFICATION ON http://localhost:8080');
  console.log('===============================================================');

  // 1. Register Farmer A
  const regA = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: farmerUser,
      email: farmerEmail,
      password: password,
      fullName: 'Farmer M6.4 Tester',
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
      fullName: 'Farmer B Tester',
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
      farmName: `Assessment Testing Farm ${timestamp}`,
      location: 'Pune Agricultural Zone',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      totalAnimals: 10,
      milkingAnimals: 8,
      dryAnimals: 2,
    }),
  });
  assert(farmRes.status === 201, 'Create Farm returns 201', farmRes.status);
  const farm = await farmRes.json();

  // 4. Create Animal
  const animalRes = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      animalTag: `TAG-M64-${timestamp.toString().slice(-4)}`,
      name: 'Kamadhenu',
      breed: 'Gir',
      gender: 'FEMALE',
      lactationStage: 'EARLY',
      milkProductionPerDay: 15.0,
      feedIntakeStatus: 'NORMAL',
    }),
  });
  assert(animalRes.status === 201, 'Create Animal returns 201', animalRes.status);
  const animal = await animalRes.json();

  // 5. Create Clean Feed Sample & Test Result
  const cleanFeedRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      animalId: animal.id,
      sampleCode: `FS-CLEAN-${timestamp}`,
      feedType: 'GREEN_FODDER',
      sampleDate: '2026-09-27',
      source: 'Farm Fresh Pasture',
    }),
  });
  assert(cleanFeedRes.status === 201, 'Create Clean Feed Sample returns 201', cleanFeedRes.status);
  const cleanFeed = await cleanFeedRes.json();

  const cleanTestRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      feedSampleId: cleanFeed.id,
      testDate: '2026-09-27',
      analysisSource: 'LAB',
      moisture: 12.0,
      crudeProtein: 18.0,
      fiber: 18.0,
      energyValue: 11.5,
      aflatoxin: 3.5,
      mouldDetected: false,
      spoilageDetected: false,
    }),
  });
  assert(cleanTestRes.status === 201, 'Record Clean Test Result returns 201', cleanTestRes.status);
  const cleanTest = await cleanTestRes.json();

  // 6. Assess Clean Feed Quality (GET /api/assessments/test-results/:id)
  const qaCleanRes = await fetch(`${BASE_URL}/api/assessments/test-results/${cleanTest.id}`, {
    headers: headersA,
  });
  assert(qaCleanRes.status === 200, 'GET /api/assessments/test-results/:id returns 200', qaCleanRes.status);
  const qaClean = await qaCleanRes.json();
  assert(qaClean.qualityStatus === 'GOOD', `Clean feed quality status is GOOD (got ${qaClean.qualityStatus})`);
  assert(qaClean.triggeredRulesCount === 0, 'Clean feed triggered 0 rules');
  assert(Array.isArray(qaClean.parameters) && qaClean.parameters.length === 11, 'Evaluates all 11 standard parameters');

  // 7. Assess Clean Feed Risk (GET /api/assessments/test-results/:id/risk)
  const riskCleanRes = await fetch(`${BASE_URL}/api/assessments/test-results/${cleanTest.id}/risk`, {
    headers: headersA,
  });
  assert(riskCleanRes.status === 200, 'GET /api/assessments/test-results/:id/risk returns 200', riskCleanRes.status);
  const riskClean = await riskCleanRes.json();
  assert(riskClean.overallRiskLevel === 'LOW', `Clean feed risk level is LOW (got ${riskClean.overallRiskLevel})`);
  assert(riskClean.allRisks.length === 0, 'Clean feed has 0 identified risk indicators');

  // 8. Create Hazard Feed Sample & Test Result (High moisture, low protein, high aflatoxin, mould & spoilage)
  const hazardFeedRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      animalId: animal.id,
      sampleCode: `FS-HAZARD-${timestamp}`,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-27',
      source: 'Suspect Third Party',
    }),
  });
  assert(hazardFeedRes.status === 201, 'Create Hazard Feed Sample returns 201', hazardFeedRes.status);
  const hazardFeed = await hazardFeedRes.json();

  const hazardTestRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      feedSampleId: hazardFeed.id,
      testDate: '2026-09-27',
      analysisSource: 'LAB',
      moisture: 20.0,
      crudeProtein: 9.5,
      fiber: 26.0,
      aflatoxin: 55.0,
      mouldDetected: true,
      spoilageDetected: true,
      adulteration: 'Suspected foreign matter',
    }),
  });
  assert(hazardTestRes.status === 201, 'Record Hazard Test Result returns 201', hazardTestRes.status);
  const hazardTest = await hazardTestRes.json();

  // 9. Assess Hazard Feed Quality -> Status UNSAFE
  const qaHazardRes = await fetch(`${BASE_URL}/api/assessments/test-results/${hazardTest.id}`, {
    headers: headersA,
  });
  assert(qaHazardRes.status === 200, 'GET /api/assessments/test-results/:id for hazard returns 200', qaHazardRes.status);
  const qaHazard = await qaHazardRes.json();
  assert(qaHazard.qualityStatus === 'UNSAFE', `Hazard feed quality status is UNSAFE (got ${qaHazard.qualityStatus})`);
  assert(qaHazard.triggeredRulesCount >= 3, `Hazard feed triggered multiple rules (count: ${qaHazard.triggeredRulesCount})`);

  // 10. Assess Hazard Feed Risk -> Overall HIGH, contamination & storage risks present
  const riskHazardRes = await fetch(`${BASE_URL}/api/assessments/test-results/${hazardTest.id}/risk`, {
    headers: headersA,
  });
  assert(riskHazardRes.status === 200, 'GET /api/assessments/test-results/:id/risk for hazard returns 200', riskHazardRes.status);
  const riskHazard = await riskHazardRes.json();
  assert(riskHazard.overallRiskLevel === 'HIGH', `Hazard feed risk level is HIGH (got ${riskHazard.overallRiskLevel})`);
  assert(riskHazard.contaminationRisks.length >= 1, 'Contamination risks identified');
  assert(riskHazard.storageSpoilageRisks.length >= 1, 'Storage/Spoilage risks identified');

  // 11. Trigger Evaluation & Generate Advisories (POST /api/assessments/test-results/:id)
  const evalRes = await fetch(`${BASE_URL}/api/assessments/test-results/${hazardTest.id}`, {
    method: 'POST',
    headers: headersA,
  });
  assert(evalRes.status === 200, 'POST /api/assessments/test-results/:id returns 200', evalRes.status);
  const evalSummary = await evalRes.json();
  assert(Array.isArray(evalSummary.generatedAdvisories) && evalSummary.generatedAdvisories.length >= 2, 'Generated advisories for hazard test result');
  const firstAdv = evalSummary.generatedAdvisories[0];
  assert(firstAdv.animalId === animal.id, 'Generated advisory linked to correct animal');
  const hasHighPriority = evalSummary.generatedAdvisories.some(a => a.priority === 'HIGH');
  assert(hasHighPriority, 'Generated advisories include HIGH priority advisories');

  // 12. Query Persisted Advisories (GET /api/advisories)
  const allAdvRes = await fetch(`${BASE_URL}/api/advisories`, {
    headers: headersA,
  });
  assert(allAdvRes.status === 200, 'GET /api/advisories returns 200', allAdvRes.status);
  const allAdv = await allAdvRes.json();
  assert(allAdv.length >= 1, `GET /api/advisories returns persisted advisories (count: ${allAdv.length})`);
  const persistedAdvId = allAdv[0].id;

  // 13. Query Single Advisory by ID (GET /api/advisories/:id)
  const singleAdvRes = await fetch(`${BASE_URL}/api/advisories/${persistedAdvId}`, {
    headers: headersA,
  });
  assert(singleAdvRes.status === 200, 'GET /api/advisories/:id returns 200', singleAdvRes.status);
  const singleAdv = await singleAdvRes.json();
  assert(singleAdv.id === persistedAdvId, 'Returns correct advisory ID');
  assert(singleAdv.isRead === false, 'Advisory is initially unread');

  // 14. Mark Advisory as Read (PUT /api/advisories/:id/read)
  const markReadRes = await fetch(`${BASE_URL}/api/advisories/${persistedAdvId}/read`, {
    method: 'PUT',
    headers: headersA,
  });
  assert(markReadRes.status === 200, 'PUT /api/advisories/:id/read returns 200', markReadRes.status);
  const markRead = await markReadRes.json();
  assert(markRead.isRead === true, 'Advisory isRead updated to true');

  // 15. Create Sparse Test Result (Null Parameters) -> Status INSUFFICIENT_DATA
  const sparseFeedRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      sampleCode: `FS-SPARSE-${timestamp}`,
      feedType: 'DRY_FODDER',
      sampleDate: '2026-09-27',
    }),
  });
  assert(sparseFeedRes.status === 201, 'Create Sparse Feed Sample returns 201', sparseFeedRes.status);
  const sparseFeed = await sparseFeedRes.json();

  const sparseTestRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      feedSampleId: sparseFeed.id,
      testDate: '2026-09-27',
      analysisSource: 'LAB',
    }),
  });
  assert(sparseTestRes.status === 201, 'Record Sparse Test Result returns 201', sparseTestRes.status);
  const sparseTest = await sparseTestRes.json();

  // 16. Assess Sparse Test Result -> INSUFFICIENT_DATA and NOT_AVAILABLE for null parameters
  const qaSparseRes = await fetch(`${BASE_URL}/api/assessments/test-results/${sparseTest.id}`, {
    headers: headersA,
  });
  assert(qaSparseRes.status === 200, 'GET /api/assessments/test-results/:id for sparse returns 200', qaSparseRes.status);
  const qaSparse = await qaSparseRes.json();
  assert(qaSparse.qualityStatus === 'INSUFFICIENT_DATA', `Sparse result is INSUFFICIENT_DATA (got ${qaSparse.qualityStatus})`);
  const nullParams = qaSparse.parameters.filter(p => p.status === 'NOT_AVAILABLE' && p.measuredValue === null);
  assert(nullParams.length === 11, `All 11 null parameters correctly marked NOT_AVAILABLE with measuredValue=null (got ${nullParams.length})`);

  // 17. Create Silage Sample & Deviated Test Result (pH 5.2, moisture 74.0) -> NEEDS_ATTENTION
  const silageRes = await fetch(`${BASE_URL}/api/silage-samples`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farm.id,
      sampleCode: `SS-DEVIATED-${timestamp}`,
      silageType: 'MAIZE',
      sampleDate: '2026-09-27',
    }),
  });
  assert(silageRes.status === 201, 'Create Silage Sample returns 201', silageRes.status);
  const silage = await silageRes.json();

  const silageTestRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      silageSampleId: silage.id,
      testDate: '2026-09-27',
      analysisSource: 'LAB',
      ph: 5.2,
      moisture: 74.0,
    }),
  });
  assert(silageTestRes.status === 201, 'Record Deviated Silage Test Result returns 201', silageTestRes.status);
  const silageTest = await silageTestRes.json();

  // 18. Assess Silage Result -> NEEDS_ATTENTION
  const qaSilageRes = await fetch(`${BASE_URL}/api/assessments/test-results/${silageTest.id}`, {
    headers: headersA,
  });
  assert(qaSilageRes.status === 200, 'GET /api/assessments/test-results/:id for silage returns 200', qaSilageRes.status);
  const qaSilage = await qaSilageRes.json();
  assert(qaSilage.qualityStatus === 'NEEDS_ATTENTION', `Silage quality status is NEEDS_ATTENTION (got ${qaSilage.qualityStatus})`);

  // 19. Assess Latest Silage Sample Endpoint (GET /api/assessments/silage-samples/:id)
  const latestSilageRes = await fetch(`${BASE_URL}/api/assessments/silage-samples/${silage.id}`, {
    headers: headersA,
  });
  assert(latestSilageRes.status === 200, 'GET /api/assessments/silage-samples/:id returns 200', latestSilageRes.status);
  const latestSilage = await latestSilageRes.json();
  assert(latestSilage.qualityStatus === 'NEEDS_ATTENTION', 'Latest silage assessment matches quality status');

  // 20. Assess Latest Feed Sample Endpoint (GET /api/assessments/feed-samples/:id)
  const latestFeedRes = await fetch(`${BASE_URL}/api/assessments/feed-samples/${cleanFeed.id}`, {
    headers: headersA,
  });
  assert(latestFeedRes.status === 200, 'GET /api/assessments/feed-samples/:id returns 200', latestFeedRes.status);
  const latestFeed = await latestFeedRes.json();
  assert(latestFeed.qualityStatus === 'GOOD', 'Latest feed assessment matches quality status');

  // 21. Unauthorized Assessment Request (no JWT header) -> 401
  const unauthRes = await fetch(`${BASE_URL}/api/assessments/test-results/${cleanTest.id}`);
  assert(unauthRes.status === 401, 'Unauthorized request without JWT returns 401', unauthRes.status);

  // 22. Cross-user Forbidden Request (Farmer B accessing Farmer A\'s test result) -> 403
  const crossUserRes = await fetch(`${BASE_URL}/api/assessments/test-results/${cleanTest.id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
  });
  assert(crossUserRes.status === 403, 'Cross-user assessment request returns 403 Forbidden', crossUserRes.status);

  // 23. Nonexistent Test Result -> 404
  const notFoundRes = await fetch(`${BASE_URL}/api/assessments/test-results/9999999`, {
    headers: headersA,
  });
  assert(notFoundRes.status === 404, 'Nonexistent test result returns 404', notFoundRes.status);

  console.log('\n===============================================================');
  console.log(`M6.4 LIVE BACKEND VERIFICATION COMPLETE:`);
  console.log(`Passed: ${passedSteps}/${totalSteps}`);
  console.log(`Failed: ${failedSteps}/${totalSteps}`);
  console.log('===============================================================');

  if (failedSteps > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('FATAL VERIFICATION ERROR:', err);
  process.exit(1);
});
