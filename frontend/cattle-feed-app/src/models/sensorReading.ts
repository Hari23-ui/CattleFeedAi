export type SensorSource = 'MANUAL' | 'IOT';

export interface SensorReading {
  id: number;
  storageUnitId: number;
  deviceId?: string;
  readingTime: string;
  temperature?: number | null;
  humidity?: number | null;
  ph?: number | null;
  gasLevel?: number | null;
  mouldRiskIndicator?: number | null;
  source?: SensorSource;
  createdAt?: string;
}

export interface CreateSensorReadingRequest {
  deviceId?: string;
  readingTime?: string;
  temperature?: number | null;
  humidity?: number | null;
  ph?: number | null;
  gasLevel?: number | null;
  mouldRiskIndicator?: number | null;
  source?: SensorSource;
}
