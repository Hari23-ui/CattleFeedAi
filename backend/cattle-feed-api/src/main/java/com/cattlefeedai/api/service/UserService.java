package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.UpdateProfileRequest;
import com.cattlefeedai.api.dto.UserResponse;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.exception.DuplicateUsernameException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.repository.UserRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user profile details.
 * Ensures security: id, role, password, and system timestamps cannot be altered.
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public UserService(UserRepository userRepository, SecurityUtils securityUtils) {
        this.userRepository = userRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Retrieve the current authenticated caller's profile.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        User currentUser = securityUtils.getCurrentUser();
        return UserResponse.fromEntity(currentUser);
    }

    /**
     * Update permitted profile fields for the authenticated caller.
     */
    public UserResponse updateCurrentUserProfile(UpdateProfileRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new DuplicateUsernameException("Username '" + request.getUsername() + "' is already taken");
            }
            user.setUsername(request.getUsername().trim());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getLanguage() != null) {
            user.setLanguage(request.getLanguage().trim());
        }

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
}
