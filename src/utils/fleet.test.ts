import { describe, expect, it } from "vitest";
import { buildFleetSummary, formatAge } from "./fleet";
import type { TelemetryPacket } from "../types";

const packet = (
  packet_id: string,
  vehicle_id: string,
  event_time: string,
  signals: TelemetryPacket["signals"],
): TelemetryPacket => ({ packet_id, vehicle_id, event_time, signals });

describe("buildFleetSummary", () => {
  it("ignores duplicate packet ids", () => {
    const packets = [
      packet("same", "t01", "2026-10-29T08:00:00Z", { soc: 55 }),
      packet("same", "t01", "2026-10-29T08:00:00Z", { soc: 5 }),
      packet("newest", "t02", "2026-10-29T08:00:00Z", { speed: 10 }),
    ];
    expect(
      buildFleetSummary(packets).find((v) => v.vehicleId === "t01")?.soc?.value,
    ).toBe(55);
  });

  it("selects latest signal by event time, not array order", () => {
    const result = buildFleetSummary([
      packet("later", "t01", "2026-10-29T08:09:00Z", { soc: 70 }),
      packet("earlier", "t01", "2026-10-29T08:01:00Z", { soc: 12 }),
      packet("clock", "t02", "2026-10-29T08:10:00Z", { speed: 1 }),
    ]);
    expect(result.find((v) => v.vehicleId === "t01")?.soc?.value).toBe(70);
  });

  it("does not turn missing signals into zero", () => {
    const result = buildFleetSummary([
      packet("a", "t01", "2026-10-29T08:00:00Z", { speed: 0 }),
      packet("b", "t02", "2026-10-29T08:00:00Z", { soc: 50 }),
    ]);
    expect(result.find((v) => v.vehicleId === "t01")?.soc).toBeUndefined();
  });

  it("marks each signal stale independently using newest fleet event time", () => {
    const result = buildFleetSummary([
      packet("old-soc", "t01", "2026-10-29T07:40:00Z", { soc: 8 }),
      packet("fresh-speed", "t01", "2026-10-29T07:59:00Z", { speed: 20 }),
      packet("fleet-clock", "t02", "2026-10-29T08:00:00Z", { speed: 10 }),
    ]);
    const t01 = result.find((v) => v.vehicleId === "t01")!;
    expect(t01.soc?.stale).toBe(true);
    expect(t01.speed?.stale).toBe(false);
    expect(t01.status).toBe("OK");
  });

  it("applies mutually exclusive critical and low battery statuses", () => {
    const result = buildFleetSummary([
      packet("critical", "t01", "2026-10-29T08:00:00Z", { soc: 9.9 }),
      packet("low", "t02", "2026-10-29T08:00:00Z", { soc: 19.9 }),
      packet("ok", "t03", "2026-10-29T08:00:00Z", { soc: 20 }),
    ]);
    expect(result.map((v) => v.status)).toEqual([
      "Critical battery",
      "Low battery",
      "OK",
    ]);
  });

  it("sets No recent data when every available signal is stale", () => {
    const result = buildFleetSummary([
      packet("old", "t01", "2026-10-29T07:00:00Z", { soc: 5 }),
      packet("newest", "t02", "2026-10-29T08:00:00Z", { speed: 10 }),
    ]);
    expect(result.find((v) => v.vehicleId === "t01")?.status).toBe(
      "No recent data",
    );
  });

  it("treats exactly ten minutes old as fresh and more than ten as stale", () => {
    const result = buildFleetSummary([
      packet("edge", "t01", "2026-10-29T07:50:00Z", { soc: 50 }),
      packet("clock", "t02", "2026-10-29T08:00:00Z", { speed: 1 }),
    ]);
    expect(result.find((v) => v.vehicleId === "t01")?.soc?.stale).toBe(false);
  });
});

describe("formatAge", () => {
  it("formats missing and elapsed values", () => {
    expect(formatAge()).toBe("Not reported");
    expect(formatAge(0.5)).toBe("30 sec ago");
    expect(formatAge(65)).toBe("1h 5m ago");
  });
});
