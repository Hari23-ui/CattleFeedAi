/**
 * API Data Models & Error Responses
 * Matches backend GlobalExceptionHandler / ErrorResponse.java
 */

export interface BackendErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
}

export class AppApiError extends Error {
  public readonly status: number;
  public readonly errorType: string;
  public readonly fieldErrors?: Record<string, string>;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(params: {
    message: string;
    status?: number;
    errorType?: string;
    fieldErrors?: Record<string, string>;
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(params.message);
    this.name = 'AppApiError';
    this.status = params.status ?? 0;
    this.errorType = params.errorType ?? 'UNKNOWN_ERROR';
    this.fieldErrors = params.fieldErrors;
    this.isNetworkError = params.isNetworkError ?? false;
    this.isTimeout = params.isTimeout ?? false;
  }
}
