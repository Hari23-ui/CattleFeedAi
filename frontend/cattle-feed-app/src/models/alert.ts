/**
 * Alert & Notification Data Models (M10)
 *
 * Matches backend:
 * - Entity: Alert.java
 * - Enums: AlertType.java, Severity.java
 * - DTOs: AlertResponse.java, UnreadCountResponse.java
 */

export type AlertSeverity = 'INFO' | 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AlertType =
  | 'FEED_QUALITY'
  | 'SILAGE_QUALITY'
  | 'STORAGE'
  | 'HEALTH_RISK'
  | 'CONSULTATION'
  | 'GENERAL';

export interface Alert {
  id: number;
  title: string;
  message: string;
  alertType: AlertType;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: string;
  userId?: number | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
  count?: number;
}

export interface MarkAllReadResponse {
  message: string;
  updatedCount: number;
}
