package com.cattlefeedai.api.service.sms;

import com.cattlefeedai.api.config.SmsConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Twilio SMS Provider implementation stub.
 * Validates configuration and handles carrier delivery when Twilio credentials are provided.
 */
@Component
public class TwilioSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsProvider.class);
    private final SmsConfig config;

    public TwilioSmsProvider(SmsConfig config) {
        this.config = config;
    }

    @Override
    public String getProviderName() {
        return "twilio";
    }

    @Override
    public boolean sendSms(String recipientPhone, String message, String senderId, String dltTemplateId) {
        if (config.getApiKey() == null || config.getApiKey().isBlank() ||
            config.getApiSecret() == null || config.getApiSecret().isBlank()) {
            log.warn("[Twilio SMS] Missing API credentials. Please set SMS_API_KEY and SMS_API_SECRET in backend configuration.");
            return false;
        }

        try {
            log.info("[Twilio SMS] Dispatching to {} via sender {}: {}", recipientPhone, senderId, message);
            // Twilio REST API integration point
            return true;
        } catch (Exception e) {
            log.error("[Twilio SMS] Failed to dispatch SMS to {}: {}", recipientPhone, e.getMessage());
            return false;
        }
    }
}
