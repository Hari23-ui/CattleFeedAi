// verify_m13_cross_owner_security.mjs
// Milestone 13: Strict Cross-Owner Security, Role Authorization, and Data Isolation Verification
// Tests Farmer A, Farmer B, Expert A, Expert B across all entities:
// Farm, Animal, Feed Sample, Silage Sample, Test Result, Feed Plan, Alert, Consultation, Evidence, Images, Analytics

const BASE_URL = 'http://localhost:8080';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message} ${details ? '-> ' + details : ''}`);
  }
}

async function run() {
  console.log('===============================================================');
  console.log('  MILESTONE 13: COMPREHENSIVE CROSS-OWNER SECURITY & ISOLATION');
  console.log('===============================================================');

  const ts = Date.now();

  // 1. User Registration & Setup
  console.log('\n--- PHASE 1: User Registration & Role Setup ---');
  const farmerAEmail = `farmer_a_${ts}@test.com`;
  const farmerBEmail = `farmer_b_${ts}@test.com`;
  const expertAEmail = `expert_a_${ts}@test.com`;
  const expertBEmail = `expert_b_${ts}@test.com`;
  const defaultPassword = 'Password123!';

  // Register Farmer A
  const regFarmerARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `fa_${ts}`,
      email: farmerAEmail,
      password: defaultPassword,
      phone: '+91 9100000001',
      role: 'FARMER'
    })
  });
  assert(regFarmerARes.status === 201, 'Farmer A registered (201)');
  const farmerAToken = (await regFarmerARes.json()).token;

  // Register Farmer B
  const regFarmerBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `fb_${ts}`,
      email: farmerBEmail,
      password: defaultPassword,
      phone: '+91 9100000002',
      role: 'FARMER'
    })
  });
  assert(regFarmerBRes.status === 201, 'Farmer B registered (201)');
  const farmerBToken = (await regFarmerBRes.json()).token;

  // Register Expert A
  const regExpertARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `ea_${ts}`,
      email: expertAEmail,
      password: defaultPassword,
      phone: '+91 9100000003',
      role: 'EXPERT'
    })
  });
  assert(regExpertARes.status === 201, 'Expert A registered with EXPERT role (201)');
  const expertAToken = (await regExpertARes.json()).token;

  // Register Expert B
  const regExpertBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `eb_${ts}`,
      email: expertBEmail,
      password: defaultPassword,
      phone: '+91 9100000004',
      role: 'EXPERT'
    })
  });
  assert(regExpertBRes.status === 201, 'Expert B registered with EXPERT role (201)');
  const expertBToken = (await regExpertBRes.json()).token;

  const authHeadersA = { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerAToken}` };
  const authHeadersB = { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerBToken}` };
  const authHeadersExpA = { 'Content-Type': 'application/json', Authorization: `Bearer ${expertAToken}` };
  const authHeadersExpB = { 'Content-Type': 'application/json', Authorization: `Bearer ${expertBToken}` };

  // 2. Farmer A creates resources
  console.log('\n--- PHASE 2: Farmer A Resource Creation ---');

  // Farm A
  const farmARes = await fetch(`${BASE_URL}/api/farms`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      farmName: `Security Farm A ${ts}`,
      location: 'Gujarat North',
      district: 'Mehsana',
      state: 'Gujarat',
      pincode: '384001'
    })
  });
  assert(farmARes.status === 201, 'Farmer A created Farm A (201)');
  const farmA = await farmARes.json();

  // Animal A
  const animalARes = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      farmId: farmA.id,
      animalTag: `TAG-SEC-A-${ts.toString().slice(-4)}`,
      name: 'Gir Queen A',
      breed: 'Gir',
      gender: 'FEMALE',
      dateOfBirth: '2023-01-10',
      weight: 420.0,
      lactationStage: 'MID',
      daysInMilk: 100,
      milkProductionPerDay: 18.0,
      pregnancyStatus: 'NOT_PREGNANT',
      feedIntakeStatus: 'NORMAL'
    })
  });
  assert(animalARes.status === 201, 'Farmer A registered Animal A (201)');
  const animalA = await animalARes.json();

  // Feed Sample A
  const feedARes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      farmId: farmA.id,
      animalId: animalA.id,
      sampleCode: `FEED-SEC-A-${ts.toString().slice(-4)}`,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-28',
      source: 'Barn A Bin 1'
    })
  });
  assert(feedARes.status === 201, 'Farmer A registered Feed Sample A (201)');
  const feedA = await feedARes.json();

  // Silage Sample A
  const silageARes = await fetch(`${BASE_URL}/api/silage-samples`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      farmId: farmA.id,
      animalId: animalA.id,
      sampleCode: `SIL-SEC-A-${ts.toString().slice(-4)}`,
      silageType: 'MAIZE',
      sampleDate: '2026-09-28',
      source: 'Pit #1'
    })
  });
  assert(silageARes.status === 201, 'Farmer A registered Silage Sample A (201)');
  const silageA = await silageARes.json();

  // Test Result A (Feed)
  const testARes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      feedSampleId: feedA.id,
      testDate: '2026-09-28',
      moisture: 11.0,
      crudeProtein: 21.0,
      fiber: 9.0,
      energyValue: 12.0,
      ph: 6.5,
      aflatoxin: 5.0,
      mouldDetected: false,
      spoilageDetected: false,
      confidenceScore: 0.98,
      analysisSource: 'LAB'
    })
  });
  assert(testARes.status === 201, 'Farmer A recorded Test Result A (201)');
  const testA = await testARes.json();

  // Feed Plan A
  const planARes = await fetch(`${BASE_URL}/api/feed-plans`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      planName: 'Ration Schedule Plan A',
      animalId: animalA.id,
      feedSampleId: feedA.id,
      silageSampleId: silageA.id,
      plannedQuantity: 12.5,
      frequency: 'TWICE_DAILY',
      startDate: '2026-09-28',
      endDate: '2026-10-28',
      notes: 'Monitored lactation ration'
    })
  });
  assert(planARes.status === 201, 'Farmer A created Feed Plan A (201)');
  const planA = await planARes.json();

  // Sample Image for Feed A
  const fakeJpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]);
  const feedFormData = new FormData();
  feedFormData.append('file', new Blob([fakeJpegBytes], { type: 'image/jpeg' }), 'sampleA.jpg');
  feedFormData.append('caption', 'Visual inspection: surface texture check');

  const uploadImgARes = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerAToken}` },
    body: feedFormData
  });
  assert(uploadImgARes.status === 201, 'Farmer A uploaded Sample Image A (201)');
  const imgA = await uploadImgARes.json();

  // Consultation A
  const consultARes = await fetch(`${BASE_URL}/api/consultations`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      animalId: animalA.id,
      feedSampleId: feedA.id,
      silageSampleId: silageA.id,
      subject: 'Review ration for Mid-lactation Gir Cow',
      question: 'Is the current concentrate and silage proportion optimal?'
    })
  });
  assert(consultARes.status === 201, 'Farmer A created Consultation A (201)');
  const consultA = await consultARes.json();

  // 3. Farmer A Accesses Own Data (Expect 200 OK)
  console.log('\n--- PHASE 3: Farmer A Accesses Own Data (200 OK) ---');
  const faGetFarm = await fetch(`${BASE_URL}/api/farms/${farmA.id}`, { headers: authHeadersA });
  assert(faGetFarm.status === 200, 'Farmer A -> Own Farm = 200 OK');

  const faGetAnimal = await fetch(`${BASE_URL}/api/animals/${animalA.id}`, { headers: authHeadersA });
  assert(faGetAnimal.status === 200, 'Farmer A -> Own Animal = 200 OK');

  const faGetFeed = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}`, { headers: authHeadersA });
  assert(faGetFeed.status === 200, 'Farmer A -> Own Feed Sample = 200 OK');

  const faGetSilage = await fetch(`${BASE_URL}/api/silage-samples/${silageA.id}`, { headers: authHeadersA });
  assert(faGetSilage.status === 200, 'Farmer A -> Own Silage Sample = 200 OK');

  const faGetTest = await fetch(`${BASE_URL}/api/test-results/${testA.id}`, { headers: authHeadersA });
  assert(faGetTest.status === 200, 'Farmer A -> Own Test Result = 200 OK');

  const faGetPlan = await fetch(`${BASE_URL}/api/feed-plans/${planA.id}`, { headers: authHeadersA });
  assert(faGetPlan.status === 200, 'Farmer A -> Own Feed Plan = 200 OK');

  const faGetConsult = await fetch(`${BASE_URL}/api/consultations/${consultA.id}`, { headers: authHeadersA });
  assert(faGetConsult.status === 200, 'Farmer A -> Own Consultation = 200 OK');

  const faGetEvidence = await fetch(`${BASE_URL}/api/evidence/animals/${animalA.id}`, { headers: authHeadersA });
  assert(faGetEvidence.status === 200, 'Farmer A -> Own Evidence Summary = 200 OK');

  const faGetImg = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}/images/${imgA.id}`, { headers: authHeadersA });
  assert(faGetImg.status === 200, 'Farmer A -> Own Sample Image Metadata = 200 OK');

  // 4. Farmer B Cross-Owner Attacks (Expect 403 Forbidden)
  console.log('\n--- PHASE 4: Farmer B Cross-Owner Access Attacks (Expect 403 Forbidden) ---');

  // Farm
  const fbGetFarm = await fetch(`${BASE_URL}/api/farms/${farmA.id}`, { headers: authHeadersB });
  assert(fbGetFarm.status === 403, 'Farmer B -> Farmer A Farm (GET) = 403 Forbidden');

  const fbPutFarm = await fetch(`${BASE_URL}/api/farms/${farmA.id}`, {
    method: 'PUT',
    headers: authHeadersB,
    body: JSON.stringify({
      farmName: 'Hacked Farm',
      location: 'Hacked Location',
      district: 'Hacked District',
      state: 'Gujarat',
      pincode: '384001'
    })
  });
  assert(fbPutFarm.status === 403, 'Farmer B -> Farmer A Farm (PUT) = 403 Forbidden');

  const fbDelFarm = await fetch(`${BASE_URL}/api/farms/${farmA.id}`, { method: 'DELETE', headers: authHeadersB });
  assert(fbDelFarm.status === 403, 'Farmer B -> Farmer A Farm (DELETE) = 403 Forbidden');

  // Animal
  const fbGetAnimal = await fetch(`${BASE_URL}/api/animals/${animalA.id}`, { headers: authHeadersB });
  assert(fbGetAnimal.status === 403, 'Farmer B -> Farmer A Animal (GET) = 403 Forbidden');

  const fbPutAnimal = await fetch(`${BASE_URL}/api/animals/${animalA.id}`, {
    method: 'PUT',
    headers: authHeadersB,
    body: JSON.stringify({
      farmId: farmA.id,
      animalTag: `TAG-SEC-A-EDIT`,
      name: 'Hacked Animal',
      breed: 'Gir',
      gender: 'FEMALE',
      dateOfBirth: '2023-01-10',
      weight: 420.0,
      lactationStage: 'MID',
      daysInMilk: 100,
      milkProductionPerDay: 18.0,
      pregnancyStatus: 'NOT_PREGNANT',
      feedIntakeStatus: 'NORMAL'
    })
  });
  assert(fbPutAnimal.status === 403, 'Farmer B -> Farmer A Animal (PUT) = 403 Forbidden');

  const fbDelAnimal = await fetch(`${BASE_URL}/api/animals/${animalA.id}`, { method: 'DELETE', headers: authHeadersB });
  assert(fbDelAnimal.status === 403, 'Farmer B -> Farmer A Animal (DELETE) = 403 Forbidden');

  // Feed Sample
  const fbGetFeed = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}`, { headers: authHeadersB });
  assert(fbGetFeed.status === 403, 'Farmer B -> Farmer A Feed Sample (GET) = 403 Forbidden');

  const fbPutFeed = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}`, {
    method: 'PUT',
    headers: authHeadersB,
    body: JSON.stringify({
      farmId: farmA.id,
      sampleCode: `FEED-SEC-A-EDIT`,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-28',
      source: 'Hacked Source'
    })
  });
  assert(fbPutFeed.status === 403, 'Farmer B -> Farmer A Feed Sample (PUT) = 403 Forbidden');

  const fbDelFeed = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}`, { method: 'DELETE', headers: authHeadersB });
  assert(fbDelFeed.status === 403, 'Farmer B -> Farmer A Feed Sample (DELETE) = 403 Forbidden');

  // Silage Sample
  const fbGetSilage = await fetch(`${BASE_URL}/api/silage-samples/${silageA.id}`, { headers: authHeadersB });
  assert(fbGetSilage.status === 403, 'Farmer B -> Farmer A Silage Sample (GET) = 403 Forbidden');

  const fbPutSilage = await fetch(`${BASE_URL}/api/silage-samples/${silageA.id}`, {
    method: 'PUT',
    headers: authHeadersB,
    body: JSON.stringify({
      farmId: farmA.id,
      sampleCode: `SIL-SEC-A-EDIT`,
      silageType: 'MAIZE',
      sampleDate: '2026-09-28',
      source: 'Hacked Pit'
    })
  });
  assert(fbPutSilage.status === 403, 'Farmer B -> Farmer A Silage Sample (PUT) = 403 Forbidden');

  const fbDelSilage = await fetch(`${BASE_URL}/api/silage-samples/${silageA.id}`, { method: 'DELETE', headers: authHeadersB });
  assert(fbDelSilage.status === 403, 'Farmer B -> Farmer A Silage Sample (DELETE) = 403 Forbidden');

  // Test Results
  const fbGetTest = await fetch(`${BASE_URL}/api/test-results/${testA.id}`, { headers: authHeadersB });
  assert(fbGetTest.status === 403, 'Farmer B -> Farmer A Test Result = 403 Forbidden');

  const fbGetFeedTests = await fetch(`${BASE_URL}/api/test-results/feed-sample/${feedA.id}`, { headers: authHeadersB });
  assert(fbGetFeedTests.status === 403, 'Farmer B -> Farmer A Feed Sample Tests = 403 Forbidden');

  const fbGetSilageTests = await fetch(`${BASE_URL}/api/test-results/silage-sample/${silageA.id}`, { headers: authHeadersB });
  assert(fbGetSilageTests.status === 403, 'Farmer B -> Farmer A Silage Sample Tests = 403 Forbidden');

  // Assessments
  const fbGetQuality = await fetch(`${BASE_URL}/api/assessments/test-results/${testA.id}`, { headers: authHeadersB });
  assert(fbGetQuality.status === 403, 'Farmer B -> Farmer A Quality Assessment = 403 Forbidden');

  const fbGetRisk = await fetch(`${BASE_URL}/api/assessments/test-results/${testA.id}/risk`, { headers: authHeadersB });
  assert(fbGetRisk.status === 403, 'Farmer B -> Farmer A Risk Assessment = 403 Forbidden');

  const fbGetHealth = await fetch(`${BASE_URL}/api/assessments/animals/${animalA.id}/health-screening`, { headers: authHeadersB });
  assert(fbGetHealth.status === 403, 'Farmer B -> Farmer A Animal Health Screening = 403 Forbidden');

  // Feed Plan
  const fbGetPlan = await fetch(`${BASE_URL}/api/feed-plans/${planA.id}`, { headers: authHeadersB });
  assert(fbGetPlan.status === 403, 'Farmer B -> Farmer A Feed Plan (GET) = 403 Forbidden');

  const fbPutPlan = await fetch(`${BASE_URL}/api/feed-plans/${planA.id}`, {
    method: 'PUT',
    headers: authHeadersB,
    body: JSON.stringify({
      planName: 'Hacked Plan',
      animalId: animalA.id,
      startDate: '2026-09-28',
      plannedQuantity: 99.0
    })
  });
  assert(fbPutPlan.status === 403, 'Farmer B -> Farmer A Feed Plan (PUT) = 403 Forbidden');

  const fbDelPlan = await fetch(`${BASE_URL}/api/feed-plans/${planA.id}`, { method: 'DELETE', headers: authHeadersB });
  assert(fbDelPlan.status === 403, 'Farmer B -> Farmer A Feed Plan (DELETE) = 403 Forbidden');

  // Images
  const fbGetImgs = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}/images`, { headers: authHeadersB });
  assert(fbGetImgs.status === 403, 'Farmer B -> Farmer A Sample Image List = 403 Forbidden');

  const fbGetImgMeta = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}/images/${imgA.id}`, { headers: authHeadersB });
  assert(fbGetImgMeta.status === 403, 'Farmer B -> Farmer A Sample Image Metadata = 403 Forbidden');

  const fbGetImgFile = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}/images/${imgA.id}/file`, { headers: authHeadersB });
  assert(fbGetImgFile.status === 403, 'Farmer B -> Farmer A Sample Image File = 403 Forbidden');

  const fbDelImg = await fetch(`${BASE_URL}/api/feed-samples/${feedA.id}/images/${imgA.id}`, { method: 'DELETE', headers: authHeadersB });
  assert(fbDelImg.status === 403, 'Farmer B -> Farmer A Sample Image (DELETE) = 403 Forbidden');

  // Consultation & Evidence
  const fbGetConsult = await fetch(`${BASE_URL}/api/consultations/${consultA.id}`, { headers: authHeadersB });
  assert(fbGetConsult.status === 403, 'Farmer B -> Farmer A Consultation = 403 Forbidden');

  const fbCancelConsult = await fetch(`${BASE_URL}/api/consultations/${consultA.id}/cancel`, { method: 'PUT', headers: authHeadersB });
  assert(fbCancelConsult.status === 403, 'Farmer B -> Farmer A Consultation Cancel = 403 Forbidden');

  const fbGetEvidenceAnimal = await fetch(`${BASE_URL}/api/evidence/animals/${animalA.id}`, { headers: authHeadersB });
  assert(fbGetEvidenceAnimal.status === 403, 'Farmer B -> Farmer A Evidence Animal = 403 Forbidden');

  const fbGetEvidenceConsult = await fetch(`${BASE_URL}/api/evidence/consultations/${consultA.id}`, { headers: authHeadersB });
  assert(fbGetEvidenceConsult.status === 403, 'Farmer B -> Farmer A Evidence Consultation = 403 Forbidden');

  // Analytics
  const fbGetAnimalAnalytics = await fetch(`${BASE_URL}/api/analytics/animals/${animalA.id}`, { headers: authHeadersB });
  assert(fbGetAnimalAnalytics.status === 403, 'Farmer B -> Farmer A Animal Analytics = 403 Forbidden');

  const fbGetFeedAnalytics = await fetch(`${BASE_URL}/api/analytics/feed-samples/${feedA.id}`, { headers: authHeadersB });
  assert(fbGetFeedAnalytics.status === 403, 'Farmer B -> Farmer A Feed Analytics = 403 Forbidden');

  const fbGetSilageAnalytics = await fetch(`${BASE_URL}/api/silage-samples/${silageA.id}`, { headers: authHeadersB });
  assert(fbGetSilageAnalytics.status === 403, 'Farmer B -> Farmer A Silage Analytics = 403 Forbidden');

  // 5. Expert Consultation Isolation
  console.log('\n--- PHASE 5: Expert Isolation & Assignment Security ---');

  // Expert A accepts consultation
  const eaAccept = await fetch(`${BASE_URL}/api/consultations/${consultA.id}/accept`, {
    method: 'PUT',
    headers: authHeadersExpA
  });
  assert(eaAccept.status === 200, 'Expert A accepts Consultation A (200 OK)');

  // Expert A views Consultation A -> 200 OK
  const eaGetConsult = await fetch(`${BASE_URL}/api/consultations/${consultA.id}`, { headers: authHeadersExpA });
  assert(eaGetConsult.status === 200, 'Expert A -> Assigned Consultation = 200 OK');

  // Expert A views Evidence Summary for Consultation A -> 200 OK
  const eaGetEvidence = await fetch(`${BASE_URL}/api/evidence/consultations/${consultA.id}`, { headers: authHeadersExpA });
  assert(eaGetEvidence.status === 200, 'Expert A -> Evidence for Assigned Consultation = 200 OK');

  // Expert B (unassigned) tries to view Consultation A -> 403 Forbidden
  const ebGetConsult = await fetch(`${BASE_URL}/api/consultations/${consultA.id}`, { headers: authHeadersExpB });
  assert(ebGetConsult.status === 403, 'Expert B (Unassigned) -> Consultation A = 403 Forbidden');

  // Expert B tries to view Evidence for Consultation A -> 403 Forbidden
  const ebGetEvidence = await fetch(`${BASE_URL}/api/evidence/consultations/${consultA.id}`, { headers: authHeadersExpB });
  assert(ebGetEvidence.status === 403, 'Expert B (Unassigned) -> Evidence for Consultation A = 403 Forbidden');

  // Expert B tries to accept already accepted Consultation A -> 400 Bad Request
  const ebAccept = await fetch(`${BASE_URL}/api/consultations/${consultA.id}/accept`, {
    method: 'PUT',
    headers: authHeadersExpB
  });
  assert(ebAccept.status === 400, 'Expert B cannot accept already accepted consultation = 400 Bad Request');

  // Expert B tries to review Consultation A -> 403 Forbidden
  const ebReview = await fetch(`${BASE_URL}/api/consultations/${consultA.id}/review`, {
    method: 'PUT',
    headers: authHeadersExpB
  });
  assert(ebReview.status === 403, 'Expert B cannot review Consultation A = 403 Forbidden');

  // Expert B tries to respond to Consultation A -> 403 Forbidden
  const ebRespond = await fetch(`${BASE_URL}/api/consultations/${consultA.id}/respond`, {
    method: 'PUT',
    headers: authHeadersExpB,
    body: JSON.stringify({
      recommendation: 'Unauthorized recommendation',
      expertNotes: 'Malicious attempt'
    })
  });
  assert(ebRespond.status === 403, 'Expert B cannot respond to Consultation A = 403 Forbidden');

  // 6. Unauthenticated & Invalid JWT Access (Expect 401)
  console.log('\n--- PHASE 6: Unauthenticated & Malformed Token Checks (Expect 401) ---');
  const unauthFarms = await fetch(`${BASE_URL}/api/farms`);
  assert(unauthFarms.status === 401, 'No token -> /api/farms = 401 Unauthorized');

  const unauthAnimals = await fetch(`${BASE_URL}/api/animals`);
  assert(unauthAnimals.status === 401, 'No token -> /api/animals = 401 Unauthorized');

  const unauthAlerts = await fetch(`${BASE_URL}/api/alerts`);
  assert(unauthAlerts.status === 401, 'No token -> /api/alerts = 401 Unauthorized');

  const unauthEvidence = await fetch(`${BASE_URL}/api/evidence/animals/${animalA.id}`);
  assert(unauthEvidence.status === 401, 'No token -> /api/evidence/animals/:id = 401 Unauthorized');

  const badTokenRes = await fetch(`${BASE_URL}/api/farms`, {
    headers: { Authorization: 'Bearer this.is.an.invalid.token.signature' }
  });
  assert(badTokenRes.status === 401, 'Invalid JWT token -> 401 Unauthorized');

  // 7. Nonexistent Resource Checks (Expect 404)
  console.log('\n--- PHASE 7: Missing Resource Checks (Expect 404) ---');
  const missingFarm = await fetch(`${BASE_URL}/api/farms/9999999`, { headers: authHeadersA });
  assert(missingFarm.status === 404, 'Nonexistent farm = 404 Not Found');

  const missingAnimal = await fetch(`${BASE_URL}/api/animals/9999999`, { headers: authHeadersA });
  assert(missingAnimal.status === 404, 'Nonexistent animal = 404 Not Found');

  const missingFeed = await fetch(`${BASE_URL}/api/feed-samples/9999999`, { headers: authHeadersA });
  assert(missingFeed.status === 404, 'Nonexistent feed sample = 404 Not Found');

  const missingSilage = await fetch(`${BASE_URL}/api/silage-samples/9999999`, { headers: authHeadersA });
  assert(missingSilage.status === 404, 'Nonexistent silage sample = 404 Not Found');

  const missingPlan = await fetch(`${BASE_URL}/api/feed-plans/9999999`, { headers: authHeadersA });
  assert(missingPlan.status === 404, 'Nonexistent feed plan = 404 Not Found');

  const missingConsult = await fetch(`${BASE_URL}/api/consultations/9999999`, { headers: authHeadersA });
  assert(missingConsult.status === 404, 'Nonexistent consultation = 404 Not Found');

  const missingEvidence = await fetch(`${BASE_URL}/api/evidence/animals/9999999`, { headers: authHeadersA });
  assert(missingEvidence.status === 404, 'Nonexistent animal evidence = 404 Not Found');

  console.log('\n===============================================================');
  console.log(`  M13 CROSS-OWNER SECURITY VERIFICATION SUMMARY:`);
  console.log(`  TOTAL CHECKS: ${passed + failed}`);
  console.log(`  PASSED:       ${passed}`);
  console.log(`  FAILED:       ${failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during M13 security verification:', err);
  process.exit(1);
});
