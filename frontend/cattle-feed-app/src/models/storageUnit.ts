export type StorageType = 'FEED_STORAGE' | 'SILAGE_STORAGE' | 'MIXED_STORAGE' | 'OTHER';

export type MonitoringStatus = 'MONITORING' | 'NORMAL' | 'ATTENTION_REQUIRED' | 'NO_RECENT_DATA' | 'OFFLINE';

export interface StorageUnit {
  id: number;
  farmId: number;
  farmName?: string;
  name: string;
  storageType: StorageType;
  location?: string;
  capacity?: string;
  deviceId?: string;
  latestTemperature?: number | null;
  latestPh?: number | null;
  latestHumidity?: number | null;
  lastReadingTime?: string | null;
  monitoringStatus: MonitoringStatus;
  unreadAlertCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStorageUnitRequest {
  farmId: number;
  name: string;
  storageType: StorageType;
  location?: string;
  capacity?: string;
  deviceId?: string;
}

export interface UpdateStorageUnitRequest {
  farmId?: number;
  name: string;
  storageType: StorageType;
  location?: string;
  capacity?: string;
  deviceId?: string;
}

export interface StorageMonitoringSummary {
  totalStorageUnits: number;
  monitoringUnits: number;
  normalUnits: number;
  attentionRequiredUnits: number;
  offlineUnits: number;
  unreadAlertCount: number;
}
