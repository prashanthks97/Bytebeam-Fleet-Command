import type { FleetStatus } from '../types';

export default function StatusBadge({ status }: { status: FleetStatus }) {
  const className = status === 'OK' ? 'ok' :
    status === 'Low battery' ? 'low' :
    status === 'Critical battery' ? 'critical' : 'offline';
  return <span className={`status-badge ${className}`}><span className="status-dot" />{status}</span>;
}