export type SignalName = "soc" | "speed" | "battery_temp";
export interface TelemetryPacket {
  packet_id: string;
  vehicle_id: string;
  event_time: string;
  signals: Partial<Record<SignalName, number>>;
}
export type FleetStatus =
  | "OK"
  | "Low battery"
  | "Critical battery"
  | "No recent data";
export interface SignalReading {
  value: number;
  eventTime: string;
  ageMinutes: number;
  stale: boolean;
}
export interface VehicleSummary {
  vehicleId: string;
  soc?: SignalReading;
  speed?: SignalReading;
  batteryTemp?: SignalReading;
  lastSeen?: string;
  status: FleetStatus;
  socHistory: { time: string; timestamp: number; soc: number }[];
}
