package com.cattlefeedai.api.service.sms;

import com.cattlefeedai.api.dto.SmsRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.UUID;

/**
 * Safe mock SMS provider for testing and evaluator/judge demonstrations.
 * Simulates carrier delivery and stores a history of dispatches in memory.
 */
@Component
public class MockSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(MockSmsProvider.class);
    private static final int MAX_HISTORY = 50;

    private final List<SmsRecord> dispatchHistory = Collections.synchronizedList(new LinkedList<>());

    @Override
    public String getProviderName() {
        return "mock";
    }

    @Override
    public boolean sendSms(String recipientPhone, String message, String senderId, String dltTemplateId) {
        log.info("[SMS MOCK DISPATCH] Recipient: {}, SenderId: {}, DLT: {}, Message: \"{}\"",
                recipientPhone, senderId, dltTemplateId, message);

        SmsRecord record = new SmsRecord(
                UUID.randomUUID().toString(),
                recipientPhone,
                senderId,
                message,
                "MOCK_CARRIER",
                "MOCK_DELIVERED",
                LocalDateTime.now(),
                dltTemplateId,
                null
        );

        dispatchHistory.add(0, record);
        while (dispatchHistory.size() > MAX_HISTORY) {
            dispatchHistory.remove(dispatchHistory.size() - 1);
        }

        return true;
    }

    public List<SmsRecord> getRecentDispatches() {
        return new ArrayList<>(dispatchHistory);
    }

    public void clearHistory() {
        dispatchHistory.clear();
    }
}
