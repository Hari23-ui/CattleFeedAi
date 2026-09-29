package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.AuthResponse;
import com.cattlefeedai.api.dto.LoginRequest;
import com.cattlefeedai.api.dto.RegisterRequest;
import com.cattlefeedai.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication endpoints.
 * All endpoints under /api/auth/ are publicly accessible (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "1. Authentication", description = "User registration, login, and JWT token issuance")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Register a new user.
     * POST /api/auth/register
     */
    @Operation(summary = "Register a new user", description = "Creates a new farmer account and returns a JWT token immediately.")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authenticate an existing user.
     * POST /api/auth/login
     */
    @Operation(summary = "Authenticate user", description = "Logs in with email/password credentials and returns a JWT access token.")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
