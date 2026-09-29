import { AppApiError, BackendErrorResponse } from '../models/api';

/**
 * Farmer-Friendly Error Handler
 *
 * Translates HTTP status codes, backend exceptions, and network errors
 * into clear, jargon-free messages suitable for farmers in the field.
 */

export const getFarmerFriendlyErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle AppApiError instances
  if (error instanceof AppApiError) {
    if (error.isTimeout) {
      return 'The request timed out. Please check your network connection and try again.';
    }

    if (error.isNetworkError) {
      return 'Unable to connect to CattleFeedAI. Please check your internet connection and try again.';
    }

    switch (error.status) {
      case 400:
        // If the backend provided a clear message or field errors, use it if appropriate
        if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
          const firstFieldMsg = Object.values(error.fieldErrors)[0];
          return firstFieldMsg || 'Please check the information you entered and try again.';
        }
        return error.message || 'Please check the information you entered and try again.';

      case 401:
        // Distinguish login failure vs session expiry if possible
        if (error.message && error.message.toLowerCase().includes('bad credentials')) {
          return 'Incorrect email or password. Please verify and try again.';
        }
        return 'Your session has expired. Please log in again.';

      case 403:
        if (error.message && (error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('access denied'))) {
          return error.message;
        }
        return 'You do not have permission to perform this action.';

      case 404:
        if (error.message && (error.message.toLowerCase().includes('farm not found') || error.message.toLowerCase().includes('animal not found') || error.message.toLowerCase().includes('not found'))) {
          return error.message;
        }
        return 'The requested record or resource was not found.';

      case 409:
        if (error.message && error.message.toLowerCase().includes('email')) {
          return 'An account with this email address already exists.';
        }
        if (error.message && error.message.toLowerCase().includes('username')) {
          return 'This username is already taken. Please choose another.';
        }
        if (
          error.message &&
          (error.message.toLowerCase().includes('tag') ||
            error.message.toLowerCase().includes('sample') ||
            error.message.toLowerCase().includes('code'))
        ) {
          return error.message;
        }
        return error.message || 'A conflicting record already exists in the system.';

      case 500:
      case 502:
      case 503:
      case 504:
        return 'The server encountered an error. Our team has been notified. Please try again shortly.';

      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Standard JavaScript Error
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return 'The request timed out. Please check your connection and try again.';
    }
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      return 'Unable to connect to CattleFeedAI. Please check your internet connection and try again.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  // Fallback for non-standard error throws
  return String(error) || 'An unexpected error occurred. Please try again.';
};

/**
 * Safely parse error from fetch Response or caught exception
 */
export const parseApiError = async (response: Response): Promise<AppApiError> => {
  let backendError: BackendErrorResponse | null = null;
  let rawBody = '';

  try {
    rawBody = await response.text();
    if (rawBody) {
      backendError = JSON.parse(rawBody) as BackendErrorResponse;
    }
  } catch {
    // Response was not JSON
  }

  const status = response.status;
  const message = backendError?.message || response.statusText || `Request failed with status ${status}`;
  const errorType = backendError?.error || 'HTTP_ERROR';
  const fieldErrors = backendError?.fieldErrors;

  if (__DEV__) {
    // Log development debugging details without leaking auth tokens
    console.warn(`[API Error ${status}]:`, {
      status,
      errorType,
      message,
      fieldErrors,
    });
  }

  return new AppApiError({
    message,
    status,
    errorType,
    fieldErrors,
    isNetworkError: false,
    isTimeout: false,
  });
};
