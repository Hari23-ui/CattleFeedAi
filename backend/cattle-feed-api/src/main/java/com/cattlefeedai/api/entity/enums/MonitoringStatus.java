package com.cattlefeedai.api.entity.enums;

/**
 * Status of a storage unit's continuous monitoring lifecycle.
 */
public enum MonitoringStatus {
    MONITORING,
    NORMAL,
    ATTENTION_REQUIRED,
    NO_RECENT_DATA,
    OFFLINE
}
