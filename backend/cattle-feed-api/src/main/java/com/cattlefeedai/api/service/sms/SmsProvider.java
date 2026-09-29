package com.cattlefeedai.api.service.sms;

/**
 * Interface defining SMS delivery providers.
 */
public interface SmsProvider {

    /**
     * Unique identifier of the provider (e.g. "mock", "twilio", "aws").
     */
    String getProviderName();

    /**
     * Dispatch an SMS message.
     *
     * @param recipientPhone Destination E.164 phone number.
     * @param message Text payload.
     * @param senderId TRAI-registered 6-alpha header / sender ID.
     * @param dltTemplateId TRAI DLT Content Template ID.
     * @return true if successfully dispatched / queued; false otherwise.
     */
    boolean sendSms(String recipientPhone, String message, String senderId, String dltTemplateId);
}
