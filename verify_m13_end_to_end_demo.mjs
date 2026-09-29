// verify_m13_end_to_end_demo.mjs
// Milestone 13: Complete End-to-End Workflow Demonstration & Verification
// Covers entire user journey across React Native, Spring Boot, MySQL, and FastAPI AI Service

const BASE_URL = 'http://localhost:8080';
const AI_SERVICE_URL = 'http://localhost:8000';

let step = 0;
let passed = 0;
let failed = 0;

function logStep(title) {
  step++;
  console.log(`\n===============================================================`);
  console.log(`STEP ${step}: ${title}`);
  console.log(`===============================================================`);
}

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message} ${details ? '-> ' + details : ''}`);
  }
}

// Valid standard JPEG byte array
function createValidJpegBuffer() {
  return Buffer.from([
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
}

async function run() {
  console.log('###############################################################');
  console.log('  CATTLEFEEDAI — M13 FINAL END-TO-END DEMO & WORKFLOW AUDIT    ');
  console.log('###############################################################');

  const ts = Date.now();
  const farmerEmail = `farmer_m13_${ts}@dairytech.in`;
  const expertEmail = `vet_nutritionist_m13_${ts}@dairytech.in`;
  const defaultPassword = 'Password123!';

  // Step 1: Farmer Registration
  logStep('Farmer Registration');
  const regFarmerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `farmer_${ts}`,
      email: farmerEmail,
      password: defaultPassword,
      phone: '+91 9876500001',
      role: 'FARMER'
    })
  });
  assert(regFarmerRes.status === 201, 'Farmer registration returns 201 Created');
  const regFarmerData = await regFarmerRes.json();
  assert(!!regFarmerData.token, 'Registration returns valid auth token');

  // Step 2: Farmer Login & JWT Validation
  logStep('Farmer Login & JWT Token Retrieval');
  const loginFarmerRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: farmerEmail,
      password: defaultPassword
    })
  });
  assert(loginFarmerRes.status === 200, 'Farmer login returns 200 OK');
  const loginFarmerData = await loginFarmerRes.json();
  const farmerToken = loginFarmerData.token;
  assert(!!farmerToken && farmerToken.length > 20, 'Valid JWT access token obtained');
  const farmerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${farmerToken}`
  };

  // Step 3: Create Farm
  logStep('Create Farm Profile');
  const farmRes = await fetch(`${BASE_URL}/api/farms`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      farmName: `Kamdhenu Dairy Farm ${ts.toString().slice(-4)}`,
      location: 'National Highway 48, Sector 12',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388001'
    })
  });
  assert(farmRes.status === 201, 'Farm profile created (201 Created)');
  const farm = await farmRes.json();
  const farmId = farm.id;
  assert(!!farmId, `Farm ID: ${farmId}, Name: ${farm.farmName}`);

  // Step 4: Create Animal
  logStep('Register Dairy Cow');
  const animalTag = `IND-GJ-${ts.toString().slice(-5)}`;
  const animalRes = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      farmId: farmId,
      animalTag: animalTag,
      name: 'Nandini',
      breed: 'Gir',
      gender: 'FEMALE',
      dateOfBirth: '2021-08-15',
      weight: 460.0,
      lactationStage: 'EARLY',
      daysInMilk: 45,
      milkProductionPerDay: 22.5,
      pregnancyStatus: 'NOT_PREGNANT',
      feedIntakeStatus: 'NORMAL'
    })
  });
  assert(animalRes.status === 201, 'Animal registered (201 Created)');
  const animal = await animalRes.json();
  const animalId = animal.id;
  assert(animal.animalTag === animalTag, `Animal tag: ${animal.animalTag}, Breed: ${animal.breed}`);

  // Step 5: Create Feed Sample
  logStep('Create Commercial Pellet Feed Sample');
  const feedSampleRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      farmId: farmId,
      animalId: animalId,
      sampleCode: `FEED-${ts.toString().slice(-5)}`,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-29',
      source: 'Kaira Co-op Feed Mill, Batch 412',
      notes: 'High-protein commercial pellet feed'
    })
  });
  assert(feedSampleRes.status === 201, 'Feed sample created (201 Created)');
  const feedSample = await feedSampleRes.json();
  const feedSampleId = feedSample.id;
  assert(feedSample.feedType === 'CATTLE_FEED_PELLET', `Feed sample code: ${feedSample.sampleCode}`);

  // Step 6: Create Silage Sample
  logStep('Create Ensiled Corn Silage Sample');
  const silageSampleRes = await fetch(`${BASE_URL}/api/silage-samples`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      farmId: farmId,
      animalId: animalId,
      sampleCode: `SIL-${ts.toString().slice(-5)}`,
      silageType: 'MAIZE',
      sampleDate: '2026-09-29',
      source: 'East Bunker Silo Pit #3',
      notes: '90-day anaerobically fermented whole-crop maize'
    })
  });
  assert(silageSampleRes.status === 201, 'Silage sample created (201 Created)');
  const silageSample = await silageSampleRes.json();
  const silageSampleId = silageSample.id;
  assert(silageSample.silageType === 'MAIZE', `Silage sample code: ${silageSample.sampleCode}`);

  // Step 7: Record Laboratory Test Result (with deviation for risk & advisory testing)
  logStep('Record Laboratory Chemical Test Result');
  const testResultRes = await fetch(`${BASE_URL}/api/test-results`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      feedSampleId: feedSampleId,
      testDate: '2026-09-29',
      moisture: 14.8,
      crudeProtein: 19.5,
      fiber: 9.2,
      energyValue: 11.8,
      mineralStatus: 'Adequate Calcium, borderline Phosphorus',
      aflatoxin: 24.5,
      mycotoxin: 0.15,
      ph: 6.6,
      adulteration: 'None detected',
      mouldDetected: true,
      spoilageDetected: false,
      confidenceScore: 0.98,
      analysisSource: 'LAB'
    })
  });
  assert(testResultRes.status === 201, 'Laboratory test result recorded (201 Created)');
  const testResult = await testResultRes.json();
  const testResultId = testResult.id;
  assert(testResult.aflatoxin === 24.5, `Test result ID: ${testResultId}, Aflatoxin: ${testResult.aflatoxin} ppb`);

  // Step 8: Rule-Based Quality Assessment
  logStep('Rule-Based Quality Assessment');
  const qualityRes = await fetch(`${BASE_URL}/api/assessments/test-results/${testResultId}`, {
    headers: farmerHeaders
  });
  assert(qualityRes.status === 200, 'GET /api/assessments/test-results/:id returns 200 OK');
  const qualityData = await qualityRes.json();
  assert(qualityData.qualityStatus === 'UNSAFE', `Quality status correctly flagged as: ${qualityData.qualityStatus}`);
  assert(Array.isArray(qualityData.parameters) && qualityData.parameters.length >= 11, 'Evaluates all standard chemical/physical parameters');

  // Step 9: Risk Assessment
  logStep('Risk Assessment');
  const riskRes = await fetch(`${BASE_URL}/api/assessments/test-results/${testResultId}/risk`, {
    headers: farmerHeaders
  });
  assert(riskRes.status === 200, 'GET /api/assessments/test-results/:id/risk returns 200 OK');
  const riskData = await riskRes.json();
  assert(riskData.overallRiskLevel === 'HIGH', `Overall risk level correctly calculated as: ${riskData.overallRiskLevel}`);
  assert(Array.isArray(riskData.contaminationRisks) && riskData.contaminationRisks.length > 0, 'Contamination risk correctly identified');

  // Step 10: Upload Sample Image
  logStep('Upload Sample Image for Visual Screening');
  const validJpeg = createValidJpegBuffer();
  const feedFormData = new FormData();
  feedFormData.append('file', new Blob([validJpeg], { type: 'image/jpeg' }), 'pellet_inspection.jpg');
  feedFormData.append('caption', 'High-res pellet surface sample for mould screening');

  const uploadImgRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: feedFormData
  });
  assert(uploadImgRes.status === 201, 'Sample image uploaded (201 Created)');
  const imgMeta = await uploadImgRes.json();
  const sampleImageId = imgMeta.id;
  assert(!!sampleImageId, `Sample image ID: ${sampleImageId}`);

  // Step 11: AI Visual Screening (FastAPI + Spring Boot integration via POST)
  logStep('AI Visual Screening via FastAPI microservice');
  const aiAnalyzeRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images/${sampleImageId}/analyze`, {
    method: 'POST',
    headers: farmerHeaders
  });
  assert(aiAnalyzeRes.status === 200, 'AI visual screening returns 200 OK');
  const aiData = await aiAnalyzeRes.json();
  assert(aiData.analysis_available === true || aiData.analysisAvailable === true, 'Analysis is available');
  const source = aiData.analysis_source || aiData.analysisSource;
  assert(
    source === 'DETERMINISTIC_VISUAL_SCREENING' || source === 'ML_VISUAL_SCREENING',
    `Analysis source is non-fabricated: ${source}`
  );
  assert(!!(aiData.disclaimer || aiData.scientificDisclaimer), 'Mandatory non-diagnostic disclaimer present');
  assert(aiData.crudeProtein === undefined && aiData.moisture === undefined, 'Strict boundary: ZERO chemical predictions in AI payload');

  // Step 12: Animal Health Screening
  logStep('Animal Health Screening');
  const healthRes = await fetch(`${BASE_URL}/api/assessments/animals/${animalId}/health-screening`, {
    headers: farmerHeaders
  });
  assert(healthRes.status === 200, 'Animal health screening returns 200 OK');
  const healthData = await healthRes.json();
  assert(['NORMAL', 'POTENTIAL_CONCERN'].includes(healthData.screeningStatus), `Health status valid: ${healthData.screeningStatus}`);
  assert(healthData.disclaimer.toLowerCase().includes('veterinary'), 'Scientific safety: non-diagnostic veterinary disclaimer present');

  // Step 13: Create Feed Plan
  logStep('Create Dairy Herd Feed Plan');
  const feedPlanRes = await fetch(`${BASE_URL}/api/feed-plans`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      planName: 'Early Lactation Ration Schedule',
      description: 'Scheduled daily ration balancing pellet concentrate and ensiled maize',
      startDate: '2026-09-29',
      endDate: '2026-10-29',
      status: 'ACTIVE',
      animalId: animalId,
      feedSampleId: feedSampleId,
      silageSampleId: silageSampleId,
      plannedQuantity: 14.0,
      frequency: 'TWICE_DAILY',
      notes: 'Monitor feed intake status daily'
    })
  });
  assert(feedPlanRes.status === 201, 'Feed plan created (201 Created)');
  const feedPlan = await feedPlanRes.json();
  const feedPlanId = feedPlan.id;
  assert(feedPlan.status === 'ACTIVE', `Feed plan ID: ${feedPlanId}, Status: ${feedPlan.status}`);

  // Step 14: Create Expert Consultation Request
  logStep('Farmer Submits Expert Consultation Request');
  const consultReqRes = await fetch(`${BASE_URL}/api/consultations`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      animalId: animalId,
      feedSampleId: feedSampleId,
      silageSampleId: silageSampleId,
      subject: 'Elevated moisture and mould risk in pellet sample',
      question: 'Should I withdraw this pellet batch immediately and adjust maize silage proportion for early-lactation Gir cow?',
      additionalContext: 'Cow is at 45 DIM producing 22.5 L/day.'
    })
  });
  assert(consultReqRes.status === 201, 'Consultation request created (201 Created)');
  const consultation = await consultReqRes.json();
  const consultationId = consultation.id;
  assert(consultation.status === 'REQUESTED', `Consultation status: ${consultation.status}`);

  // Step 15: Expert Registration & Login
  logStep('Register & Authenticate Veterinary Nutrition Expert');
  const regExpertRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `vet_expert_${ts}`,
      email: expertEmail,
      password: defaultPassword,
      phone: '+91 9876500002',
      role: 'EXPERT'
    })
  });
  assert(regExpertRes.status === 201, 'Expert registered with EXPERT role (201 Created)');
  const expertToken = (await regExpertRes.json()).token;
  const expertHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${expertToken}`
  };

  // Step 16: Expert Accepts Consultation
  logStep('Expert Accepts Consultation');
  const acceptRes = await fetch(`${BASE_URL}/api/consultations/${consultationId}/accept`, {
    method: 'PUT',
    headers: expertHeaders
  });
  assert(acceptRes.status === 200, 'Expert accepts consultation (200 OK)');
  const acceptedData = await acceptRes.json();
  assert(acceptedData.status === 'ACCEPTED', `Consultation transitioned to: ${acceptedData.status}`);

  // Step 17: Expert Views Unified Evidence Summary
  logStep('Expert Inspects Aggregated Evidence Summary');
  const evidenceRes = await fetch(`${BASE_URL}/api/evidence/consultations/${consultationId}`, {
    headers: expertHeaders
  });
  assert(evidenceRes.status === 200, 'GET /api/evidence/consultations/:id returns 200 OK');
  const evidence = await evidenceRes.json();
  assert(evidence.animal.id === animalId, 'Evidence links correct animal profile');
  assert(evidence.feedEvidence.length >= 1, 'Evidence includes feed sample history');
  assert(evidence.silageEvidence.length >= 1, 'Evidence includes silage sample history');
  assert(evidence.qualityEvidence.qualityStatus === 'UNSAFE', 'Evidence reflects rule-based quality assessment');
  assert(evidence.riskEvidence.overallRiskLevel === 'HIGH', 'Evidence reflects calculated risk indicators');
  assert(evidence.feedPlans.length >= 1, 'Evidence integrates active feed plans');
  assert(!!evidence.disclaimer, 'Evidence contains non-diagnostic legal disclaimer');

  // Step 18: Expert Responds with Professional Guidance
  logStep('Expert Responds with Veterinary Nutritionist Advisory');
  const respondRes = await fetch(`${BASE_URL}/api/consultations/${consultationId}/respond`, {
    method: 'PUT',
    headers: expertHeaders,
    body: JSON.stringify({
      recommendation: 'Immediately suspend feeding pellet batch 412. Transition animal to safe alternative dry fodder and maintain maize silage at 12 kg/day. Monitor milk yield and rumination activity.',
      expertNotes: 'Elevated aflatoxin (>20 ppb) presents severe hepatic and production risks for early-lactation cow.'
    })
  });
  assert(respondRes.status === 200, 'Expert responds to consultation (200 OK)');
  const respondedData = await respondRes.json();
  assert(respondedData.status === 'RESPONDED', `Status updated to: ${respondedData.status}`);

  // Step 19: Farmer Views Expert Response
  logStep('Farmer Retrieves Professional Recommendation');
  const farmerViewRes = await fetch(`${BASE_URL}/api/consultations/${consultationId}`, {
    headers: farmerHeaders
  });
  assert(farmerViewRes.status === 200, 'Farmer views consultation (200 OK)');
  const farmerConsultData = await farmerViewRes.json();
  assert(farmerConsultData.status === 'RESPONDED', 'Farmer sees RESPONDED status');
  assert(farmerConsultData.expertRecommendation.includes('suspend feeding pellet batch 412'), 'Farmer sees full recommendation');

  // Step 20: Historical Analytics
  logStep('Farmer Ingests Historical Herd Analytics');
  const analyticsSummaryRes = await fetch(`${BASE_URL}/api/analytics/summary`, {
    headers: farmerHeaders
  });
  assert(analyticsSummaryRes.status === 200, 'Analytics summary returns 200 OK');
  const summaryData = await analyticsSummaryRes.json();
  assert(summaryData.totalAnimals >= 1, `Total animals in analytics: ${summaryData.totalAnimals}`);
  assert(summaryData.totalTestResults >= 1, `Total lab test results: ${summaryData.totalTestResults}`);

  const animalHistoryRes = await fetch(`${BASE_URL}/api/analytics/animals/${animalId}`, {
    headers: farmerHeaders
  });
  assert(animalHistoryRes.status === 200, 'Animal analytics history returns 200 OK');
  const animalHistory = await animalHistoryRes.json();
  assert(animalHistory.animalId === animalId, 'Animal analytics matches requested ID');

  // Step 21: Alert Generation (triggered via assessment engine)
  logStep('Trigger Hazard Assessment Alert and Notification');
  const triggerAssessmentRes = await fetch(`${BASE_URL}/api/assessments/test-results/${testResultId}`, {
    method: 'POST',
    headers: farmerHeaders
  });
  assert(triggerAssessmentRes.status === 200, 'Assessment and alert generation endpoint executed (200 OK)');

  // Step 22: Farmer Views and Marks Alert Read
  logStep('Farmer Views In-App Notification and Marks as Read');
  const alertsListRes = await fetch(`${BASE_URL}/api/alerts`, {
    headers: farmerHeaders
  });
  assert(alertsListRes.status === 200, 'GET /api/alerts returns 200 OK');
  const alerts = await alertsListRes.json();
  assert(Array.isArray(alerts) && alerts.length >= 1, `Alerts generated for farmer: ${alerts.length}`);
  const topAlert = alerts[0];

  const markReadRes = await fetch(`${BASE_URL}/api/alerts/${topAlert.id}/read`, {
    method: 'PUT',
    headers: farmerHeaders
  });
  assert(markReadRes.status === 200, 'Alert marked as read (200 OK)');
  const readAlert = await markReadRes.json();
  assert(readAlert.isRead === true, 'Alert isRead updated to true');

  // Step 23: Dashboard Final Live State
  logStep('Verify Unified Farmer Dashboard Live Aggregations');
  const [dFarms, dAnimals, dFeeds, dSilages, dPlans, dConsults, dUnreadAlerts, dSummary] = await Promise.all([
    fetch(`${BASE_URL}/api/farms`, { headers: farmerHeaders }).then(r => r.json()),
    fetch(`${BASE_URL}/api/animals`, { headers: farmerHeaders }).then(r => r.json()),
    fetch(`${BASE_URL}/api/feed-samples`, { headers: farmerHeaders }).then(r => r.json()),
    fetch(`${BASE_URL}/api/silage-samples`, { headers: farmerHeaders }).then(r => r.json()),
    fetch(`${BASE_URL}/api/feed-plans`, { headers: farmerHeaders }).then(r => r.json()),
    fetch(`${BASE_URL}/api/consultations`, { headers: farmerHeaders }).then(r => r.json()),
    fetch(`${BASE_URL}/api/alerts/unread-count`, { headers: farmerHeaders }).then(r => r.json()),
    fetch(`${BASE_URL}/api/analytics/summary`, { headers: farmerHeaders }).then(r => r.json()),
  ]);

  assert(Array.isArray(dFarms) && dFarms.length >= 1, `Live Farm count: ${dFarms.length}`);
  assert(Array.isArray(dAnimals) && dAnimals.length >= 1, `Live Animal count: ${dAnimals.length}`);
  assert(Array.isArray(dFeeds) && dFeeds.length >= 1, `Live Feed sample count: ${dFeeds.length}`);
  assert(Array.isArray(dSilages) && dSilages.length >= 1, `Live Silage sample count: ${dSilages.length}`);
  assert(Array.isArray(dPlans) && dPlans.length >= 1, `Live Feed Plan count: ${dPlans.length}`);
  assert(Array.isArray(dConsults) && dConsults.length >= 1, `Live Consultation count: ${dConsults.length}`);
  assert(typeof dUnreadAlerts.unreadCount === 'number', `Live Unread Alert count: ${dUnreadAlerts.unreadCount}`);
  assert(dSummary.totalTestResults >= 1, `Live Analytics total test results: ${dSummary.totalTestResults}`);

  console.log('\n###############################################################');
  console.log('  M13 COMPLETE END-TO-END DEMO EXECUTION SUMMARY:');
  console.log(`  TOTAL CHECKS: ${passed + failed}`);
  console.log(`  PASSED:       ${passed}`);
  console.log(`  FAILED:       ${failed}`);
  console.log('###############################################################');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error during M13 end-to-end demo execution:', err);
  process.exit(1);
});
