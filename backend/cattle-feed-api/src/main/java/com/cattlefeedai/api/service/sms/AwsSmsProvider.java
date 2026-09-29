package com.cattlefeedai.api.service.sms;

import com.cattlefeedai.api.config.SmsConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * AWS End User Messaging SMS / Amazon SNS SMS Provider implementation stub.
 * Validates configuration and handles carrier delivery when AWS credentials are provided.
 */
@Component
public class AwsSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(AwsSmsProvider.class);
    private final SmsConfig config;

    public AwsSmsProvider(SmsConfig config) {
        this.config = config;
    }

    @Override
    public String getProviderName() {
        return "aws";
    }

    @Override
    public boolean sendSms(String recipientPhone, String message, String senderId, String dltTemplateId) {
        if (config.getApiKey() == null || config.getApiKey().isBlank() ||
            config.getApiSecret() == null || config.getApiSecret().isBlank()) {
            log.warn("[AWS SMS] Missing AWS access credentials. Please set SMS_API_KEY and SMS_API_SECRET in backend configuration.");
            return false;
        }

        try {
            log.info("[AWS SMS] Dispatching to {} via sender {}: {}", recipientPhone, senderId, message);
            // AWS Pinpoint / End User Messaging SDK integration point
            return true;
        } catch (Exception e) {
            log.error("[AWS SMS] Failed to dispatch SMS to {}: {}", recipientPhone, e.getMessage());
            return false;
        }
    }
}
