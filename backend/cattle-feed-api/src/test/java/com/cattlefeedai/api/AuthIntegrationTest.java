package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.AuthResponse;
import com.cattlefeedai.api.dto.LoginRequest;
import com.cattlefeedai.api.dto.RegisterRequest;
import com.cattlefeedai.api.repository.UserRepository;
import com.cattlefeedai.api.service.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AuthIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    private static final String TEST_EMAIL = "auth_test_farmer@example.com";

    @AfterEach
    void tearDown() {
        userRepository.findByEmail(TEST_EMAIL).ifPresent(userRepository::delete);
    }

    @Test
    void testRegisterAndLogin() {
        userRepository.findByEmail(TEST_EMAIL).ifPresent(userRepository::delete);

        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setUsername("testfarmer");
        registerReq.setEmail(TEST_EMAIL);
        registerReq.setPassword("Password123!");

        AuthResponse regResponse = authService.register(registerReq);
        assertNotNull(regResponse);
        assertNotNull(regResponse.getToken());
        assertEquals(TEST_EMAIL, regResponse.getEmail());

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail(TEST_EMAIL);
        loginReq.setPassword("Password123!");

        AuthResponse loginResponse = authService.login(loginReq);
        assertNotNull(loginResponse);
        assertNotNull(loginResponse.getToken());
        assertEquals(TEST_EMAIL, loginResponse.getEmail());
    }
}
