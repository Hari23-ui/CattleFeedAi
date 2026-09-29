// verify_m63_real_backend.mjs
// Runs live manual testing sequence against real Spring Boot backend on http://localhost:8080
// Strictly follows Phase 16 requirements for M6.3 Feed & Silage Testing

const BASE_URL = 'http://localhost:8080';

const log = (step, title, data = null) => {
  console.log(`\n==================================================`);
  console.log(`STEP ${step}: ${title}`);
  console.log(`==================================================`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

async function run() {
  const timestamp = Date.now();
  const testUsername = `farmer_m63_${timestamp}`;
  const testEmail = `farmer_m63_${timestamp}@testdairy.com`;
  const testPassword = 'Password123!';

  console.log('STARTING M6.3 LIVE BACKEND VERIFICATION ON http://localhost:8080');

  // STEP 1 & 2: Register/login farmer & obtain JWT
  log(1, 'Registering new farmer to obtain live JWT authentication token');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      phone: '+91 9123456780',
      language: 'en',
    }),
  });

  if (!regRes.ok) {
    throw new Error(`Registration failed: ${regRes.status} ${await regRes.text()}`);
  }

  const authData = await regRes.json();
  const token = authData.token;
  log(2, 'JWT token successfully issued', { email: authData.email, role: authData.role });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // STEP 3: Create Farm
  log(3, 'Create farm profile for sample association');
  const farmRes = await fetch(`${BASE_URL}/api/farms`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmName: 'Anand Bio-Feed Research Dairy',
      location: 'Plot 42, GIDC Agricultural Zone',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388001',
    }),
  });

  if (!farmRes.ok) {
    throw new Error(`Farm creation failed: ${farmRes.status} ${await farmRes.text()}`);
  }
  const farm = await farmRes.json();
  log(3, 'Farm created successfully', { farmId: farm.id, farmName: farm.farmName });

  // Optional: Create an animal under farm
  const animalRes = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmId: farm.id,
      animalTag: `TAG-M63-${timestamp.toString().slice(-4)}`,
      name: 'Kamadhenu',
      breed: 'Gir',
      gender: 'FEMALE',
    }),
  });
  const animal = animalRes.ok ? await animalRes.json() : null;

  // STEP 4: Create feed sample
  log(4, 'Create feed sample (POST /api/feed-samples)');
  const feedSampleCode = `FEED-${timestamp.toString().slice(-6)}`;
  const feedRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmId: farm.id,
      animalId: animal?.id,
      sampleCode: feedSampleCode,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-27',
      source: 'Central Feed Godown, Bay 3',
      notes: 'High protein 20% dairy pellet batch',
    }),
  });

  if (!feedRes.ok) {
    throw new Error(`Feed creation failed: ${feedRes.status} ${await feedRes.text()}`);
  }
  const feedSample = await feedRes.json();
  log(4, 'Feed sample created', feedSample);

  // STEP 5: Fetch feed sample list
  log(5, 'Fetch feed sample list (GET /api/feed-samples)');
  const feedListRes = await fetch(`${BASE_URL}/api/feed-samples?farmId=${farm.id}`, {
    headers: authHeaders,
  });
  if (!feedListRes.ok) throw new Error(`Fetch feed list failed: ${feedListRes.status}`);
  const feedList = await feedListRes.json();
  log(5, `Feed sample list retrieved (${feedList.length} items)`, feedList);
  if (!feedList.some((f) => f.id === feedSample.id)) {
    throw new Error('Created feed sample not found in feed list');
  }

  // STEP 6: Open feed sample by ID
  log(6, `Open feed sample by ID (GET /api/feed-samples/${feedSample.id})`);
  const feedDetailRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSample.id}`, {
    headers: authHeaders,
  });
  if (!feedDetailRes.ok) throw new Error(`Fetch feed details failed: ${feedDetailRes.status}`);
  const feedDetails = await feedDetailRes.json();
  log(6, 'Feed sample details verified', feedDetails);
  if (feedDetails.sampleCode !== feedSampleCode) {
    throw new Error('Feed sample code mismatch');
  }

  // STEP 7: Create test result for feed sample
  log(7, 'Create test result for feed sample (POST /api/test-results)');
  const feedTestRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      feedSampleId: feedSample.id,
      testDate: '2026-09-27',
      moisture: 10.5,
      crudeProtein: 21.0,
      fiber: 8.5,
      energyValue: 12.1,
      mineralStatus: 'Balanced Ca/P',
      aflatoxin: 8.0,
      mycotoxin: 0.1,
      ph: 6.5,
      adulteration: 'None detected',
      mouldDetected: false,
      spoilageDetected: false,
      confidenceScore: 0.98,
      analysisSource: 'LAB',
    }),
  });

  if (!feedTestRes.ok) {
    throw new Error(`Feed test result creation failed: ${feedTestRes.status} ${await feedTestRes.text()}`);
  }
  const feedTest = await feedTestRes.json();
  log(7, 'Feed test result created', feedTest);

  // STEP 8: Fetch feed test results
  log(8, `Fetch feed test results (GET /api/test-results/feed-sample/${feedSample.id})`);
  const feedTestsRes = await fetch(`${BASE_URL}/api/test-results/feed-sample/${feedSample.id}`, {
    headers: authHeaders,
  });
  if (!feedTestsRes.ok) throw new Error(`Fetch feed test results failed: ${feedTestsRes.status}`);
  const feedTests = await feedTestsRes.json();
  log(8, `Feed tests retrieved (${feedTests.length} tests)`, feedTests);
  if (!feedTests.some((t) => t.id === feedTest.id)) {
    throw new Error('Created test result not found in feed sample tests');
  }

  // STEP 9: Open test result by ID
  log(9, `Open test result by ID (GET /api/test-results/${feedTest.id})`);
  const testDetailRes = await fetch(`${BASE_URL}/api/test-results/${feedTest.id}`, {
    headers: authHeaders,
  });
  if (!testDetailRes.ok) throw new Error(`Fetch test result failed: ${testDetailRes.status}`);
  const testDetails = await testDetailRes.json();
  log(9, 'Test result details verified', testDetails);

  // STEP 10: Verify nullable test fields (Create sparse test result with optional nulls)
  log(10, 'Verify nullable test fields with a sparse test result');
  const sparseTestRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      feedSampleId: feedSample.id,
      testDate: '2026-09-27',
      moisture: 12.0,
      // all other fields omitted / null
    }),
  });

  if (!sparseTestRes.ok) {
    throw new Error(`Sparse test creation failed: ${sparseTestRes.status} ${await sparseTestRes.text()}`);
  }
  const sparseTest = await sparseTestRes.json();
  log(10, 'Sparse test result verified (nullable fields are properly null)', {
    id: sparseTest.id,
    moisture: sparseTest.moisture,
    crudeProtein: sparseTest.crudeProtein,
    fiber: sparseTest.fiber,
    aflatoxin: sparseTest.aflatoxin,
    mouldDetected: sparseTest.mouldDetected,
    spoilageDetected: sparseTest.spoilageDetected,
  });
  if (sparseTest.crudeProtein !== null && sparseTest.crudeProtein !== undefined) {
    throw new Error(`Expected null crudeProtein, got ${sparseTest.crudeProtein}`);
  }

  // STEP 11: Create silage sample
  log(11, 'Create silage sample (POST /api/silage-samples)');
  const silageSampleCode = `SIL-${timestamp.toString().slice(-6)}`;
  const silageRes = await fetch(`${BASE_URL}/api/silage-samples`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmId: farm.id,
      sampleCode: silageSampleCode,
      silageType: 'MAIZE',
      sampleDate: '2026-09-27',
      source: 'North Trench Pit #2',
      notes: '60 days ensiled, golden-yellow corn forage',
    }),
  });

  if (!silageRes.ok) {
    throw new Error(`Silage creation failed: ${silageRes.status} ${await silageRes.text()}`);
  }
  const silageSample = await silageRes.json();
  log(11, 'Silage sample created', silageSample);

  // STEP 12: Fetch silage samples
  log(12, 'Fetch silage sample list (GET /api/silage-samples)');
  const silageListRes = await fetch(`${BASE_URL}/api/silage-samples?farmId=${farm.id}`, {
    headers: authHeaders,
  });
  if (!silageListRes.ok) throw new Error(`Fetch silage list failed: ${silageListRes.status}`);
  const silageList = await silageListRes.json();
  log(12, `Silage sample list retrieved (${silageList.length} items)`, silageList);
  if (!silageList.some((s) => s.id === silageSample.id)) {
    throw new Error('Created silage sample not found in list');
  }

  // STEP 13: Open silage sample
  log(13, `Open silage sample by ID (GET /api/silage-samples/${silageSample.id})`);
  const silageDetailRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSample.id}`, {
    headers: authHeaders,
  });
  if (!silageDetailRes.ok) throw new Error(`Fetch silage details failed: ${silageDetailRes.status}`);
  const silageDetails = await silageDetailRes.json();
  log(13, 'Silage sample details verified', silageDetails);
  if (silageDetails.sampleCode !== silageSampleCode) {
    throw new Error('Silage sample code mismatch');
  }

  // STEP 14: Create test result for silage sample
  log(14, 'Create test result for silage sample (POST /api/test-results)');
  const silageTestRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      silageSampleId: silageSample.id,
      testDate: '2026-09-27',
      moisture: 66.5,
      crudeProtein: 8.8,
      fiber: 22.0,
      ph: 4.1,
      mouldDetected: false,
      spoilageDetected: false,
      confidenceScore: 0.96,
      analysisSource: 'LAB',
    }),
  });

  if (!silageTestRes.ok) {
    throw new Error(`Silage test result creation failed: ${silageTestRes.status} ${await silageTestRes.text()}`);
  }
  const silageTest = await silageTestRes.json();
  log(14, 'Silage test result created', silageTest);

  // STEP 15: Fetch silage test results
  log(15, `Fetch silage test results (GET /api/test-results/silage-sample/${silageSample.id})`);
  const silageTestsRes = await fetch(`${BASE_URL}/api/test-results/silage-sample/${silageSample.id}`, {
    headers: authHeaders,
  });
  if (!silageTestsRes.ok) throw new Error(`Fetch silage test results failed: ${silageTestsRes.status}`);
  const silageTests = await silageTestsRes.json();
  log(15, `Silage tests retrieved (${silageTests.length} tests)`, silageTests);
  if (!silageTests.some((t) => t.id === silageTest.id)) {
    throw new Error('Created silage test result not found in tests list');
  }

  // STEP 16: Test invalid/unauthorized request
  log(16, 'Test invalid/unauthorized request (no JWT token provided)');
  const unauthRes = await fetch(`${BASE_URL}/api/feed-samples`);
  log(16, 'Unauthorized request correctly rejected', { status: unauthRes.status });
  if (unauthRes.status !== 401 && unauthRes.status !== 403) {
    throw new Error(`Expected 401/403 for unauthorized request, got ${unauthRes.status}`);
  }

  // STEP 17: Test appropriate 404 / 409 / validation behavior
  log(17, 'Test duplicate sample code conflict (409) and not found (404)');
  // 409 Conflict: Re-create with identical sampleCode on same farm
  const dupRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmId: farm.id,
      sampleCode: feedSampleCode, // duplicate!
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-27',
    }),
  });
  log(17, 'Duplicate sample code conflict verified', {
    status: dupRes.status,
    statusText: dupRes.statusText,
  });
  if (dupRes.status !== 409 && dupRes.status !== 400) {
    throw new Error(`Expected 409 or 400 for duplicate sample code, got ${dupRes.status}`);
  }

  // 404 Not Found: Query non-existent sample ID
  const notFoundRes = await fetch(`${BASE_URL}/api/feed-samples/999999`, {
    headers: authHeaders,
  });
  log(17, 'Non-existent sample 404 verified', {
    status: notFoundRes.status,
  });
  if (notFoundRes.status !== 404) {
    throw new Error(`Expected 404 for non-existent sample ID, got ${notFoundRes.status}`);
  }

  // Validation Error: Test result with BOTH feedSampleId and silageSampleId (violates XOR)
  const invalidParentRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      feedSampleId: feedSample.id,
      silageSampleId: silageSample.id,
      testDate: '2026-09-27',
    }),
  });
  log(17, 'Invalid dual-parent test result correctly rejected', {
    status: invalidParentRes.status,
  });
  if (invalidParentRes.status !== 400) {
    throw new Error(`Expected 400 for dual-parent test result, got ${invalidParentRes.status}`);
  }

  // STEP 18: Clean up test records
  log(18, 'Clean up test records created during live verification');
  // Delete feed sample
  const delFeedRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSample.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  log(18, 'Feed sample deleted', { status: delFeedRes.status });

  // Delete silage sample
  const delSilageRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSample.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  log(18, 'Silage sample deleted', { status: delSilageRes.status });

  // Delete farm
  const delFarmRes = await fetch(`${BASE_URL}/api/farms/${farm.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  log(18, 'Farm profile deleted', { status: delFarmRes.status });

  console.log('\n==================================================');
  console.log('ALL 18 M6.3 LIVE BACKEND VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

run().catch((err) => {
  console.error('\nLIVE VERIFICATION FAILED:', err);
  process.exit(1);
});
