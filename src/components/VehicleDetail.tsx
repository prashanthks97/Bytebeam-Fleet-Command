import { ArrowLeft, BatteryCharging, Gauge, Thermometer, Clock3 } from 'lucide-react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import type { VehicleSummary } from '../types';
import SignalCard from './SignalCard';
import StatusBadge from './StatusBadge';

export default function VehicleDetail({ vehicle, onBack }: { vehicle: VehicleSummary; onBack: () => void }) {
  return <section className="detail-view">
    <button className="back-button" onClick={onBack}><ArrowLeft size={16}/> Back to fleet</button>
    <div className="detail-heading">
      <div><div className="eyebrow">VEHICLE TELEMETRY</div><h2>{vehicle.vehicleId.toUpperCase()}</h2><p>Latest signal values and battery history</p></div>
      <StatusBadge status={vehicle.status}/>
    </div>
    <div className="signal-grid">
      <SignalCard title="State of charge" reading={vehicle.soc} unit="%" icon={<BatteryCharging size={18}/>}/>
      <SignalCard title="Speed" reading={vehicle.speed} unit=" km/h" icon={<Gauge size={18}/>}/>
      <SignalCard title="Battery temperature" reading={vehicle.batteryTemp} unit=" °C" icon={<Thermometer size={18}/>}/>
      <article className="signal-card"><div className="signal-top"><span className="signal-icon"><Clock3 size={18}/></span><span className="signal-title">Last packet</span></div><div className="last-packet">{vehicle.lastSeen ? new Date(vehicle.lastSeen).toLocaleString() : '—'}</div><div className="signal-age">Newest event for this truck</div></article>
    </div>
    <article className="panel chart-panel">
      <div className="panel-heading"><div><h3>Battery level history</h3><p>State of charge readings over event time</p></div><span className="chart-legend"><i/> SOC (%)</span></div>
      {vehicle.socHistory.length > 1 ? <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={vehicle.socHistory} margin={{ top: 12, right: 18, left: -18, bottom: 4 }}>
            <CartesianGrid stroke="#263246" strokeDasharray="3 5" vertical={false}/>
            <XAxis dataKey="time" tick={{ fill: '#8190a5', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30}/>
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#8190a5', fontSize: 11 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #29374c', borderRadius: 10, color: '#edf3fc' }} labelStyle={{ color: '#a9b7c9' }} formatter={(v) => [`${v}%`, 'SOC']}/>
            <Line type="monotone" dataKey="soc" stroke="#62d6ad" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#62d6ad' }}/>
          </LineChart>
        </ResponsiveContainer>
      </div> : <div className="empty-chart">Not enough SOC readings to display a trend.</div>}
    </article>
    <p className="detail-note">Freshness is calculated independently for each signal against the newest event time in the complete telemetry file. A stale SOC value is displayed for context but is not used to determine battery status.</p>
  </section>;
}