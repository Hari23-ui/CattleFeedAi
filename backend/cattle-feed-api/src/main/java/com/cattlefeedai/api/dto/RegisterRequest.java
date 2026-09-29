package com.cattlefeedai.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @Size(max = 10, message = "Language must not exceed 10 characters")
    private String language;

    private com.cattlefeedai.api.entity.enums.Role role;

    @Size(max = 200, message = "Qualification must not exceed 200 characters")
    private String qualification;

    private com.cattlefeedai.api.entity.enums.Specialization specialization;

    private Integer experienceYears;

    @Size(max = 50, message = "License number must not exceed 50 characters")
    private String licenseNumber;

    private String bio;
}
