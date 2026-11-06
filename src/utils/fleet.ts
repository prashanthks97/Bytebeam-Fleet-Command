import type {
  FleetStatus,
  SignalName,
  SignalReading,
  TelemetryPacket,
  VehicleSummary,
} from "../types";

const SIGNAL_KEYS: SignalName[] = ["soc", "speed", "battery_temp"];
const STALE_AFTER_MS = 10 * 60 * 1000;

function newestFirst(a: TelemetryPacket, b: TelemetryPacket) {
  return Date.parse(b.event_time) - Date.parse(a.event_time);
}

export function buildFleetSummary(
  packets: TelemetryPacket[],
): VehicleSummary[] {
  if (!packets.length) return [];

  const packetById = new Map<string, TelemetryPacket>();
  for (const packet of packets) {
    if (!packetById.has(packet.packet_id))
      packetById.set(packet.packet_id, packet);
  }
  const uniquePackets = Array.from(packetById.values());
  const newestFleetEvent = Math.max(
    ...uniquePackets.map((p) => Date.parse(p.event_time)),
  );
  const byVehicle = new Map<string, TelemetryPacket[]>();

  for (const packet of uniquePackets) {
    const existing = byVehicle.get(packet.vehicle_id) ?? [];
    existing.push(packet);
    byVehicle.set(packet.vehicle_id, existing);
  }

  return Array.from(byVehicle.entries())
    .map(([vehicleId, vehiclePackets]) => {
      const ordered = [...vehiclePackets].sort(newestFirst);
      const readings: Partial<Record<SignalName, SignalReading>> = {};

      for (const signal of SIGNAL_KEYS) {
        const packet = ordered.find(
          (p) => typeof p.signals?.[signal] === "number",
        );
        if (!packet) continue;
        const eventMs = Date.parse(packet.event_time);
        const ageMs = Math.max(0, newestFleetEvent - eventMs);
        readings[signal] = {
          value: packet.signals[signal] as number,
          eventTime: packet.event_time,
          ageMinutes: ageMs / 60000,
          stale: ageMs > STALE_AFTER_MS,
        };
      }

      const soc = readings.soc;
      const hasFreshSignal = Object.values(readings).some(
        (reading) => reading && !reading.stale,
      );
      let status: FleetStatus = "No recent data";
      if (hasFreshSignal) {
        if (soc && !soc.stale && soc.value < 10) status = "Critical battery";
        else if (soc && !soc.stale && soc.value < 20) status = "Low battery";
        else status = "OK";
      }

      const socHistory = [...vehiclePackets]
        .filter((p) => typeof p.signals?.soc === "number")
        .sort((a, b) => Date.parse(a.event_time) - Date.parse(b.event_time))
        .map((p) => ({
          time: new Date(p.event_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: Date.parse(p.event_time),
          soc: p.signals.soc as number,
        }));

      return {
        vehicleId,
        soc: readings.soc,
        speed: readings.speed,
        batteryTemp: readings.battery_temp,
        lastSeen: ordered[0]?.event_time,
        status,
        socHistory,
      };
    })
    .sort((a, b) =>
      a.vehicleId.localeCompare(b.vehicleId, undefined, { numeric: true }),
    );
}

export function getFleetStats(vehicles: VehicleSummary[]) {
  return vehicles.reduce(
    (stats, vehicle) => {
      stats.total += 1;
      stats[vehicle.status] += 1;
      return stats;
    },
    {
      total: 0,
      OK: 0,
      "Low battery": 0,
      "Critical battery": 0,
      "No recent data": 0,
    },
  );
}

export function formatAge(minutes?: number): string {
  if (minutes === undefined || !Number.isFinite(minutes)) return "Not reported";
  if (minutes < 1) return `${Math.round(minutes * 60)} sec ago`;
  if (minutes < 60) return `${Math.floor(minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}h ${mins}m ago`;
}

export function getSignalLabel(signal: SignalName) {
  return signal === "soc"
    ? "State of charge"
    : signal === "speed"
      ? "Speed"
      : "Battery temperature";
}
