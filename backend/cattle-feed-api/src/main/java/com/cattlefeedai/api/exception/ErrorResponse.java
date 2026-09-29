package com.cattlefeedai.api.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
public class ErrorResponse {

    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private Map<String, String> fieldErrors;

    public ErrorResponse(int status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = LocalDateTime.now();
        this.fieldErrors = null;
    }
}
