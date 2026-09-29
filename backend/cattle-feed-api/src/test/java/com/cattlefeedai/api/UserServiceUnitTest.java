package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.UpdateProfileRequest;
import com.cattlefeedai.api.dto.UserResponse;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.UserRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    private TestSecurityUtils securityUtils;
    private UserService userService;
    private User testUser;

    static class TestSecurityUtils extends SecurityUtils {
        private User currentUser;

        public TestSecurityUtils(User user) {
            super(null);
            this.currentUser = user;
        }

        public void setCurrentUser(User user) {
            this.currentUser = user;
        }

        @Override
        public User getCurrentUser() {
            if (currentUser == null) {
                throw new ResourceOwnershipException("User is not authenticated");
            }
            return this.currentUser;
        }
    }

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setUsername("testfarmer");
        testUser.setEmail("farmer@example.com");
        testUser.setPhone("+91-9876543210");
        testUser.setRole(Role.FARMER);
        testUser.setLanguage("en");
        testUser.setIsActive(true);

        securityUtils = new TestSecurityUtils(testUser);
        userService = new UserService(userRepository, securityUtils);
    }

    @Test
    @DisplayName("getCurrentUserProfile should return authenticated user profile")
    void testGetCurrentUserProfile() {
        UserResponse response = userService.getCurrentUserProfile();

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getUsername()).isEqualTo("testfarmer");
        assertThat(response.getEmail()).isEqualTo("farmer@example.com");
        assertThat(response.getPhone()).isEqualTo("+91-9876543210");
        assertThat(response.getRole()).isEqualTo("FARMER");
    }

    @Test
    @DisplayName("updateCurrentUserProfile should update editable fields and preserve sensitive fields")
    void testUpdateCurrentUserProfile() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setUsername("updated_farmer");
        request.setPhone("+91-9988776655");
        request.setLanguage("hi");

        UserResponse response = userService.updateCurrentUserProfile(request);

        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("updated_farmer");
        assertThat(response.getPhone()).isEqualTo("+91-9988776655");
        assertThat(response.getLanguage()).isEqualTo("hi");

        // Verify sensitive fields remained untouched
        assertThat(testUser.getId()).isEqualTo(10L);
        assertThat(testUser.getEmail()).isEqualTo("farmer@example.com");
        assertThat(testUser.getRole()).isEqualTo(Role.FARMER);
        assertThat(testUser.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("updateCurrentUserProfile should reject duplicate username")
    void testUpdateCurrentUserProfileDuplicateUsername() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByUsername("taken_user")).thenReturn(true);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setUsername("taken_user");

        assertThatThrownBy(() -> userService.updateCurrentUserProfile(request))
                .isInstanceOf(com.cattlefeedai.api.exception.DuplicateUsernameException.class)
                .hasMessageContaining("Username 'taken_user' is already taken");
    }
}
