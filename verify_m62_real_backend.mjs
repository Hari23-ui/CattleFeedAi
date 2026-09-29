// verify_m62_real_backend.mjs
// Runs live manual testing sequence against real Spring Boot backend on http://localhost:8080

const BASE_URL = 'http://localhost:8080';

const log = (step, msg, data = null) => {
  console.log(`\n=== STEP ${step}: ${msg} ===`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

async function run() {
  const timestamp = Date.now();
  const testEmail = `farmer_m62_${timestamp}@dairytest.com`;
  const testPassword = 'Password123!';
  const testUsername = `farmer_${timestamp}`;

  // 1. Register & Login
  log(1, 'Registering and Logging in farmer');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      phone: '+91 9876543210',
      language: 'en',
    }),
  });

  if (!regRes.ok) {
    throw new Error(`Registration failed: ${regRes.status} ${await regRes.text()}`);
  }
  const regData = await regRes.json();
  const token = regData.token;
  log(1, 'Farmer authenticated with JWT token', { email: regData.email, role: regData.role });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Dashboard initial state: Get all farms & animals
  log(2, 'Dashboard: Fetch live counts for new farmer');
  const initialFarmsRes = await fetch(`${BASE_URL}/api/farms`, { headers: authHeaders });
  const initialFarms = await initialFarmsRes.json();
  const initialAnimalsRes = await fetch(`${BASE_URL}/api/animals`, { headers: authHeaders });
  const initialAnimals = await initialAnimalsRes.json();
  log(2, 'Initial counts verified', { farmCount: initialFarms.length, animalCount: initialAnimals.length });
  if (initialFarms.length !== 0 || initialAnimals.length !== 0) {
    throw new Error('Expected 0 farms and 0 animals for new user');
  }

  // 3 & 4. Open My Farms & Create Farm
  log(3, 'Create first farm (POST /api/farms)');
  const farm1Res = await fetch(`${BASE_URL}/api/farms`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmName: 'Amul Heritage Dairy',
      location: 'Plot 10, Anand-Kheda Highway',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388001',
    }),
  });
  if (!farm1Res.ok) throw new Error(`Farm creation failed: ${farm1Res.status} ${await farm1Res.text()}`);
  const farm1 = await farm1Res.json();
  log(4, 'Farm created successfully', farm1);

  // 5. Verify farm appears in farm list
  log(5, 'Verify farm in farm list (GET /api/farms)');
  const list1Res = await fetch(`${BASE_URL}/api/farms`, { headers: authHeaders });
  const list1 = await list1Res.json();
  log(5, 'Farm list count', { totalFarms: list1.length, firstFarm: list1[0].farmName });
  if (list1.length !== 1 || list1[0].id !== farm1.id) throw new Error('Farm list verification failed');

  // 6. Open farm details
  log(6, 'Open farm details (GET /api/farms/:id)');
  const details1Res = await fetch(`${BASE_URL}/api/farms/${farm1.id}`, { headers: authHeaders });
  const details1 = await details1Res.json();
  log(6, 'Farm details loaded', details1);
  if (details1.farmName !== 'Amul Heritage Dairy') throw new Error('Farm details mismatch');

  // 7. Edit farm
  log(7, 'Edit farm (PUT /api/farms/:id)');
  const editFarmRes = await fetch(`${BASE_URL}/api/farms/${farm1.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      farmName: 'Amul Heritage Dairy & Research Center',
      location: 'Plot 10, Anand-Kheda Highway, Anand',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388002',
    }),
  });
  if (!editFarmRes.ok) throw new Error(`Edit farm failed: ${editFarmRes.status} ${await editFarmRes.text()}`);
  const editedFarm = await editFarmRes.json();
  log(7, 'Farm edited successfully', editedFarm);
  if (editedFarm.farmName !== 'Amul Heritage Dairy & Research Center') throw new Error('Farm edit failed');

  // 8. Refresh farm
  log(8, 'Refresh farm details (GET /api/farms/:id)');
  const refreshedFarmRes = await fetch(`${BASE_URL}/api/farms/${farm1.id}`, { headers: authHeaders });
  const refreshedFarm = await refreshedFarmRes.json();
  log(8, 'Refreshed farm verified', refreshedFarm);
  if (refreshedFarm.pincode !== '388002') throw new Error('Refresh verification failed');

  // 9. Delete farm
  log(9, 'Delete farm (DELETE /api/farms/:id)');
  const deleteFarmRes = await fetch(`${BASE_URL}/api/farms/${farm1.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (deleteFarmRes.status !== 204) throw new Error(`Delete farm expected 204, got ${deleteFarmRes.status}`);
  log(9, 'Farm deleted with status 204 NO CONTENT');

  const afterDeleteRes = await fetch(`${BASE_URL}/api/farms/${farm1.id}`, { headers: authHeaders });
  if (afterDeleteRes.status !== 404) throw new Error(`Expected 404 after farm deletion, got ${afterDeleteRes.status}`);
  log(9, 'Verified farm no longer exists (404 Not Found)');

  // 10. Create another farm for animals testing
  log(10, 'Create another farm for livestock testing');
  const farm2Res = await fetch(`${BASE_URL}/api/farms`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmName: 'Gokul Dairy Farm',
      location: 'Village Mehsana Rural',
      district: 'Mehsana',
      state: 'Gujarat',
      pincode: '384001',
    }),
  });
  const farm2 = await farm2Res.json();
  log(10, 'New farm created', farm2);

  // 11 & 12. Open My Animals & Create Animal
  log(11, 'Create an animal (POST /api/animals)');
  const animal1Res = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmId: farm2.id,
      animalTag: 'TAG-GJ-001',
      name: 'Surabhi',
      breed: 'Gir',
      gender: 'FEMALE',
      dateOfBirth: '2022-06-15',
      weight: 430.5,
      lactationStage: 'MID',
      daysInMilk: 110,
      milkProductionPerDay: 19.5,
      pregnancyStatus: 'PREGNANT',
      feedIntakeStatus: 'NORMAL',
    }),
  });
  if (!animal1Res.ok) throw new Error(`Animal creation failed: ${animal1Res.status} ${await animal1Res.text()}`);
  const animal1 = await animal1Res.json();
  log(12, 'Animal created successfully', animal1);

  // 13. Verify animal appears
  log(13, 'Verify animal appears in animal list (GET /api/animals)');
  const animalsListRes = await fetch(`${BASE_URL}/api/animals`, { headers: authHeaders });
  const animalsList = await animalsListRes.json();
  log(13, 'Animal list fetched', { count: animalsList.length, tag: animalsList[0].animalTag });
  if (animalsList.length !== 1 || animalsList[0].id !== animal1.id) throw new Error('Animal list verification failed');

  // Verify farm filtered animals: GET /api/animals?farmId=X
  const farmAnimalsRes = await fetch(`${BASE_URL}/api/animals?farmId=${farm2.id}`, { headers: authHeaders });
  const farmAnimals = await farmAnimalsRes.json();
  log(13, 'Farm animals filter verified', { farmId: farm2.id, count: farmAnimals.length });
  if (farmAnimals.length !== 1) throw new Error('Filtered animal list mismatch');

  // 14. Open animal details
  log(14, 'Open animal details (GET /api/animals/:id)');
  const animalDetailsRes = await fetch(`${BASE_URL}/api/animals/${animal1.id}`, { headers: authHeaders });
  const animalDetails = await animalDetailsRes.json();
  log(14, 'Animal details loaded', animalDetails);
  if (animalDetails.animalTag !== 'TAG-GJ-001') throw new Error('Animal details tag mismatch');

  // 15. Edit animal
  log(15, 'Edit animal profile (PUT /api/animals/:id)');
  const editAnimalRes = await fetch(`${BASE_URL}/api/animals/${animal1.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      farmId: farm2.id,
      animalTag: 'TAG-GJ-001',
      name: 'Surabhi Champion',
      breed: 'Gir Purebred',
      gender: 'FEMALE',
      dateOfBirth: '2022-06-15',
      weight: 445.0,
      lactationStage: 'MID',
      daysInMilk: 125,
      milkProductionPerDay: 21.0,
      pregnancyStatus: 'PREGNANT',
      feedIntakeStatus: 'INCREASED',
    }),
  });
  if (!editAnimalRes.ok) throw new Error(`Edit animal failed: ${editAnimalRes.status} ${await editAnimalRes.text()}`);
  const editedAnimal = await editAnimalRes.json();
  log(15, 'Animal edited successfully', editedAnimal);
  if (editedAnimal.name !== 'Surabhi Champion' || editedAnimal.milkProductionPerDay !== 21.0) {
    throw new Error('Edited animal values mismatch');
  }

  // 16. Test duplicate animal tag
  log(16, 'Test duplicate animal tag in same farm (Expect 409 Conflict)');
  const dupRes = await fetch(`${BASE_URL}/api/animals`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      farmId: farm2.id,
      animalTag: 'TAG-GJ-001', // Duplicate tag in farm2
      gender: 'FEMALE',
    }),
  });
  const dupBody = await dupRes.json();
  log(16, `Duplicate response status: ${dupRes.status}`, dupBody);
  if (dupRes.status !== 409) throw new Error(`Expected 409 for duplicate animal tag, got ${dupRes.status}`);
  if (!dupBody.message.includes('already exists')) throw new Error('Expected duplicate tag message');

  // 17. Delete animal
  log(17, 'Delete animal (DELETE /api/animals/:id)');
  const deleteAnimalRes = await fetch(`${BASE_URL}/api/animals/${animal1.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (deleteAnimalRes.status !== 204) throw new Error(`Expected 204, got ${deleteAnimalRes.status}`);
  log(17, 'Animal deleted with status 204 NO CONTENT');

  const afterDeleteAnimalRes = await fetch(`${BASE_URL}/api/animals/${animal1.id}`, { headers: authHeaders });
  if (afterDeleteAnimalRes.status !== 404) throw new Error(`Expected 404 after animal deletion, got ${afterDeleteAnimalRes.status}`);
  log(17, 'Verified animal no longer exists (404 Not Found)');

  // 18. Test unauthorized / session expired
  log(18, 'Test unauthorized request without token (Expect 401)');
  const unauthRes = await fetch(`${BASE_URL}/api/farms`, {
    headers: { 'Content-Type': 'application/json' },
  });
  log(18, `Unauthorized request status: ${unauthRes.status}`);
  if (unauthRes.status !== 401 && unauthRes.status !== 403) {
    throw new Error(`Expected 401 or 403 for missing token, got ${unauthRes.status}`);
  }

  // Cleanup: Delete farm2
  await fetch(`${BASE_URL}/api/farms/${farm2.id}`, { method: 'DELETE', headers: authHeaders });
  log(18, 'Cleaned up test farm2');

  console.log('\n======================================================');
  console.log('✅ ALL 18 MANUAL TEST STEPS PASSED AGAINST REAL BACKEND!');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
