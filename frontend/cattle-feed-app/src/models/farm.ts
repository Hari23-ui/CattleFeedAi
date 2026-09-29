/**
 * Farm Data Models
 * Strictly matches backend schema:
 * - DTO: FarmRequest.java
 * - DTO: FarmResponse.java
 * - Entity: Farm.java
 */

export interface Farm {
  id: number;
  farmName: string;
  location?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface CreateFarmRequest {
  farmName: string;
  location?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface UpdateFarmRequest {
  farmName: string;
  location?: string;
  district?: string;
  state?: string;
  pincode?: string;
}
