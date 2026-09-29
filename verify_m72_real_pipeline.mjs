// verify_m72_real_pipeline.mjs
// CattleFeedAI Milestone 7.2 Live Verification Script
// Tests end-to-end integration:
// 1. FastAPI AI microservice on http://127.0.0.1:8000
// 2. Spring Boot backend on http://localhost:8080
// 3. Image preprocessing, quality assessment, and visual screening pipeline
// 4. Strict scientific boundaries: ZERO chemical predictions, ZERO disease diagnosis

const FASTAPI_URL = 'http://127.0.0.1:8000';
const BACKEND_URL = 'http://localhost:8080';

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

// Generate valid synthetic JPEG bytes
function createJpegBuffer(type = 'normal') {
  // A minimal valid JPEG with varying pixel patterns
  // Using 1x1 or 200x200 standard JPEG header & payload
  // Minimal valid 1x1 green JPEG
  const normalJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x40,
    0x00, 0x40, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x80, 0xff, 0xd9,
  ]);
  return normalJpeg;
}

// Ensure scientific safety across any analysis payload
function assertScientificSafety(payload, context) {
  const forbidden = [
    'protein', 'crude_protein', 'moisture', 'fiber', 'ash',
    'aflatoxin', 'ph', 'dry_matter', 'tdn', 'nel',
    'disease', 'diagnosis', 'mould_percentage'
  ];

  for (const key of forbidden) {
    assert(
      payload[key] === undefined,
      `[${context}] Strictly no chemical/diagnostic field '${key}' in root`
    );
  }

  assert(
    typeof payload.disclaimer === 'string' &&
      payload.disclaimer.includes('VISUAL SCREENING ONLY') &&
      payload.disclaimer.includes('does NOT measure chemical attributes'),
    `[${context}] Prominent scientific boundary disclaimer present`
  );
}

async function run() {
  console.log('===============================================================');
  console.log('  STARTING M7.2 LIVE VERIFICATION (FASTAPI & SPRING BOOT)');
  console.log('===============================================================');

  // ── PART 1: DIRECT FASTAPI CHECKS ─────────────────────────────────────────
  console.log('\n--- PART 1: Direct FastAPI AI Microservice Checks (Port 8000) ---');

  // 1. FastAPI Health
  const healthRes = await fetch(`${FASTAPI_URL}/health`);
  assert(healthRes.status === 200, 'FastAPI /health returns 200 OK');
  const healthData = await healthRes.json();
  assert(healthData.status === 'UP', 'FastAPI health status is UP', healthData.status);
  assert(healthData.version === '0.2.0' || healthData.version === '0.3.0', 'FastAPI version is valid (0.2.0 / 0.3.0)', healthData.version);

  // 2. FastAPI Info
  const infoRes = await fetch(`${FASTAPI_URL}/api/v1/info`);
  assert(infoRes.status === 200, 'FastAPI /api/v1/info returns 200 OK');
  const infoData = await infoRes.json();
  assert(infoData.analysis_available === true, 'FastAPI reports analysis_available: true');
  assert(infoData.capabilities.visual_screening === true, 'FastAPI reports visual_screening: true');
  assert(infoData.capabilities.chemical_prediction === false, 'FastAPI strictly reports chemical_prediction: false');
  assert(infoData.capabilities.disease_diagnosis === false, 'FastAPI strictly reports disease_diagnosis: false');

  // 3. Direct Analyze Image with Valid JPEG
  const jpegBuffer = createJpegBuffer('normal');
  const formNormal = new FormData();
  const blobNormal = new Blob([jpegBuffer], { type: 'image/jpeg' });
  formNormal.append('file', blobNormal, 'test_sample.jpg');

  const analyzeRes = await fetch(`${FASTAPI_URL}/api/v1/analyze/image`, {
    method: 'POST',
    body: formNormal,
  });
  assert(analyzeRes.status === 200, 'FastAPI /api/v1/analyze/image returns 200 OK');
  const analyzeData = await analyzeRes.json();
  assert(analyzeData.analysis_available === true, 'Analysis available is true');
  assert(
    analyzeData.analysis_source === 'IMAGE_VISUAL_SCREENING' ||
    analyzeData.analysis_source === 'DETERMINISTIC_VISUAL_SCREENING' ||
    analyzeData.analysis_source === 'ML_VISUAL_SCREENING',
    'Source is visual screening'
  );
  assert(!!analyzeData.image_quality, 'Image quality assessment included');
  assert(Array.isArray(analyzeData.visual_indicators), 'Visual indicators is an array');
  assert(!!analyzeData.overall_screening, 'Overall screening included');
  assertScientificSafety(analyzeData, 'Direct FastAPI Analyze');

  // 4. Direct Analyze Rejections: Empty file (400)
  const formEmpty = new FormData();
  formEmpty.append('file', new Blob([Buffer.from([])], { type: 'image/jpeg' }), 'empty.jpg');
  const emptyRes = await fetch(`${FASTAPI_URL}/api/v1/analyze/image`, { method: 'POST', body: formEmpty });
  assert(emptyRes.status === 400, 'FastAPI rejects empty image with 400 Bad Request');

  // 5. Direct Analyze Rejections: Unsupported content type (415)
  const formText = new FormData();
  formText.append('file', new Blob([Buffer.from('hello plain text')], { type: 'text/plain' }), 'test.txt');
  const textRes = await fetch(`${FASTAPI_URL}/api/v1/analyze/image`, { method: 'POST', body: formText });
  assert(textRes.status === 415, 'FastAPI rejects text/plain with 415 Unsupported Media Type');

  // ── PART 2: SPRING BOOT INTEGRATION CHECKS ────────────────────────────────
  console.log('\n--- PART 2: Spring Boot Integration Checks (Port 8080) ---');

  const timestamp = Date.now();
  const farmerUser = `farmer_m72_${timestamp}`;
  const farmerEmail = `farmer_m72_${timestamp}@dairy.com`;
  const password = 'Password@123';

  // 6. Register Farmer in Spring Boot
  const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: farmerUser,
      email: farmerEmail,
      password: password,
      fullName: 'Farmer M7.2 AI Tester',
      role: 'FARMER',
    }),
  });
  assert(regRes.status === 201, 'Spring Boot Register Farmer returns 201 Created');
  const authData = await regRes.json();
  const token = authData.token;
  assert(!!token, 'Farmer JWT token obtained');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 7. Spring Boot -> AI Health Probe
  const sbAiHealthRes = await fetch(`${BACKEND_URL}/api/ai/health`, { headers: authHeaders });
  assert(sbAiHealthRes.status === 200, 'Spring Boot /api/ai/health returns 200 OK');
  const sbAiHealth = await sbAiHealthRes.json();
  assert(sbAiHealth.available === true, 'Spring Boot confirms AI microservice available: true');
  assert(sbAiHealth.status === 'UP', 'Spring Boot confirms AI status: UP');

  // 8. Spring Boot -> AI Info Probe
  const sbAiInfoRes = await fetch(`${BACKEND_URL}/api/ai/info`, { headers: authHeaders });
  assert(sbAiInfoRes.status === 200, 'Spring Boot /api/ai/info returns 200 OK');
  const sbAiInfo = await sbAiInfoRes.json();
  assert(sbAiInfo.reachable === true, 'Spring Boot reports AI reachable: true');
  assert(sbAiInfo.analysisAvailable === true, 'Spring Boot reports AI analysisAvailable: true');

  // 9. Spring Boot -> Direct AI Image Analysis
  const sbDirectForm = new FormData();
  sbDirectForm.append('file', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'sample.jpg');
  const sbDirectRes = await fetch(`${BACKEND_URL}/api/ai/analyze-image`, {
    method: 'POST',
    headers: authHeaders,
    body: sbDirectForm,
  });
  assert(sbDirectRes.status === 200, 'Spring Boot /api/ai/analyze-image returns 200 OK');
  const sbDirectData = await sbDirectRes.json();
  assert(sbDirectData.analysisAvailable === true, 'Spring Boot direct analysis available');
  assert(!!sbDirectData.imageQuality, 'Spring Boot direct analysis has imageQuality');
  assert(!!sbDirectData.overallScreening, 'Spring Boot direct analysis has overallScreening');
  assertScientificSafety(sbDirectData, 'Spring Boot Direct Analyze');

  // 10. Create Farm & Feed Sample
  const farmRes = await fetch(`${BACKEND_URL}/api/farms`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      farmName: 'M7.2 AI Test Farm',
      location: 'Green Valley',
      latitude: 12.9716,
      longitude: 77.5946,
    }),
  });
  assert(farmRes.status === 201, 'Create Farm returns 201');
  const farm = await farmRes.json();

  const feedRes = await fetch(`${BACKEND_URL}/api/feed-samples`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sampleCode: `FS-M72-${timestamp}`,
      farmId: farm.id,
      feedType: 'GREEN_FODDER',
      source: 'ON_FARM',
      sampleDate: '2026-09-28',
      notes: 'BATCH-AI-01',
    }),
  });
  assert(feedRes.status === 201, 'Create Feed Sample returns 201');
  const feed = await feedRes.json();

  // 11. Upload Image to Feed Sample
  const uploadFeedImgForm = new FormData();
  uploadFeedImgForm.append('file', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'feed_batch_photo.jpg');
  uploadFeedImgForm.append('caption', 'Fresh green fodder inspection photo');

  const uploadFeedImgRes = await fetch(`${BACKEND_URL}/api/feed-samples/${feed.id}/images`, {
    method: 'POST',
    headers: authHeaders,
    body: uploadFeedImgForm,
  });
  assert(uploadFeedImgRes.status === 201, 'Upload Feed Sample Image returns 201 Created');
  const feedImg = await uploadFeedImgRes.json();

  // 12. Analyze Attached Feed Sample Image
  const analyzeFeedImgRes = await fetch(
    `${BACKEND_URL}/api/feed-samples/${feed.id}/images/${feedImg.id}/analyze`,
    {
      method: 'POST',
      headers: authHeaders,
    }
  );
  assert(analyzeFeedImgRes.status === 200, 'Analyze Attached Feed Image returns 200 OK');
  const feedAnalysis = await analyzeFeedImgRes.json();
  assert(feedAnalysis.analysisAvailable === true, 'Feed image analysis available: true');
  assert(!!feedAnalysis.imageQuality, 'Feed image analysis includes image quality');
  assert(!!feedAnalysis.overallScreening, 'Feed image analysis includes overall screening');
  assertScientificSafety(feedAnalysis, 'Attached Feed Image Analyze');

  // 13. Create Silage Sample & Upload & Analyze Silage Image
  const silageRes = await fetch(`${BACKEND_URL}/api/silage-samples`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sampleCode: `SS-M72-${timestamp}`,
      farmId: farm.id,
      silageType: 'MAIZE',
      sampleDate: '2026-09-28',
      source: 'ON_FARM',
    }),
  });
  assert(silageRes.status === 201, 'Create Silage Sample returns 201');
  const silage = await silageRes.json();

  const uploadSilageImgForm = new FormData();
  uploadSilageImgForm.append('file', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'silage_pit_photo.jpg');
  uploadSilageImgForm.append('caption', 'Maize silage pit inspection');

  const uploadSilageImgRes = await fetch(`${BACKEND_URL}/api/silage-samples/${silage.id}/images`, {
    method: 'POST',
    headers: authHeaders,
    body: uploadSilageImgForm,
  });
  assert(uploadSilageImgRes.status === 201, 'Upload Silage Sample Image returns 201 Created');
  const silageImg = await uploadSilageImgRes.json();

  const analyzeSilageImgRes = await fetch(
    `${BACKEND_URL}/api/silage-samples/${silage.id}/images/${silageImg.id}/analyze`,
    {
      method: 'POST',
      headers: authHeaders,
    }
  );
  assert(analyzeSilageImgRes.status === 200, 'Analyze Attached Silage Image returns 200 OK');
  const silageAnalysis = await analyzeSilageImgRes.json();
  assert(silageAnalysis.analysisAvailable === true, 'Silage image analysis available: true');
  assertScientificSafety(silageAnalysis, 'Attached Silage Image Analyze');

  console.log('\n===============================================================');
  console.log(`  M7.2 LIVE VERIFICATION SUMMARY:`);
  console.log(`  TOTAL CHECKS: ${totalSteps}`);
  console.log(`  PASSED:       ${passedSteps}`);
  console.log(`  FAILED:       ${failedSteps}`);
  console.log('===============================================================');

  if (failedSteps > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
