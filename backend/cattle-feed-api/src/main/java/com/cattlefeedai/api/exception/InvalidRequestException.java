package com.cattlefeedai.api.exception;

/**
 * Exception thrown when a request has invalid parameters or conflicting relationships (HTTP 400).
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
