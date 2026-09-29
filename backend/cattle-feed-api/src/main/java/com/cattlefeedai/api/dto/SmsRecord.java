package com.cattlefeedai.api.dto;

import java.time.LocalDateTime;

/**
 * Data transfer object representing an SMS dispatch event or audit record.
 */
public class SmsRecord {

    private String id;
    private String recipientPhone;
    private String senderId;
    private String message;
    private String provider;
    private String status; // "SENT", "FAILED", "MOCK_DELIVERED", "DISABLED"
    private LocalDateTime timestamp;
    private String dltTemplateId;
    private Long alertId;

    public SmsRecord() {
    }

    public SmsRecord(String id, String recipientPhone, String senderId, String message, String provider, String status, LocalDateTime timestamp, String dltTemplateId, Long alertId) {
        this.id = id;
        this.recipientPhone = recipientPhone;
        this.senderId = senderId;
        this.message = message;
        this.provider = provider;
        this.status = status;
        this.timestamp = timestamp;
        this.dltTemplateId = dltTemplateId;
        this.alertId = alertId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDltTemplateId() {
        return dltTemplateId;
    }

    public void setDltTemplateId(String dltTemplateId) {
        this.dltTemplateId = dltTemplateId;
    }

    public Long getAlertId() {
        return alertId;
    }

    public void setAlertId(Long alertId) {
        this.alertId = alertId;
    }
}
