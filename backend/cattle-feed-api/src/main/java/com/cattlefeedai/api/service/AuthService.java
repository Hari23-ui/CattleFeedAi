package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.AuthResponse;
import com.cattlefeedai.api.dto.LoginRequest;
import com.cattlefeedai.api.dto.RegisterRequest;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.exception.DuplicateEmailException;
import com.cattlefeedai.api.exception.DuplicateUsernameException;
import com.cattlefeedai.api.exception.InvalidCredentialsException;
import com.cattlefeedai.api.repository.UserRepository;
import com.cattlefeedai.api.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Authentication service handling user registration and login.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final com.cattlefeedai.api.repository.ExpertRepository expertRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            com.cattlefeedai.api.repository.ExpertRepository expertRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.expertRepository = expertRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    // ── Register ─────────────────────────────────────────────────

    /**
     * Register a new user with FARMER or EXPERT role.
     * Users cannot self-register as ADMIN.
     */
    public AuthResponse register(RegisterRequest request) {

        // Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(
                    "An account with email '" + request.getEmail() + "' already exists");
        }

        // Check for duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateUsernameException(
                    "An account with username '" + request.getUsername() + "' already exists");
        }

        Role targetRole = request.getRole() != null ? request.getRole() : Role.FARMER;
        if (targetRole == Role.ADMIN) {
            targetRole = Role.FARMER; // Users cannot self-register as ADMIN
        }

        // Create user entity
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(targetRole);
        user.setPhone(request.getPhone());
        user.setLanguage(request.getLanguage());
        user.setIsActive(true);

        // Save to database (triggers @PrePersist for timestamps)
        User savedUser = userRepository.save(user);

        // If registering as an EXPERT, create the associated Expert profile
        if (targetRole == Role.EXPERT) {
            com.cattlefeedai.api.entity.Expert expert = new com.cattlefeedai.api.entity.Expert();
            expert.setUser(savedUser);
            expert.setQualification(request.getQualification() != null && !request.getQualification().isBlank()
                    ? request.getQualification() : "Veterinarian / Animal Nutritionist");
            expert.setSpecialization(request.getSpecialization() != null
                    ? request.getSpecialization() : com.cattlefeedai.api.entity.enums.Specialization.VETERINARY);
            expert.setExperienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 5);
            expert.setLicenseNumber(request.getLicenseNumber() != null && !request.getLicenseNumber().isBlank()
                    ? request.getLicenseNumber() : "LIC-" + savedUser.getId());
            expert.setBio(request.getBio() != null ? request.getBio() : "Professional veterinary and animal nutrition expert");
            expert.setAvailabilityStatus(com.cattlefeedai.api.entity.enums.AvailabilityStatus.AVAILABLE);
            expertRepository.save(expert);
        }

        // Generate JWT for immediate login after registration
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(savedUser.getEmail())
                .password(savedUser.getPasswordHash())
                .authorities("ROLE_" + savedUser.getRole().name())
                .build();

        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .build();
    }

    // ── Login ────────────────────────────────────────────────────

    /**
     * Authenticate user with email and password, return JWT on success.
     */
    public AuthResponse login(LoginRequest request) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Fetch user entity for role information
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

            String token = jwtService.generateToken(userDetails);

            return AuthResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();

        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
    }
}
