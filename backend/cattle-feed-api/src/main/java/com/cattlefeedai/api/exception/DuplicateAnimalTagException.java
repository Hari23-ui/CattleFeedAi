package com.cattlefeedai.api.exception;

/**
 * Exception thrown when an animal tag already exists within the same farm (HTTP 409).
 */
public class DuplicateAnimalTagException extends RuntimeException {

    public DuplicateAnimalTagException(String message) {
        super(message);
    }
}
