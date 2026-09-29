package com.cattlefeedai.api.exception;

/**
 * Thrown when a registration attempt uses an email that already exists.
 */
public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String message) {
        super(message);
    }
}
