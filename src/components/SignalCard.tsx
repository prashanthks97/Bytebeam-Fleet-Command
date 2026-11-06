import type { ReactNode } from "react";
import type { SignalReading } from "../types";
import { formatAge } from "../utils/fleet";

export default function SignalCard({
  title,
  reading,
  value,
  unit,
  icon,
}: {
  title: string;
  reading?: SignalReading;
  value?: string;
  unit?: string;
  icon: ReactNode;
}) {
  const stale = reading?.stale;
  return (
    <article className={`signal-card ${stale ? "signal-stale" : ""}`}>
      <div className="signal-top">
        <span className="signal-icon">{icon}</span>
        <span className="signal-title">{title}</span>
      </div>
      <div className="signal-value">
        {value ?? (reading ? `${reading.value}${unit ?? ""}` : "—")}
      </div>
      <div className={`signal-age ${stale ? "stale-text" : ""}`}>
        {stale ? "STALE · " : ""}
        {reading ? formatAge(reading.ageMinutes) : "Not reported"}
      </div>
    </article>
  );
}
