package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.Severity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {

    private Long id;
    private String title;
    private String message;
    private AlertType alertType;
    private Severity severity;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private Long userId;
    private String relatedEntityType;
    private Long relatedEntityId;

    public static AlertResponse fromEntity(Alert alert) {
        if (alert == null) {
            return null;
        }
        return AlertResponse.builder()
                .id(alert.getId())
                .title(alert.getTitle())
                .message(alert.getMessage())
                .alertType(alert.getAlertType())
                .severity(alert.getSeverity())
                .isRead(alert.getIsRead())
                .createdAt(alert.getCreatedAt())
                .userId(alert.getUser() != null ? alert.getUser().getId() : null)
                .relatedEntityType(alert.getRelatedEntityType())
                .relatedEntityId(alert.getRelatedEntityId())
                .build();
    }
}
