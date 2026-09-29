package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.Farm;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Safe Farm response payload.
 * Matches API response specifications without exposing unnecessary internal fields.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmResponse {

    private Long id;
    private String farmName;
    private String location;
    private String district;
    private String state;
    private String pincode;

    public static FarmResponse fromEntity(Farm farm) {
        if (farm == null) {
            return null;
        }
        return FarmResponse.builder()
                .id(farm.getId())
                .farmName(farm.getFarmName())
                .location(farm.getLocation())
                .district(farm.getDistrict())
                .state(farm.getState())
                .pincode(farm.getPincode())
                .build();
    }
}
