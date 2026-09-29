package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.enums.StorageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request payload for creating or updating a StorageUnit.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageUnitRequest {

    @NotNull(message = "farmId is required")
    private Long farmId;

    @NotBlank(message = "name is required")
    @Size(max = 100, message = "name must not exceed 100 characters")
    private String name;

    @NotNull(message = "storageType is required")
    private StorageType storageType;

    @Size(max = 255, message = "location must not exceed 255 characters")
    private String location;

    @Size(max = 100, message = "capacity must not exceed 100 characters")
    private String capacity;

    @Size(max = 100, message = "deviceId must not exceed 100 characters")
    private String deviceId;
}
