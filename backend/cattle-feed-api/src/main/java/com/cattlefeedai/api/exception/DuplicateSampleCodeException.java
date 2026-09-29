package com.cattlefeedai.api.exception;

/**
 * Exception thrown when a sample code already exists (HTTP 409).
 */
public class DuplicateSampleCodeException extends RuntimeException {

    public DuplicateSampleCodeException(String message) {
        super(message);
    }
}
