import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Battery,
  Bell,
  ChevronRight,
  CircleHelp,
  Clock3,
  Search,
  Truck,
  Zap,
} from "lucide-react";
import telemetry from "./data/telemetry.json";
import type { FleetStatus, TelemetryPacket, VehicleSummary } from "./types";
import { buildFleetSummary, getFleetStats } from "./utils/fleet";
import StatusBadge from "./components/StatusBadge";
import VehicleDetail from "./components/VehicleDetail";

const FILTERS: (FleetStatus | "All statuses")[] = [
  "All statuses",
  "OK",
  "Low battery",
  "Critical battery",
  "No recent data",
];

function App() {
  const vehicles = useMemo(
    () => buildFleetSummary(telemetry as TelemetryPacket[]),
    [],
  );
  const stats = useMemo(() => getFleetStats(vehicles), [vehicles]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FleetStatus | "All statuses">(
    "All statuses",
  );
  const [selected, setSelected] = useState<VehicleSummary | null>(null);

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vehicleId.toLowerCase().includes(query.trim().toLowerCase()) &&
      (filter === "All statuses" || vehicle.status === filter),
  );
  const attentionCount =
    stats["Low battery"] + stats["Critical battery"] + stats["No recent data"];

  if (selected) {
    const current =
      vehicles.find((v) => v.vehicleId === selected.vehicleId) ?? selected;
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Topbar />
          <VehicleDetail vehicle={current} onBack={() => setSelected(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="page-content">
          <div className="page-title-row">
            <div>
              <div className="eyebrow">OVERVIEW / FLEET</div>
              <h1>Fleet overview</h1>
              <p className="subtitle">
                Monitor vehicle health and telemetry across your electric fleet.
              </p>
            </div>
            <div className="dataset-pill">
              <span className="pulse-dot" /> DATASET LOADED{" "}
              <span className="dataset-divider" /> 50 VEHICLES
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              label="Total vehicles"
              value={stats.total}
              caption="Registered in dataset"
              icon={<Truck size={19} />}
              tone="blue"
            />
            <StatCard
              label="Operational"
              value={stats.OK}
              caption="No active battery alert"
              icon={<Activity size={19} />}
              tone="green"
            />
            <StatCard
              label="Low battery"
              value={stats["Low battery"]}
              caption="SOC below 20%"
              icon={<Battery size={19} />}
              tone="amber"
            />
            <StatCard
              label="Critical battery"
              value={stats["Critical battery"]}
              caption="SOC below 10%"
              icon={<Zap size={19} />}
              tone="red"
            />
            <StatCard
              label="No recent data"
              value={stats["No recent data"]}
              caption="No fresh signals"
              icon={<Clock3 size={19} />}
              tone="slate"
            />
          </section>

          <section className="panel fleet-panel">
            <div className="panel-heading fleet-heading">
              <div>
                <h3>Vehicle status</h3>
                <p>
                  {filteredVehicles.length} of {vehicles.length} vehicles shown
                  · {attentionCount} require attention
                </p>
              </div>
              <span className="updated-label">
                <span className="pulse-dot" /> Telemetry snapshot
              </span>
            </div>
            <div className="table-toolbar">
              <label className="search-box">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search truck ID..."
                  aria-label="Search truck ID"
                />
              </label>
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as FleetStatus | "All statuses")
                }
                aria-label="Filter by status"
              >
                {FILTERS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>VEHICLE</th>
                    <th>BATTERY (SOC)</th>
                    <th>SPEED</th>
                    <th>LAST SEEN</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.vehicleId}
                      onClick={() => setSelected(vehicle)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelected(vehicle);
                      }}
                    >
                      <td>
                        <div className="vehicle-cell">
                          <span className="vehicle-avatar">
                            <Truck size={16} />
                          </span>
                          <span>
                            <strong>{vehicle.vehicleId.toUpperCase()}</strong>
                            <small>Electric truck</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="soc-cell">
                          <strong>
                            {vehicle.soc
                              ? `${vehicle.soc.value.toFixed(1)}%`
                              : "—"}
                          </strong>
                          {vehicle.soc && (
                            <div className="soc-track">
                              <span
                                style={{
                                  width: `${Math.max(0, Math.min(100, vehicle.soc.value))}%`,
                                }}
                                className={
                                  vehicle.soc.stale
                                    ? "bar-stale"
                                    : vehicle.soc.value < 20
                                      ? "bar-low"
                                      : "bar-good"
                                }
                              />
                            </div>
                          )}
                          {vehicle.soc?.stale && (
                            <small className="stale-text">Stale reading</small>
                          )}
                        </div>
                      </td>
                      <td className="numeric-cell">
                        {vehicle.speed ? `${vehicle.speed.value} km/h` : "—"}
                        {vehicle.speed?.stale && (
                          <small className="stale-text">Stale</small>
                        )}
                      </td>
                      <td>
                        <span className="last-seen">
                          {vehicle.lastSeen
                            ? new Date(vehicle.lastSeen).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )
                            : "—"}
                        </span>
                        <small>
                          {vehicle.lastSeen
                            ? new Date(vehicle.lastSeen).toLocaleDateString()
                            : ""}
                        </small>
                      </td>
                      <td>
                        <StatusBadge status={vehicle.status} />
                      </td>
                      <td>
                        <ChevronRight size={17} className="row-chevron" />
                      </td>
                    </tr>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          No vehicles match your search or filter.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Showing {filteredVehicles.length} vehicles</span>
              <span>
                Click a vehicle to view telemetry <ChevronRight size={13} />
              </span>
            </div>
          </section>
          <footer className="page-footer">
            <span>BYTEBEAM FLEET COMMAND</span>
            <span>
              Freshness threshold: 10 minutes · Event-time based processing
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Zap size={20} fill="currentColor" />
        </span>
        <span>
          bytebeam<small>FLEET CLOUD</small>
        </span>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <div className="nav-item active">
        <Activity size={17} /> Fleet overview
      </div>
      <div className="nav-item muted">
        <Truck size={17} /> Vehicles <span className="nav-count">50</span>
      </div>
      <div className="nav-item muted">
        <Bell size={17} /> Alerts
      </div>
      <div className="sidebar-bottom">
        <div className="help-icon">
          <CircleHelp size={17} />
        </div>
        <div>
          <strong>Need help?</strong>
          <small>View documentation</small>
        </div>
      </div>
    </aside>
  );
}
function Topbar() {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        Workspace <span>/</span> Fleet
      </div>
      <div className="topbar-right">
        <span className="system-status">
          <i /> System operational
        </span>
        <div className="avatar">PS</div>
      </div>
    </header>
  );
}
function StatCard({
  label,
  value,
  caption,
  icon,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-caption">{caption}</div>
    </article>
  );
}
export default App;
