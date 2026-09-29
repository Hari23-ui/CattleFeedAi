package com.cattlefeedai.api.exception;

/**
 * Thrown when authentication fails due to bad credentials.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
