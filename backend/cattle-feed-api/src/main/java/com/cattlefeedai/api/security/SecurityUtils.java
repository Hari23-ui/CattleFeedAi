package com.cattlefeedai.api.security;

import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility component to access the currently authenticated User entity
 * and perform role/ownership checks.
 */
@Component
public class SecurityUtils {

    private final UserRepository userRepository;

    public SecurityUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Retrieve the currently authenticated User entity from the database.
     *
     * @return the authenticated User
     * @throws ResourceOwnershipException if user is not authenticated
     * @throws ResourceNotFoundException if user record is missing from database
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResourceOwnershipException("User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found with email: " + email));
    }

    /**
     * Check if a user possesses the ADMIN role.
     *
     * @param user the user to check
     * @return true if user has ADMIN role
     */
    public boolean isAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }
}
