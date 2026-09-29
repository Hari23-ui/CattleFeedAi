// verify_m66_real_backend.mjs
// CattleFeedAI Milestone 6.6 Real Backend Live Verification
// Tests against real Spring Boot backend on http://localhost:8080
// Verifies Feed/Silage sample image upload, retrieval, streaming, deletion, validation, and security ownership.

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
  const farmerEmail = `farmer_m66_${timestamp}@dairyfarm.com`;
  const farmerUser = `farmer_m66_${timestamp}`;
  const farmer2Email = `farmer2_m66_${timestamp}@dairyfarm.com`;
  const farmer2User = `farmer2_m66_${timestamp}`;
  const password = 'Password@123';

  console.log('===============================================================');
  console.log('  STARTING M6.6 LIVE BACKEND VERIFICATION ON http://localhost:8080');
  console.log('===============================================================');

  // 1. Register Farmer A
  const regA = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: farmerUser,
      email: farmerEmail,
      password: password,
      fullName: 'Farmer M6.6 Tester',
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

  // 2. Register Farmer B (for ownership security tests)
  const regB = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: farmer2User,
      email: farmer2Email,
      password: password,
      fullName: 'Farmer M6.6 CrossUser',
      role: 'FARMER',
    }),
  });
  assert(regB.status === 201, 'Register Farmer B returns 201', regB.status);
  const authB = await regB.json();
  const tokenB = authB.token;
  assert(!!tokenB, 'Farmer B JWT token obtained');

  const headersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenB}`,
  };

  // 3. Create Farm for Farmer A
  const farmRes = await fetch(`${BASE_URL}/api/farms`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmName: `Sunrise Dairy M6.6 ${timestamp}`,
      location: 'Pune, Maharashtra',
      totalAnimals: 20,
    }),
  });
  assert(farmRes.status === 201, 'Create Farm returns 201', farmRes.status);
  const farm = await farmRes.json();
  const farmId = farm.id;

  // 4. Create Animal for Farmer A
  const animalRes = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farmId,
      animalTag: `M66-TAG-${timestamp}`,
      name: 'Kamadhenu',
      breed: 'Gir',
      gender: 'FEMALE',
      dateOfBirth: '2021-03-15',
      weight: 460.0,
      lactationStage: 'MID',
      daysInMilk: 110,
      milkProductionPerDay: 16.5,
      pregnancyStatus: 'NOT_PREGNANT',
      feedIntakeStatus: 'NORMAL',
    }),
  });
  assert(animalRes.status === 201, 'Create Animal returns 201', animalRes.status);
  const animal = await animalRes.json();
  const animalId = animal.id;

  // 5. Create Feed Sample for Farmer A
  const feedSampleRes = await fetch(`${BASE_URL}/api/feed-samples`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farmId,
      animalId: animalId,
      sampleCode: `FEED-M66-${timestamp}`,
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-27',
      source: 'Feed Mill Batch #44',
      notes: 'Freshly delivered commercial cattle feed pellet',
    }),
  });
  assert(feedSampleRes.status === 201, 'Create Feed Sample returns 201', feedSampleRes.status);
  const feedSample = await feedSampleRes.json();
  const feedSampleId = feedSample.id;

  // 6. Create Silage Sample for Farmer A
  const silageSampleRes = await fetch(`${BASE_URL}/api/silage-samples`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      farmId: farmId,
      animalId: animalId,
      sampleCode: `SIL-M66-${timestamp}`,
      silageType: 'MAIZE',
      sampleDate: '2026-09-27',
      source: 'North Pit Trench',
      notes: 'Bunker pit after 65 days fermentation',
    }),
  });
  assert(silageSampleRes.status === 201, 'Create Silage Sample returns 201', silageSampleRes.status);
  const silageSample = await silageSampleRes.json();
  const silageSampleId = silageSample.id;

  // 7. Upload Image to Feed Sample
  const fakeJpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]);
  const feedFormData = new FormData();
  feedFormData.append('file', new Blob([fakeJpegBytes], { type: 'image/jpeg' }), 'pellet_sample.jpg');
  feedFormData.append('caption', 'Visual inspection: surface texture check');

  const uploadFeedRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: feedFormData,
  });
  assert(uploadFeedRes.status === 201, 'Upload Image to Feed Sample returns 201', uploadFeedRes.status);
  const feedImage = await uploadFeedRes.json();
  const feedImageId = feedImage.id;
  assert(feedImage.sampleType === 'FEED', 'Feed image sampleType is FEED');
  assert(feedImage.sampleId === feedSampleId, 'Feed image sampleId matches');
  assert(feedImage.originalFilename === 'pellet_sample.jpg', 'Original filename preserved');
  assert(feedImage.caption === 'Visual inspection: surface texture check', 'Caption stored correctly');
  assert(!!feedImage.fileReference, 'File reference generated');

  // 8. List Images for Feed Sample
  const listFeedImagesRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    headers: headersA,
  });
  assert(listFeedImagesRes.status === 200, 'GET /api/feed-samples/:id/images returns 200');
  const feedImagesList = await listFeedImagesRes.json();
  assert(Array.isArray(feedImagesList) && feedImagesList.length === 1, 'Feed image list has 1 item');
  assert(feedImagesList[0].id === feedImageId, 'Feed image ID verified in list');

  // 9. Get Feed Image Metadata by ID
  const getFeedImageRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images/${feedImageId}`, {
    headers: headersA,
  });
  assert(getFeedImageRes.status === 200, 'GET /api/feed-samples/:id/images/:imageId returns 200');
  const singleFeedImage = await getFeedImageRes.json();
  assert(singleFeedImage.id === feedImageId, 'Retrieved single feed image metadata correctly');

  // 10. Stream / Download Feed Image File
  const streamFeedImageRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images/${feedImageId}/file`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(streamFeedImageRes.status === 200, 'GET /api/feed-samples/:id/images/:imageId/file returns 200');
  assert(streamFeedImageRes.headers.get('content-type')?.includes('image/jpeg'), 'Streamed file has image/jpeg Content-Type');
  const streamedBytes = await streamFeedImageRes.arrayBuffer();
  assert(streamedBytes.byteLength > 0, 'Streamed image file has binary content');

  // 11. Upload Image to Silage Sample
  const fakePngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
  const silageFormData = new FormData();
  silageFormData.append('file', new Blob([fakePngBytes], { type: 'image/png' }), 'silage_fermentation.png');
  silageFormData.append('caption', 'Silage pit layer 2 photo');

  const uploadSilageRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSampleId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: silageFormData,
  });
  assert(uploadSilageRes.status === 201, 'Upload Image to Silage Sample returns 201', uploadSilageRes.status);
  const silageImage = await uploadSilageRes.json();
  const silageImageId = silageImage.id;
  assert(silageImage.sampleType === 'SILAGE', 'Silage image sampleType is SILAGE');
  assert(silageImage.sampleId === silageSampleId, 'Silage image sampleId matches');

  // 12. List Images for Silage Sample
  const listSilageImagesRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSampleId}/images`, {
    headers: headersA,
  });
  assert(listSilageImagesRes.status === 200, 'GET /api/silage-samples/:id/images returns 200');
  const silageImagesList = await listSilageImagesRes.json();
  assert(silageImagesList.length === 1, 'Silage image list has 1 item');

  // 13. Stream Silage Image File
  const streamSilageRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSampleId}/images/${silageImageId}/file`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(streamSilageRes.status === 200, 'GET /api/silage-samples/:id/images/:imageId/file returns 200');
  assert(streamSilageRes.headers.get('content-type')?.includes('image/png'), 'Streamed file has image/png Content-Type');

  // 14. Delete Feed Image
  const deleteFeedRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images/${feedImageId}`, {
    method: 'DELETE',
    headers: headersA,
  });
  assert(deleteFeedRes.status === 204, 'DELETE /api/feed-samples/:id/images/:imageId returns 204 No Content', deleteFeedRes.status);

  // 15. Verify Feed Image Deleted
  const verifyFeedDeletedRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    headers: headersA,
  });
  const feedDeletedList = await verifyFeedDeletedRes.json();
  assert(feedDeletedList.length === 0, 'Feed sample image list is now empty');

  // 16. Delete Silage Image
  const deleteSilageRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSampleId}/images/${silageImageId}`, {
    method: 'DELETE',
    headers: headersA,
  });
  assert(deleteSilageRes.status === 204, 'DELETE /api/silage-samples/:id/images/:imageId returns 204 No Content', deleteSilageRes.status);

  // 17. Verify Silage Image Deleted
  const verifySilageDeletedRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSampleId}/images`, {
    headers: headersA,
  });
  const silageDeletedList = await verifySilageDeletedRes.json();
  assert(silageDeletedList.length === 0, 'Silage sample image list is now empty');

  // 18. Security Test: Unauthorized Upload (no JWT) -> 401
  const unauthUploadRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    method: 'POST',
    body: feedFormData,
  });
  assert(unauthUploadRes.status === 401, 'Unauthorized image upload rejected with 401', unauthUploadRes.status);

  // 19. Security Test: Cross-User Upload (Farmer B uploading to Farmer A's feed sample) -> 403 Forbidden
  const crossUserUploadRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: feedFormData,
  });
  assert(crossUserUploadRes.status === 403, 'Cross-user image upload rejected with 403 Forbidden', crossUserUploadRes.status);

  // 20. Security Test: Cross-User List Retrieval (Farmer B listing Farmer A's silage images) -> 403 Forbidden
  const crossUserListRes = await fetch(`${BASE_URL}/api/silage-samples/${silageSampleId}/images`, {
    headers: headersB,
  });
  assert(crossUserListRes.status === 403, 'Cross-user image list rejected with 403 Forbidden', crossUserListRes.status);

  // 21. Validation Test: Missing Sample ID -> 404 Not Found
  const notFoundUploadRes = await fetch(`${BASE_URL}/api/feed-samples/999999/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: feedFormData,
  });
  assert(notFoundUploadRes.status === 404, 'Image upload for nonexistent sample returns 404', notFoundUploadRes.status);

  // 22. Validation Test: Invalid Content Type (e.g. text/plain) -> 400 Bad Request
  const textFormData = new FormData();
  textFormData.append('file', new Blob(['hello plain text'], { type: 'text/plain' }), 'document.txt');
  const invalidTypeRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: textFormData,
  });
  assert(invalidTypeRes.status === 400, 'Invalid file content type rejected with 400 Bad Request', invalidTypeRes.status);

  // 23. Validation Test: Empty File Upload -> 400 Bad Request
  const emptyFormData = new FormData();
  emptyFormData.append('file', new Blob([], { type: 'image/jpeg' }), 'empty.jpg');
  const emptyFileRes = await fetch(`${BASE_URL}/api/feed-samples/${feedSampleId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: emptyFormData,
  });
  assert(emptyFileRes.status === 400, 'Empty image file upload rejected with 400 Bad Request', emptyFileRes.status);

  // Clean up farm
  await fetch(`${BASE_URL}/api/farms/${farmId}`, {
    method: 'DELETE',
    headers: headersA,
  });

  console.log('\n===============================================================');
  console.log('M6.6 LIVE BACKEND VERIFICATION COMPLETE:');
  console.log(`Passed: ${passedSteps}/${totalSteps}`);
  console.log(`Failed: ${failedSteps}/${totalSteps}`);
  console.log('===============================================================');

  if (failedSteps > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
