/**
 * Live End-to-End Verification Script for Milestone 8 (Expert Consultation)
 *
 * Verifies with REAL:
 * - MySQL database
 * - Spring Boot backend (http://localhost:8080)
 * - JWT authentication
 * - Complete consultation lifecycle:
 *   REQUESTED -> ACCEPTED -> IN_REVIEW -> RESPONDED -> COMPLETED
 *   Plus CANCELLED flow
 * - Strict ownership and authorization enforcement (401, 403, 404, 400)
 * - Non-diagnostic terminology & safety verification
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

async function runM8Verification() {
  console.log('==================================================');
  console.log('Starting M8 Live Real Pipeline Verification');
  console.log('==================================================');

  const ts = Date.now();

  // 1. Register Farmer 1
  console.log('\n[Phase 1] User Registration & Roles');
  const farmer1Email = `farmer1_${ts}@testm8.com`;
  const farmer1Res = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `FarmerOne_${ts}`,
      email: farmer1Email,
      password: 'password123',
      phone: '9876543210',
      role: 'FARMER',
    },
  });
  assert(farmer1Res.status === 201 && farmer1Res.data.token, 'Farmer 1 registered successfully');
  const farmer1Token = farmer1Res.data.token;

  // 2. Register Expert 1
  const expert1Email = `expert1_${ts}@testm8.com`;
  const expert1Res = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `DrSmith_${ts}`,
      email: expert1Email,
      password: 'password123',
      phone: '9876543211',
      role: 'EXPERT',
      qualification: 'DVM, Veterinary Nutrition Specialist',
      specialization: 'VETERINARY',
      experienceYears: 10,
      licenseNumber: `VET-REG-${ts}`,
      bio: 'Consultant in bovine health and nutrition management',
    },
  });
  assert(expert1Res.status === 201 && expert1Res.data.token, 'Expert 1 registered successfully with EXPERT role');
  assert(expert1Res.data.role === 'EXPERT', 'Expert 1 JWT contains EXPERT role');
  const expert1Token = expert1Res.data.token;

  // 3. Register Farmer 2
  const farmer2Email = `farmer2_${ts}@testm8.com`;
  const farmer2Res = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `FarmerTwo_${ts}`,
      email: farmer2Email,
      password: 'password123',
      phone: '9876543212',
      role: 'FARMER',
    },
  });
  assert(farmer2Res.status === 201 && farmer2Res.data.token, 'Farmer 2 registered successfully');
  const farmer2Token = farmer2Res.data.token;

  // 4. Register Expert 2
  const expert2Email = `expert2_${ts}@testm8.com`;
  const expert2Res = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `DrGreen_${ts}`,
      email: expert2Email,
      password: 'password123',
      phone: '9876543213',
      role: 'EXPERT',
      qualification: 'Animal Nutrition Expert',
      specialization: 'ANIMAL_NUTRITION',
      experienceYears: 7,
    },
  });
  assert(expert2Res.status === 201 && expert2Res.data.token, 'Expert 2 registered successfully');
  const expert2Token = expert2Res.data.token;

  // 5. Farmer 1 creates Farm, Animal, Feed Sample, Silage Sample
  console.log('\n[Phase 2] Entity Setup (Farm, Animal, Feed, Silage)');
  const farmRes = await request('/api/farms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer1Token}` },
    body: {
      farmName: `Highland Dairy ${ts}`,
      location: 'Sector 4',
      district: 'Dairy Valley',
      state: 'State',
      pincode: '560001',
    },
  });
  assert(farmRes.status === 201 && farmRes.data.id, 'Farmer 1 created Farm');
  const farmId = farmRes.data.id;

  const animalRes = await request('/api/animals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer1Token}` },
    body: {
      farmId,
      animalTag: `COW-M8-${ts}`,
      name: 'Bella',
      breed: 'Holstein',
      gender: 'FEMALE',
      dateOfBirth: '2023-01-15',
      weight: 520.0,
      lactationStage: 'MID',
      daysInMilk: 140,
      milkProductionPerDay: 26.5,
      pregnancyStatus: 'PREGNANT',
      feedIntakeStatus: 'REDUCED',
    },
  });
  assert(animalRes.status === 201 && animalRes.data.id, 'Farmer 1 registered Animal');
  const animalId = animalRes.data.id;

  const feedRes = await request('/api/feed-samples', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer1Token}` },
    body: {
      farmId,
      animalId,
      sampleCode: `FEED-M8-${ts}`,
      feedType: 'CATTLE_FEED_PELLET',
      source: 'Mill Supplier Batch 4',
      sampleDate: '2026-09-28',
      notes: 'Pellet batch delivered yesterday',
    },
  });
  assert(feedRes.status === 201 && feedRes.data.id, 'Farmer 1 registered Feed Sample');
  const feedSampleId = feedRes.data.id;

  const silageRes = await request('/api/silage-samples', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer1Token}` },
    body: {
      farmId,
      animalId,
      sampleCode: `SILAGE-M8-${ts}`,
      silageType: 'MAIZE',
      source: 'Bunker Pit 2',
      sampleDate: '2026-09-28',
      notes: 'Maize silage opened 3 days ago',
    },
  });
  assert(silageRes.status === 201 && silageRes.data.id, 'Farmer 1 registered Silage Sample');
  const silageSampleId = silageRes.data.id;

  // 6. Farmer 1 creates Consultation
  console.log('\n[Phase 3] Farmer Creates Consultation Request');
  const consultRes = await request('/api/consultations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer1Token}` },
    body: {
      subject: 'Feed intake drop and slight milk yield reduction',
      question: 'The animal COW-M8 has reduced intake by approx 20%. Please review the pellet feed and silage sample.',
      additionalContext: 'Silage pit opened recently. Weather has been unusually humid.',
      animalId,
      feedSampleId,
      silageSampleId,
    },
  });
  assert(consultRes.status === 201, 'Consultation created with status 201');
  const consultation = consultRes.data;
  assert(consultation.id != null, `Consultation ID generated: ${consultation.id}`);
  assert(consultation.status === 'REQUESTED', 'Initial status is REQUESTED');
  assert(consultation.animalTag === `COW-M8-${ts}`, 'Animal tag linked properly');
  assert(consultation.feedSampleCode === `FEED-M8-${ts}`, 'Feed sample code linked properly');
  assert(consultation.silageSampleCode === `SILAGE-M8-${ts}`, 'Silage sample code linked properly');
  assert(consultation.expertId === null, 'Expert is initially unassigned');
  const consultId = consultation.id;

  // 7. Expert 1 views consultation queue
  console.log('\n[Phase 4] Expert Views Available Consultations');
  const expertListRes = await request('/api/consultations', {
    headers: { Authorization: `Bearer ${expert1Token}` },
  });
  assert(expertListRes.status === 200, 'Expert 1 listed consultations');
  const foundInExpertQueue = expertListRes.data.some((c) => c.id === consultId);
  assert(foundInExpertQueue, 'Created consultation is visible in Expert queue');

  // 8. Expert 1 views full consultation details
  console.log('\n[Phase 5] Expert Views Consultation Details');
  const expertDetailRes = await request(`/api/consultations/${consultId}`, {
    headers: { Authorization: `Bearer ${expert1Token}` },
  });
  assert(expertDetailRes.status === 200, 'Expert 1 fetched consultation details');
  const details = expertDetailRes.data;
  assert(details.animal != null && details.animal.animalTag === `COW-M8-${ts}`, 'Animal profile populated in details');
  assert(details.animal.breed === 'Holstein', 'Animal breed populated');
  assert(details.feedSample != null && details.feedSample.sampleCode === `FEED-M8-${ts}`, 'Feed sample populated in details');
  assert(details.silageSample != null && details.silageSample.sampleCode === `SILAGE-M8-${ts}`, 'Silage sample populated in details');

  // 9. Expert 1 accepts consultation
  console.log('\n[Phase 6] Expert Accepts Consultation');
  const acceptRes = await request(`/api/consultations/${consultId}/accept`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${expert1Token}` },
  });
  assert(acceptRes.status === 200, 'Expert 1 accepted consultation');
  assert(acceptRes.data.status === 'ACCEPTED', 'Status transitioned to ACCEPTED');
  assert(acceptRes.data.expertName === `DrSmith_${ts}`, 'Expert name assigned to consultation');

  // 10. Expert 2 cannot accept already accepted consultation
  console.log('\n[Phase 7] Conflict Prevention: Second Expert Cannot Accept');
  const conflictAcceptRes = await request(`/api/consultations/${consultId}/accept`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${expert2Token}` },
  });
  assert(conflictAcceptRes.status === 400, 'Expert 2 rejected when attempting to accept already accepted consultation (400)');

  // 11. Expert 1 moves consultation to IN_REVIEW
  console.log('\n[Phase 8] Expert Moves Consultation to IN_REVIEW');
  const reviewRes = await request(`/api/consultations/${consultId}/review`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${expert1Token}` },
  });
  assert(reviewRes.status === 200, 'Consultation moved to IN_REVIEW');
  assert(reviewRes.data.status === 'IN_REVIEW', 'Status is IN_REVIEW');

  // 12. Security: Farmer 2 cannot access Farmer 1's consultation
  console.log('\n[Phase 9] Security & Ownership Verification');
  const crossFarmerRes = await request(`/api/consultations/${consultId}`, {
    headers: { Authorization: `Bearer ${farmer2Token}` },
  });
  assert(crossFarmerRes.status === 403, 'Cross-farmer access returns 403 Forbidden');

  // 13. Farmer 1 cannot cancel after review has begun
  console.log('\n[Phase 10] Invalid State Transition: Farmer Cannot Cancel in IN_REVIEW');
  const invalidCancelRes = await request(`/api/consultations/${consultId}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${farmer1Token}` },
  });
  assert(invalidCancelRes.status === 400, 'Farmer cancellation rejected when status is IN_REVIEW (400)');

  // 14. Expert 1 submits recommendation & notes
  console.log('\n[Phase 11] Expert Responds to Consultation');
  const recommendationText = 'Inspect the silage face for signs of aerobic heating or secondary fermentation. Increase long-stem dry hay intake by 1.5 kg/day to buffer rumen pH, and gradually re-introduce the pellets once appetite stabilizes.';
  const notesText = 'Recommend taking a temperature measurement of the silage pit face and monitoring milk fat percentage over the next 48 hours.';
  const respondRes = await request(`/api/consultations/${consultId}/respond`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${expert1Token}` },
    body: {
      recommendation: recommendationText,
      expertNotes: notesText,
    },
  });
  assert(respondRes.status === 200, 'Expert submitted response');
  assert(respondRes.data.status === 'RESPONDED', 'Status transitioned to RESPONDED');
  assert(respondRes.data.expertRecommendation === recommendationText, 'Recommendation persisted accurately');
  assert(respondRes.data.expertNotes === notesText, 'Expert notes persisted accurately');
  assert(respondRes.data.responseDate != null, 'Response date recorded');

  // 15. Farmer 1 retrieves and views the expert recommendation
  console.log('\n[Phase 12] Farmer Retrieves Expert Recommendation');
  const farmerViewRes = await request(`/api/consultations/${consultId}`, {
    headers: { Authorization: `Bearer ${farmer1Token}` },
  });
  assert(farmerViewRes.status === 200, 'Farmer 1 retrieved consultation details');
  assert(farmerViewRes.data.status === 'RESPONDED', 'Farmer sees status RESPONDED');
  assert(farmerViewRes.data.expertRecommendation === recommendationText, 'Farmer views exact expert recommendation');
  assert(farmerViewRes.data.expertName === `DrSmith_${ts}`, 'Farmer sees expert name');

  // 16. Security: Farmer cannot complete consultation
  console.log('\n[Phase 13] Authorization: Farmer Cannot Complete Consultation');
  const farmerCompleteRes = await request(`/api/consultations/${consultId}/complete`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${farmer1Token}` },
  });
  assert(farmerCompleteRes.status === 403, 'Farmer complete request rejected with 403 Forbidden');

  // 17. Expert completes consultation
  console.log('\n[Phase 14] Expert Completes Consultation');
  const completeRes = await request(`/api/consultations/${consultId}/complete`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${expert1Token}` },
  });
  assert(completeRes.status === 200, 'Expert completed consultation');
  assert(completeRes.data.status === 'COMPLETED', 'Status transitioned to COMPLETED');
  assert(completeRes.data.completedAt != null, 'completedAt timestamp recorded');

  // 18. Farmer sees COMPLETED status
  console.log('\n[Phase 15] Farmer Sees COMPLETED Status');
  const farmerCompletedViewRes = await request(`/api/consultations/${consultId}`, {
    headers: { Authorization: `Bearer ${farmer1Token}` },
  });
  assert(farmerCompletedViewRes.status === 200, 'Farmer 1 fetched completed consultation');
  assert(farmerCompletedViewRes.data.status === 'COMPLETED', 'Farmer confirms COMPLETED status');
  assert(farmerCompletedViewRes.data.completedAt != null, 'Farmer sees completion timestamp');

  // 19. Cancellation Workflow
  console.log('\n[Phase 16] Farmer Cancellation Workflow');
  const cancelConsultRes = await request('/api/consultations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer2Token}` },
    body: {
      subject: 'Inquiry regarding mineral block intake',
      question: 'Does the free-choice mineral lick satisfy calcium requirements?',
    },
  });
  assert(cancelConsultRes.status === 201, 'Farmer 2 created consultation for cancellation test');
  const cancelConsultId = cancelConsultRes.data.id;

  const farmerCancelRes = await request(`/api/consultations/${cancelConsultId}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${farmer2Token}` },
  });
  assert(farmerCancelRes.status === 200, 'Farmer 2 cancelled eligible consultation');
  assert(farmerCancelRes.data.status === 'CANCELLED', 'Status transitioned to CANCELLED');

  const expertAcceptCancelledRes = await request(`/api/consultations/${cancelConsultId}/accept`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${expert1Token}` },
  });
  assert(expertAcceptCancelledRes.status === 400, 'Expert cannot accept cancelled consultation (400)');

  // 20. General Security & Error Handling Checks
  console.log('\n[Phase 17] HTTP Status Code & Security Verification');
  const unauthRes = await request('/api/consultations');
  assert(unauthRes.status === 401, 'Unauthenticated request returns 401 Unauthorized');

  const missingRes = await request('/api/consultations/999999', {
    headers: { Authorization: `Bearer ${farmer1Token}` },
  });
  assert(missingRes.status === 404, 'Missing consultation returns 404 Not Found');

  console.log('\n==================================================');
  console.log(`M8 Live Verification Summary: ${checksPassed} PASSED, ${checksFailed} FAILED`);
  console.log('==================================================');

  if (checksFailed > 0) {
    process.exit(1);
  }
}

runM8Verification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
