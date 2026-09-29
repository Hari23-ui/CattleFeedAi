import { AuthResponse } from '../models/auth';
import { apiClient } from '../services/apiClient';
import { authService } from '../services/authService';
import { clearAuthentication, getToken, getUser } from '../storage/tokenStorage';

describe('Auth Service', () => {
  beforeEach(async () => {
    await clearAuthentication();
    jest.restoreAllMocks();
  });

  it('should log in successfully, store token and user, and return auth response', async () => {
    const mockResponse: AuthResponse = {
      token: 'jwt.sample.token',
      tokenType: 'Bearer',
      email: 'farmer@test.com',
      role: 'FARMER',
    };

    jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const result = await authService.login({
      email: 'farmer@test.com',
      password: 'Password123!',
    });

    expect(result.token).toBe('jwt.sample.token');
    expect(result.role).toBe('FARMER');

    const storedToken = await getToken();
    expect(storedToken).toBe('jwt.sample.token');

    const storedUser = await getUser();
    expect(storedUser?.email).toBe('farmer@test.com');
    expect(storedUser?.role).toBe('FARMER');
  });

  it('should register successfully, format payload, store token, and return auth response', async () => {
    const mockResponse: AuthResponse = {
      token: 'jwt.registered.token',
      tokenType: 'Bearer',
      email: 'newfarmer@test.com',
      role: 'FARMER',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const result = await authService.register({
      username: '  new_farmer  ',
      email: '  newfarmer@test.com  ',
      password: 'Password123!',
      phone: '  +1 555-1234  ',
      language: '',
    });

    expect(postSpy).toHaveBeenCalledWith(
      '/api/auth/register',
      {
        username: 'new_farmer',
        email: 'newfarmer@test.com',
        password: 'Password123!',
        phone: '+1 555-1234',
        language: 'en',
      },
      { skipAuth: true }
    );

    expect(result.token).toBe('jwt.registered.token');
    expect(await getToken()).toBe('jwt.registered.token');
  });

  it('should clear stored credentials on logout', async () => {
    const mockResponse: AuthResponse = {
      token: 'temp-token',
      tokenType: 'Bearer',
      email: 'farmer@test.com',
      role: 'FARMER',
    };
    jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    await authService.login({ email: 'farmer@test.com', password: 'pwd' });
    expect(await getToken()).toBe('temp-token');

    await authService.logout();
    expect(await getToken()).toBeNull();
    expect(await getUser()).toBeNull();
  });
});
