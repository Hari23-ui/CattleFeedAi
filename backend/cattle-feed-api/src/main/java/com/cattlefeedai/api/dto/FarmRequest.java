package com.cattlefeedai.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request payload for creating or updating a Farm.
 * Does NOT accept ownerId - owner is always derived from authenticated JWT.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmRequest {

    @NotBlank(message = "Farm name is required")
    @Size(max = 100, message = "Farm name must not exceed 100 characters")
    private String farmName;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @Size(max = 100, message = "District must not exceed 100 characters")
    private String district;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Size(max = 10, message = "Pincode must not exceed 10 characters")
    private String pincode;
}
