package com.cattlefeedai.api.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request payload for updating editable farmer profile attributes.
 * NEVER allows editing id, role, passwordHash, authorities, or system timestamps.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(max = 50, message = "Username must not exceed 50 characters")
    private String username;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @Size(max = 10, message = "Language code must not exceed 10 characters")
    private String language;
}
