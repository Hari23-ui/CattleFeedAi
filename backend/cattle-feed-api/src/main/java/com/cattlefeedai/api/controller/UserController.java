package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.UpdateProfileRequest;
import com.cattlefeedai.api.dto.UserResponse;
import com.cattlefeedai.api.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authenticated user profile operations.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "2. User Profile", description = "Current authenticated user profile management")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/users/me - Get current user profile.
     */
    @Operation(summary = "Get current user profile", description = "Retrieves profile details of the authenticated caller.")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUserProfile() {
        UserResponse response = userService.getCurrentUserProfile();
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/users/me - Update editable profile fields.
     */
    @Operation(summary = "Update profile", description = "Updates editable profile fields (username, phone, language) for authenticated caller.")
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUserProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateCurrentUserProfile(request);
        return ResponseEntity.ok(response);
    }
}
