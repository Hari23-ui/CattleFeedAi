import {
  clearAuthentication,
  getToken,
  getUser,
  removeToken,
  saveToken,
  saveUser,
} from '../storage/tokenStorage';

describe('Token Storage Abstraction', () => {
  beforeEach(async () => {
    await clearAuthentication();
  });

  it('should return null when no token is stored', async () => {
    const token = await getToken();
    expect(token).toBeNull();
  });

  it('should save and retrieve JWT token correctly', async () => {
    const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken';
    await saveToken(mockJwt);

    const retrieved = await getToken();
    expect(retrieved).toBe(mockJwt);
  });

  it('should remove token successfully', async () => {
    await saveToken('token-to-delete');
    expect(await getToken()).toBe('token-to-delete');

    await removeToken();
    expect(await getToken()).toBeNull();
  });

  it('should save and retrieve user metadata correctly without passwords', async () => {
    const mockUser = {
      email: 'farmer@greenpastures.com',
      role: 'FARMER',
      username: 'green_pastures',
    };

    await saveUser(mockUser);
    const retrieved = await getUser();

    expect(retrieved).toEqual(mockUser);
    expect((retrieved as any)?.password).toBeUndefined();
  });

  it('should clear all authentication data on clearAuthentication()', async () => {
    await saveToken('sample-jwt-token');
    await saveUser({ email: 'farmer@test.com', role: 'FARMER' });

    expect(await getToken()).toBeTruthy();
    expect(await getUser()).toBeTruthy();

    await clearAuthentication();

    expect(await getToken()).toBeNull();
    expect(await getUser()).toBeNull();
  });
});
