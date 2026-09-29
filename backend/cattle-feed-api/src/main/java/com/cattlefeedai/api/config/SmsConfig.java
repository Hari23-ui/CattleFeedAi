package com.cattlefeedai.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for the SMS notification subsystem.
 *
 * Supports India TRAI/DLT regulatory requirements:
 * - 6-character registered sender header (e.g. CTLFED)
 * - Approved DLT Principal Entity & Content Template IDs
 * - Extensible provider selection (Mock for evaluation, Twilio, AWS End User Messaging SMS)
 */
@Configuration
@ConfigurationProperties(prefix = "sms")
public class SmsConfig {

    /**
     * Master switch for SMS dispatch. Default false (disabled) to prevent unintended charges.
     */
    private boolean enabled = false;

    /**
     * Provider implementation to use: "mock", "twilio", or "aws".
     */
    private String provider = "mock";

    /**
     * Registered sender ID / header (6 alpha characters for Indian transactional SMS).
     */
    private String senderId = "CTLFED";

    /**
     * API key / Account SID.
     */
    private String apiKey = "";

    /**
     * API secret / Auth Token.
     */
    private String apiSecret = "";

    /**
     * India DLT registered Content Template ID.
     */
    private String dltTemplateId = "1107161234567890123";

    /**
     * Restrict SMS dispatches only to HIGH and CRITICAL severity events.
     */
    private boolean highPriorityOnly = true;

    /**
     * Cooldown in minutes to prevent repeated duplicate SMS dispatches.
     */
    private int cooldownMinutes = 30;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }

    public void setApiSecret(String apiSecret) {
        this.apiSecret = apiSecret;
    }

    public String getDltTemplateId() {
        return dltTemplateId;
    }

    public void setDltTemplateId(String dltTemplateId) {
        this.dltTemplateId = dltTemplateId;
    }

    public boolean isHighPriorityOnly() {
        return highPriorityOnly;
    }

    public void setHighPriorityOnly(boolean highPriorityOnly) {
        this.highPriorityOnly = highPriorityOnly;
    }

    public int getCooldownMinutes() {
        return cooldownMinutes;
    }

    public void setCooldownMinutes(int cooldownMinutes) {
        this.cooldownMinutes = cooldownMinutes;
    }
}
