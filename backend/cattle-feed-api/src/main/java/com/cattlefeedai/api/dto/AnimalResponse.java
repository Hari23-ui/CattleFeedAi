package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.enums.FeedIntakeStatus;
import com.cattlefeedai.api.entity.enums.Gender;
import com.cattlefeedai.api.entity.enums.LactationStage;
import com.cattlefeedai.api.entity.enums.PregnancyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Safe Animal response payload.
 * Matches API response specifications without exposing unnecessary internal fields.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalResponse {

    private Long id;
    private Long farmId;
    private String animalTag;
    private String name;
    private String breed;
    private Gender gender;
    private LocalDate dateOfBirth;
    private BigDecimal weight;
    private LactationStage lactationStage;
    private Integer daysInMilk;
    private BigDecimal milkProductionPerDay;
    private PregnancyStatus pregnancyStatus;
    private FeedIntakeStatus feedIntakeStatus;

    public static AnimalResponse fromEntity(Animal animal) {
        if (animal == null) {
            return null;
        }
        return AnimalResponse.builder()
                .id(animal.getId())
                .farmId(animal.getFarm() != null ? animal.getFarm().getId() : null)
                .animalTag(animal.getAnimalTag())
                .name(animal.getName())
                .breed(animal.getBreed())
                .gender(animal.getGender())
                .dateOfBirth(animal.getDateOfBirth())
                .weight(animal.getWeight())
                .lactationStage(animal.getLactationStage())
                .daysInMilk(animal.getDaysInMilk())
                .milkProductionPerDay(animal.getMilkProductionPerDay())
                .pregnancyStatus(animal.getPregnancyStatus())
                .feedIntakeStatus(animal.getFeedIntakeStatus())
                .build();
    }
}
