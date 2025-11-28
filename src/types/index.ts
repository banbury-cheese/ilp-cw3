// MedDispatchRec and related types for ILP dispatch system

export interface DeliveryLocation {
  lng: number;
  lat: number;
  address?: string; // Optional address/location name
}

export interface Requirements {
  capacity: number;
  cooling?: boolean;
  heating?: boolean;
  maxCost?: number;
}

export interface MedDispatchRec {
  id: number;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm (24h)
  requirements: Requirements;
  delivery: DeliveryLocation;
}

export interface DispatchParseResult {
  dispatches: MedDispatchRec[];
  notes: string[];
  warnings: string[];
}

export interface ParseDispatchesRequest {
  inputText: string;
  defaultDate?: string;
  defaultTime?: string;
  idBase?: number;
}

export interface DroneInfo {
  id: string;
  name: string;
  capacity: number;
  cooling: boolean;
  heating: boolean;
}

export interface DeliveryPath {
  deliveryId: number;
  flightPath: { lng: number; lat: number }[];
}

export interface DronePath {
  droneId: string;
  deliveries: DeliveryPath[];
}

export interface IlpPlanResponse {
  totalCost: number;
  totalMoves: number;
  dronePaths: DronePath[];
}

export interface GeoJsonLineString {
  type: "LineString" | "MultiLineString";
  coordinates: [number, number][] | [number, number][][];
}

export interface PlanRoutesResponse {
  plan: IlpPlanResponse;
  geojson: GeoJsonLineString;
}

export interface ServicePoint {
  name: string;
  lng: number;
  lat: number;
  type: 'pickup' | 'delivery';
}

export interface RestrictedArea {
  name: string;
  coordinates: [number, number][];
}

export interface ValidationError {
  field: string;
  message: string;
  dispatchId?: number;
}

export interface Scenario {
  id: string;
  name: string;
  timestamp: number;
  inputType: 'freetext' | 'prescription';
  inputText: string;
  dispatches: MedDispatchRec[];
  plan: IlpPlanResponse;
  geojson: GeoJsonLineString;
}

export interface AnimationState {
  isPlaying: boolean;
  currentStep: number;
  speed: number;
  totalSteps: number;
}
