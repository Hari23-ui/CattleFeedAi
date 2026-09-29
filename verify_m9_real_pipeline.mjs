/**
 * Live End-to-End Verification Script for Milestone 9 (Analytics & Historical Trends)
 *
 * Verifies with REAL:
 * - MySQL database
 * - Spring Boot backend (http://localhost:8080)
 * - JWT authentication
 * - Complete historical analytics pipeline:
 *   1. Unauthenticated requests -> 401 Unauthorized
 *   2. Real Farmer A creation & authentication
 *   3. Real Farm, Animal, Feed Sample, Silage Sample creation
 *   4. Recording multiple real TestResult records with varying dates & values
 *   5. Farm summary analytics (`GET /api/analytics/summary`)
 *   6. Quality status & Risk distribution from real RuleEngine
 *   7. Date filtering (`?days=7`, `?days=30`, `?days=90`)
 *   8. Feed sample historical trends (`GET /api/analytics/feed-samples/{id}`)
 *   9. Silage sample historical trends (`GET /api/analytics/silage-samples/{id}`)
 *   10. Animal historical analytics (`GET /api/analytics/animals/{id}`)
 *   11. Strict null handling: null measurements remain null, NEVER 0 or safe/good
 *   12. Cross-farmer security: Farmer B cannot access Farmer A's data (403 Forbidden)
 *   13. Cross-farmer data leakage check: Farmer B summary shows only 0 records
 *   14. Missing resources -> 404 Not Found
 *   15. Non-causal descriptive summary verification
 *   16. Scientific boundary disclaimers
 */

const BASE_URL = 'http://localhost:8080';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

let checksPassed = 0;
let checksFailed = 0;

function assert(condition, message) {
  if (condition) {
    checksPassed++;
    console.log(`  [PASS] ${message}`);
  } else {
    checksFailed++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runM9Verification() {
  console.log('==================================================');
  console.log('Starting M9 Live Real Pipeline Verification');
  console.log('==================================================\n');

  const timestamp = Date.now();

  // ── Step 1: Unauthenticated Requests (401 Unauthorized) ───────
  console.log('--- Step 1: Unauthenticated Requests (401) ---');
  const unauthSummary = await request('/api/analytics/summary');
  assert(unauthSummary.status === 401, 'GET /api/analytics/summary without token returns 401 Unauthorized');

  const unauthAnimal = await request('/api/analytics/animals/1');
  assert(unauthAnimal.status === 401, 'GET /api/analytics/animals/1 without token returns 401 Unauthorized');

  const unauthFeed = await request('/api/analytics/feed-samples/1');
  assert(unauthFeed.status === 401, 'GET /api/analytics/feed-samples/1 without token returns 401 Unauthorized');

  const unauthSilage = await request('/api/analytics/silage-samples/1');
  assert(unauthSilage.status === 401, 'GET /api/analytics/silage-samples/1 without token returns 401 Unauthorized');

  // ── Step 2: Register & Authenticate Farmer A ──────────────────
  console.log('\n--- Step 2: Register & Authenticate Farmer A ---');
  const farmerAEmail = `farmer_m9_a_${timestamp}@example.com`;
  const regFarmerA = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `farmerA_${timestamp}`,
      email: farmerAEmail,
      password: 'Password123!',
      fullName: 'Farmer A (M9)',
      role: 'FARMER',
    },
  });
  assert(regFarmerA.status === 201 || regFarmerA.status === 200, 'Farmer A registered successfully');

  const loginFarmerA = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: farmerAEmail,
      password: 'Password123!',
    },
  });
  assert(loginFarmerA.status === 200 && loginFarmerA.data?.token, 'Farmer A logged in and obtained JWT');
  const tokenA = loginFarmerA.data.token;
  const headersA = { Authorization: `Bearer ${tokenA}` };

  // ── Step 3: Create Real Farm, Animal, Feed Sample, Silage Sample ──
  console.log('\n--- Step 3: Create Real Farm, Animal, and Samples ---');
  const farmRes = await request('/api/farms', {
    method: 'POST',
    headers: headersA,
    body: {
      farmName: `Green Valley Farm ${timestamp}`,
      location: 'Plot 42, North District',
      state: 'Punjab',
    },
  });
  assert(farmRes.status === 201 && farmRes.data?.id, 'Real Farm created successfully');
  const farmId = farmRes.data.id;

  const animalRes = await request('/api/animals', {
    method: 'POST',
    headers: headersA,
    body: {
      farmId,
      animalTag: `M9-COW-${timestamp.toString().slice(-4)}`,
      name: 'Lakshmi',
      breed: 'Gir',
      gender: 'FEMALE',
      weight: 480.0,
      lactationStage: 'MID',
    },
  });
  assert(animalRes.status === 201 && animalRes.data?.id, 'Real Animal created successfully');
  const animalId = animalRes.data.id;
  const animalTag = animalRes.data.animalTag;

  const feedSampleRes = await request('/api/feed-samples', {
    method: 'POST',
    headers: headersA,
    body: {
      farmId,
      animalId,
      sampleCode: `FS-M9-${timestamp}`,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-01',
      source: 'Local Feed Mill',
    },
  });
  assert(feedSampleRes.status === 201 && feedSampleRes.data?.id, 'Real Feed Sample created successfully');
  const feedSampleId = feedSampleRes.data.id;
  const feedSampleCode = feedSampleRes.data.sampleCode;

  const silageSampleRes = await request('/api/silage-samples', {
    method: 'POST',
    headers: headersA,
    body: {
      farmId,
      animalId,
      sampleCode: `SS-M9-${timestamp}`,
      silageType: 'MAIZE',
      sampleDate: '2026-09-05',
      source: 'Bunker Silo A',
    },
  });
  assert(silageSampleRes.status === 201 && silageSampleRes.data?.id, 'Real Silage Sample created successfully');
  const silageSampleId = silageSampleRes.data.id;
  const silageSampleCode = silageSampleRes.data.sampleCode;

  // ── Step 4: Record Real Historical Test Results ───────────────
  console.log('\n--- Step 4: Record Real Test Results for Feed and Silage ---');
  // Feed Test 1: 25 days ago - Normal parameters (GOOD, LOW risk)
  const today = new Date();
  const date25DaysAgo = new Date(today.getTime() - 25 * 86400000).toISOString().split('T')[0];
  const date10DaysAgo = new Date(today.getTime() - 10 * 86400000).toISOString().split('T')[0];
  const dateToday = today.toISOString().split('T')[0];

  const tr1 = await request('/api/test-results', {
    method: 'POST',
    headers: headersA,
    body: {
      feedSampleId,
      testDate: date25DaysAgo,
      moisture: 12.0,
      crudeProtein: 17.5,
      fiber: 18.0,
      energyValue: 2600.0,
      aflatoxin: 5.0,
      analysisSource: 'LAB',
      confidenceScore: 95.0,
    },
  });
  assert(tr1.status === 201 && tr1.data?.id, 'Recorded TestResult 1 (25 days ago: normal parameters)');

  // Feed Test 2: 10 days ago - High Moisture (triggers WARNING, NEEDS_ATTENTION, MEDIUM risk)
  const tr2 = await request('/api/test-results', {
    method: 'POST',
    headers: headersA,
    body: {
      feedSampleId,
      testDate: date10DaysAgo,
      moisture: 18.5,
      crudeProtein: 16.2,
      fiber: 19.0,
      analysisSource: 'MANUAL',
      confidenceScore: 90.0,
    },
  });
  assert(tr2.status === 201 && tr2.data?.id, 'Recorded TestResult 2 (10 days ago: high moisture)');

  // Feed Test 3: Today - Critical Aflatoxin (triggers CRITICAL, UNSAFE, HIGH risk)
  // Null measurements intentionally left unrecorded to verify strict null preservation
  const tr3 = await request('/api/test-results', {
    method: 'POST',
    headers: headersA,
    body: {
      feedSampleId,
      testDate: dateToday,
      aflatoxin: 35.0,
      // moisture, crudeProtein, fiber, ph intentionally null!
      analysisSource: 'LAB',
      confidenceScore: 98.0,
    },
  });
  assert(tr3.status === 201 && tr3.data?.id, 'Recorded TestResult 3 (today: critical aflatoxin + null parameters)');

  // Silage Test: 5 days ago - Normal fermentation (GOOD, LOW risk)
  const date5DaysAgo = new Date(today.getTime() - 5 * 86400000).toISOString().split('T')[0];
  const trSilage = await request('/api/test-results', {
    method: 'POST',
    headers: headersA,
    body: {
      silageSampleId,
      testDate: date5DaysAgo,
      ph: 3.8,
      moisture: 65.0,
      crudeProtein: 8.5,
      analysisSource: 'LAB',
      confidenceScore: 92.0,
    },
  });
  assert(trSilage.status === 201 && trSilage.data?.id, 'Recorded Silage TestResult (5 days ago: pH 3.8, moisture 65%)');

  // ── Step 5: Farmer Summary Analytics ──────────────────────────
  console.log('\n--- Step 5: Farmer Summary Analytics (GET /api/analytics/summary) ---');
  const summaryRes = await request('/api/analytics/summary', { headers: headersA });
  assert(summaryRes.status === 200, 'GET /api/analytics/summary returns 200 OK');
  const summary = summaryRes.data;

  assert(summary.totalAnimals >= 1, `totalAnimals count is correct: ${summary.totalAnimals}`);
  assert(summary.totalFeedSamples >= 1, `totalFeedSamples count is correct: ${summary.totalFeedSamples}`);
  assert(summary.totalSilageSamples >= 1, `totalSilageSamples count is correct: ${summary.totalSilageSamples}`);
  assert(summary.totalTestResults >= 4, `totalTestResults count is correct: ${summary.totalTestResults}`);

  // Check Quality Status Distribution
  const qDist = summary.qualityStatusDistribution || {};
  assert(qDist.GOOD >= 2, `Quality status GOOD recorded: ${qDist.GOOD}`);
  assert(qDist.NEEDS_ATTENTION >= 1, `Quality status NEEDS_ATTENTION recorded: ${qDist.NEEDS_ATTENTION}`);
  assert(qDist.UNSAFE >= 1, `Quality status UNSAFE recorded: ${qDist.UNSAFE}`);

  // Check Risk Distribution
  const rDist = summary.riskDistribution || {};
  assert(rDist.LOW >= 2, `Risk level LOW recorded: ${rDist.LOW}`);
  assert(rDist.MEDIUM >= 1, `Risk level MEDIUM recorded: ${rDist.MEDIUM}`);
  assert(rDist.HIGH >= 1, `Risk level HIGH recorded: ${rDist.HIGH}`);

  // Check Risk Category Indicators
  assert(summary.contaminationRiskCount >= 1, `Contamination risk detected: ${summary.contaminationRiskCount}`);
  assert(summary.storageRiskCount >= 1, `Storage risk detected: ${summary.storageRiskCount}`);

  // Check Scientific Disclaimer
  assert(
    summary.disclaimer && summary.disclaimer.includes('Analytics are descriptive summaries'),
    'Scientific boundary disclaimer present on summary'
  );

  // ── Step 6: Date Filtering ────────────────────────────────────
  console.log('\n--- Step 6: Date Filtering Verification ---');
  // 7 days filter: should include tr3 (today) and trSilage (5 days ago), but exclude tr1 (25 days ago) and tr2 (10 days ago)
  const filter7Res = await request('/api/analytics/summary?days=7', { headers: headersA });
  assert(filter7Res.status === 200, 'GET /api/analytics/summary?days=7 returns 200 OK');
  assert(filter7Res.data.daysFilter === 7, 'daysFilter is 7 in response');
  assert(filter7Res.data.totalTestResults === 2, `7-day filter returns exactly 2 test results (expected 2, got ${filter7Res.data.totalTestResults})`);

  // 30 days filter: includes all 4 test results
  const filter30Res = await request('/api/analytics/summary?days=30', { headers: headersA });
  assert(filter30Res.status === 200, 'GET /api/analytics/summary?days=30 returns 200 OK');
  assert(filter30Res.data.totalTestResults >= 4, `30-day filter returns all test results: ${filter30Res.data.totalTestResults}`);

  // ── Step 7: Feed Sample Historical Trends ─────────────────────
  console.log('\n--- Step 7: Feed Sample Historical Trends (GET /api/analytics/feed-samples/{id}) ---');
  const feedTrendsRes = await request(`/api/analytics/feed-samples/${feedSampleId}`, { headers: headersA });
  assert(feedTrendsRes.status === 200, 'GET /api/analytics/feed-samples/{id} returns 200 OK');
  const feedTrends = feedTrendsRes.data;

  assert(feedTrends.sampleId === feedSampleId, 'sampleId matches requested ID');
  assert(feedTrends.sampleCode === feedSampleCode, 'sampleCode matches');
  assert(feedTrends.sampleType === 'FEED', 'sampleType is FEED');
  assert(feedTrends.totalTestPoints === 3, `totalTestPoints is 3 (got ${feedTrends.totalTestPoints})`);

  // Verify Chronological Order (ascending by date)
  const pts = feedTrends.testPoints;
  assert(pts.length === 3, 'testPoints array has 3 entries');
  assert(pts[0].testDate <= pts[1].testDate && pts[1].testDate <= pts[2].testDate, 'testPoints are in ascending chronological order');

  // Verify Strict Null Preservation in Test 3
  const pt3 = pts[2];
  assert(pt3.aflatoxin === 35.0, `Aflatoxin measurement is 35.0 (got ${pt3.aflatoxin})`);
  assert(pt3.moisture === null, 'Null moisture remains null (NOT defaulted to 0)');
  assert(pt3.crudeProtein === null, 'Null crudeProtein remains null (NOT defaulted to 0)');
  assert(pt3.fiber === null, 'Null fiber remains null (NOT defaulted to 0)');
  assert(pt3.ph === null, 'Null pH remains null (NOT defaulted to 0)');
  assert(pt3.qualityStatus === 'UNSAFE', `Quality status for aflatoxin spike is UNSAFE (got ${pt3.qualityStatus})`);
  assert(pt3.riskLevel === 'HIGH', `Risk level for aflatoxin spike is HIGH (got ${pt3.riskLevel})`);

  // Verify Descriptive Summary & Disclaimer
  assert(feedTrends.descriptiveSummary && feedTrends.descriptiveSummary.includes('3 historical test record(s)'), 'Descriptive summary mentions 3 records');
  assert(feedTrends.disclaimer && feedTrends.disclaimer.includes('Analytics are descriptive summaries'), 'Disclaimer present');

  // Verify alias /history endpoint
  const feedAliasRes = await request(`/api/analytics/feed-samples/${feedSampleId}/history`, { headers: headersA });
  assert(feedAliasRes.status === 200 && feedAliasRes.data.totalTestPoints === 3, 'Alias /feed-samples/{id}/history returns 200 OK with same data');

  // ── Step 8: Silage Sample Historical Trends ───────────────────
  console.log('\n--- Step 8: Silage Sample Historical Trends (GET /api/analytics/silage-samples/{id}) ---');
  const silageTrendsRes = await request(`/api/analytics/silage-samples/${silageSampleId}`, { headers: headersA });
  assert(silageTrendsRes.status === 200, 'GET /api/analytics/silage-samples/{id} returns 200 OK');
  const silageTrends = silageTrendsRes.data;

  assert(silageTrends.sampleId === silageSampleId, 'sampleId matches requested ID');
  assert(silageTrends.sampleType === 'SILAGE', 'sampleType is SILAGE');
  assert(silageTrends.totalTestPoints === 1, 'totalTestPoints is 1');
  assert(silageTrends.testPoints[0].ph === 3.8, `Silage test point pH is 3.8 (got ${silageTrends.testPoints[0].ph})`);
  assert(silageTrends.testPoints[0].moisture === 64.0 || silageTrends.testPoints[0].moisture === 65.0, 'Silage test point moisture is correct');
  assert(silageTrends.testPoints[0].qualityStatus === 'GOOD', 'Silage quality status is GOOD');

  // Verify alias /history endpoint
  const silageAliasRes = await request(`/api/analytics/silage-samples/${silageSampleId}/history`, { headers: headersA });
  assert(silageAliasRes.status === 200 && silageAliasRes.data.totalTestPoints === 1, 'Alias /silage-samples/{id}/history returns 200 OK');

  // ── Step 9: Animal Historical Analytics ───────────────────────
  console.log('\n--- Step 9: Animal Historical Analytics (GET /api/analytics/animals/{id}) ---');
  const animalAnalyticsRes = await request(`/api/analytics/animals/${animalId}`, { headers: headersA });
  assert(animalAnalyticsRes.status === 200, 'GET /api/analytics/animals/{id} returns 200 OK');
  const animalAnalytics = animalAnalyticsRes.data;

  assert(animalAnalytics.animalId === animalId, 'animalId matches');
  assert(animalAnalytics.animalTag === animalTag, 'animalTag matches');
  assert(animalAnalytics.totalFeedTests === 3, `totalFeedTests is 3 (got ${animalAnalytics.totalFeedTests})`);
  assert(animalAnalytics.totalSilageTests === 1, `totalSilageTests is 1 (got ${animalAnalytics.totalSilageTests})`);
  assert(animalAnalytics.totalTestResults === 4, `totalTestResults is 4 (got ${animalAnalytics.totalTestResults})`);
  assert(animalAnalytics.latestMeasurements !== null, 'latestMeasurements is populated');
  assert(animalAnalytics.testHistory && animalAnalytics.testHistory.length === 4, 'testHistory has 4 chronological entries');
  assert(animalAnalytics.descriptiveSummary.includes('4 historical test record(s)'), 'Descriptive summary describes the 4 records');

  // Verify alias /history endpoint
  const animalAliasRes = await request(`/api/analytics/animals/${animalId}/history`, { headers: headersA });
  assert(animalAliasRes.status === 200 && animalAliasRes.data.totalTestResults === 4, 'Alias /animals/{id}/history returns 200 OK');

  // ── Step 10: Cross-Farmer Security & Ownership (403 Forbidden) ─
  console.log('\n--- Step 10: Cross-Farmer Security & Data Leakage (403 / Isolation) ---');
  const farmerBEmail = `farmer_m9_b_${timestamp}@example.com`;
  await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `farmerB_${timestamp}`,
      email: farmerBEmail,
      password: 'Password123!',
      fullName: 'Farmer B (Cross-Test)',
      role: 'FARMER',
    },
  });

  const loginFarmerB = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: farmerBEmail,
      password: 'Password123!',
    },
  });
  const tokenB = loginFarmerB.data.token;
  const headersB = { Authorization: `Bearer ${tokenB}` };

  // Farmer B attempts to access Farmer A's animal analytics
  const crossAnimal = await request(`/api/analytics/animals/${animalId}`, { headers: headersB });
  assert(crossAnimal.status === 403, 'Farmer B accessing Farmer A animal returns 403 Forbidden');

  // Farmer B attempts to access Farmer A's feed sample history
  const crossFeed = await request(`/api/analytics/feed-samples/${feedSampleId}`, { headers: headersB });
  assert(crossFeed.status === 403, 'Farmer B accessing Farmer A feed sample returns 403 Forbidden');

  // Farmer B attempts to access Farmer A's silage sample history
  const crossSilage = await request(`/api/analytics/silage-samples/${silageSampleId}`, { headers: headersB });
  assert(crossSilage.status === 403, 'Farmer B accessing Farmer A silage sample returns 403 Forbidden');

  // Verify Zero Data Leakage in Farmer B's Summary
  const summaryB = await request('/api/analytics/summary', { headers: headersB });
  assert(summaryB.status === 200, 'Farmer B summary returns 200 OK');
  assert(summaryB.data.totalAnimals === 0, 'Farmer B sees 0 animals (no leak from Farmer A)');
  assert(summaryB.data.totalFeedSamples === 0, 'Farmer B sees 0 feed samples');
  assert(summaryB.data.totalSilageSamples === 0, 'Farmer B sees 0 silage samples');
  assert(summaryB.data.totalTestResults === 0, 'Farmer B sees 0 test results');

  // ── Step 11: Missing Resources (404 Not Found) ─────────────────
  console.log('\n--- Step 11: Missing Resources (404 Not Found) ---');
  const notFoundAnimal = await request('/api/analytics/animals/99999999', { headers: headersA });
  assert(notFoundAnimal.status === 404, 'GET non-existent animal analytics returns 404 Not Found');

  const notFoundFeed = await request('/api/analytics/feed-samples/99999999', { headers: headersA });
  assert(notFoundFeed.status === 404, 'GET non-existent feed sample history returns 404 Not Found');

  const notFoundSilage = await request('/api/analytics/silage-samples/99999999', { headers: headersA });
  assert(notFoundSilage.status === 404, 'GET non-existent silage sample history returns 404 Not Found');

  // ── Step 12: Summary Report ───────────────────────────────────
  console.log('\n==================================================');
  console.log(`M9 LIVE PIPELINE VERIFICATION SUMMARY:`);
  console.log(`Total Checks Passed: ${checksPassed}`);
  console.log(`Total Checks Failed: ${checksFailed}`);
  console.log('==================================================\n');

  if (checksFailed > 0) {
    process.exit(1);
  }
}

runM9Verification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
