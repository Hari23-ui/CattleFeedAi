import { AppApiError } from '../models/api';
import { getFarmerFriendlyErrorMessage } from '../utils/errorHandler';

describe('Error Handler Utilities', () => {
  it('should return session expired message for 401 unauthorized', () => {
    const error = new AppApiError({
      message: 'Unauthorized',
      status: 401,
    });
    expect(getFarmerFriendlyErrorMessage(error)).toBe(
      'Your session has expired. Please log in again.'
    );
  });

  it('should return bad credentials message when 401 contains bad credentials', () => {
    const error = new AppApiError({
      message: 'Bad credentials',
      status: 401,
    });
    expect(getFarmerFriendlyErrorMessage(error)).toBe(
      'Incorrect email or password. Please verify and try again.'
    );
  });

  it('should return network connection message for network failure', () => {
    const error = new AppApiError({
      message: 'Network request failed',
      isNetworkError: true,
    });
    expect(getFarmerFriendlyErrorMessage(error)).toBe(
      'Unable to connect to CattleFeedAI. Please check your internet connection and try again.'
    );
  });

  it('should return timeout message for timed out request', () => {
    const error = new AppApiError({
      message: 'Aborted',
      isTimeout: true,
    });
    expect(getFarmerFriendlyErrorMessage(error)).toBe(
      'The request timed out. Please check your network connection and try again.'
    );
  });

  it('should extract first field error from 400 validation error', () => {
    const error = new AppApiError({
      message: 'Validation failed',
      status: 400,
      fieldErrors: {
        email: 'Email must be valid',
        password: 'Password must be at least 6 characters',
      },
    });
    expect(getFarmerFriendlyErrorMessage(error)).toBe('Email must be valid');
  });

  it('should return duplicate email message on 409 conflict', () => {
    const error = new AppApiError({
      message: 'Duplicate email address registered',
      status: 409,
    });
    expect(getFarmerFriendlyErrorMessage(error)).toBe(
      'An account with this email address already exists.'
    );
  });

  it('should return friendly server error message on 500', () => {
    const error = new AppApiError({
      message: 'Internal server error: NullPointerException at line 42',
      status: 500,
    });
    // Never expose stack trace to farmer
    expect(getFarmerFriendlyErrorMessage(error)).toBe(
      'The server encountered an error. Our team has been notified. Please try again shortly.'
    );
  });
});
