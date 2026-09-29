package com.cattlefeedai.api.exception;

/**
 * Thrown when a registration attempt uses a username that already exists.
 */
public class DuplicateUsernameException extends RuntimeException {

    public DuplicateUsernameException(String message) {
        super(message);
    }
}
