package com.cattlefeedai.api.exception;

/**
 * Exception thrown when an authenticated user attempts to access or modify
 * a resource that belongs to another user (HTTP 403).
 */
public class ResourceOwnershipException extends RuntimeException {

    public ResourceOwnershipException(String message) {
        super(message);
    }
}
