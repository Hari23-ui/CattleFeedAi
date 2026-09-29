import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config';
import { AppApiError } from '../models/api';
import { getToken } from '../storage/tokenStorage';
import { parseApiError } from '../utils/errorHandler';

/**
 * CattleFeedAI Centralized API Client
 *
 * Lightweight, robust HTTP client based on native fetch.
 * Features:
 * - Centralized API_BASE_URL resolution (platform-aware)
 * - Automatic Authorization: Bearer <JWT> injection
 * - Configurable request timeout via AbortController
 * - Unified AppApiError parsing with farmer-friendly messages
 * - Unauthorized (401) interception
 */

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

type UnauthorizedHandler = () => void;
let unauthorizedListener: UnauthorizedHandler | null = null;

export const setOnUnauthorizedListener = (handler: UnauthorizedHandler | null): void => {
  unauthorizedListener = handler;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public setBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async buildHeaders(options?: RequestOptions): Promise<Headers> {
    const headers = new Headers(options?.headers);

    if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (!options?.skipAuth) {
      const token = await getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path);
    const timeout = options.timeoutMs ?? API_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers = await this.buildHeaders(options);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP error responses
      if (!response.ok) {
        if (response.status === 401 && !options.skipAuth && unauthorizedListener) {
          unauthorizedListener();
        }
        const error = await parseApiError(response);
        throw error;
      }

      // Check if response has content
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || response.status === 204) {
        return {} as T;
      }

      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      return JSON.parse(text) as T;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof AppApiError) {
        throw error;
      }

      // Handle fetch timeout / abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppApiError({
          message: 'The request timed out. Please check your internet connection.',
          isTimeout: true,
          errorType: 'TIMEOUT_ERROR',
        });
      }

      // Handle network failure (server down, no connection)
      const message =
        error instanceof Error ? error.message : 'Network request failed';

      throw new AppApiError({
        message,
        isNetworkError: true,
        errorType: 'NETWORK_ERROR',
      });
    }
  }

  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public postForm<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }

  public put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
