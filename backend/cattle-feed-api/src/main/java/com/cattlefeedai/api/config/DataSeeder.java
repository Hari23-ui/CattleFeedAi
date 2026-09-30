package com.cattlefeedai.api.config;

import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default farmer account on initial startup if not already present.
 * Ensures the application is immediately usable without requiring manual DB inserts.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("farmer@dairyfarm.com")) {
            User demoFarmer = new User();
            demoFarmer.setUsername("demo_farmer");
            demoFarmer.setEmail("farmer@dairyfarm.com");
            demoFarmer.setPasswordHash(passwordEncoder.encode("Password123!"));
            demoFarmer.setRole(Role.FARMER);
            demoFarmer.setPhone("+919876543210");
            demoFarmer.setLanguage("en");
            demoFarmer.setIsActive(true);
            userRepository.save(demoFarmer);
            log.info("Default demo farmer account seeded: farmer@dairyfarm.com / Password123!");
        }
    }
}
