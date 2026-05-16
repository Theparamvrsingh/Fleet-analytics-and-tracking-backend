import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import { socketService } from '../services/socket';
import { locationApi } from '../services/api';
import { Navigation, Clock, Gauge, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── fly-to helper ─── */
function FlyTo({ center, zoom }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!center || !center[0] || !center[1]) return;
    if (prev.current && prev.current[0] === center[0] && prev.current[1] === center[1]) return;
    map.flyTo(center, zoom, { duration: 1.2 });
    prev.current = center;
  }, [center, zoom, map]);
  return null;
}

// Restricted zone from the backend (matching VehicleLocationServiceImpl)
const RESTRICTED_ZONE = { lat: 18.5204, lon: 73.8567, radiusM: 500, name: 'Industrial Area 4' };

const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    locationApi.getLocations().then(r => {
      const valid = (r.data || []).filter(l => l.lat && l.lon);
      setLocations(valid);
      if (valid.length > 0) setCenter([Number(valid[0].lat), Number(valid[0].lon)]);
    }).catch(console.error);

    socketService.connect();
    socketService.subscribe('location', data => {
      if (!Array.isArray(data)) return;
      const valid = data.filter(l => l.lat && l.lon);
      setLocations(valid);
      if (valid.length > 0) setCenter([Number(valid[0].lat), Number(valid[0].lon)]);
    });
    return () => socketService.unsubscribe('location');
  }, []);

  const selectVehicle = async (loc) => {
    setSelected(loc);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const res = await locationApi.getHistory(loc.reg);
      setHistory(res.data.locations || []);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Live Operations Map</h2>
          <p className="text-here-muted text-sm mt-0.5">Click any vehicle to view its location history</p>
        </div>
        <div className="flex items-center gap-2 bg-here-card px-4 py-2 rounded-full border border-here-border">
          <span className={`w-2 h-2 rounded-full ${locations.length > 0 ? 'bg-here-neon animate-pulse' : 'bg-here-muted'}`} />
          <span className="text-xs font-bold text-here-neon uppercase tracking-widest">
            {locations.length} Active
          </span>
        </div>
      </div>

      {/* map */}
      <div className="rounded-2xl overflow-hidden border border-here-border shadow-2xl relative" style={{ height: 520 }}>
        <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={true} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <FlyTo center={center} zoom={locations.length > 0 ? 14 : 5} />

          {/* ── Restricted Zone overlay from backend ── */}
          <Circle
            center={[RESTRICTED_ZONE.lat, RESTRICTED_ZONE.lon]}
            radius={RESTRICTED_ZONE.radiusM}
            pathOptions={{ color: '#f87171', fillColor: '#f87171', fillOpacity: 0.12, weight: 2, dashArray: '6 4' }}
          >
            <Tooltip sticky direction="top" opacity={0.9}>
              <span style={{ fontWeight: 700, fontSize: 11, color: '#f87171' }}>⚠️ {RESTRICTED_ZONE.name}</span><br />
              <span style={{ fontSize: 10 }}>Restricted Zone — 500m radius</span>
            </Tooltip>
          </Circle>

          {/* ── vehicle dots ── */}
          {locations.map((loc, i) => {
            const isAlert = loc.status === 'Alert';
            const isSel   = selected?.reg === loc.reg;
            return (
              <CircleMarker
                key={`${loc.reg}-${i}`}
                center={[Number(loc.lat), Number(loc.lon)]}
                radius={isSel ? 16 : 11}
                pathOptions={{
                  fillColor: isAlert ? '#f87171' : '#00e676',
                  color: isSel ? '#ffffff' : (isAlert ? '#fca5a5' : '#00e676'),
                  weight: isSel ? 3 : 2,
                  fillOpacity: 0.85
                }}
                eventHandlers={{ click: () => selectVehicle(loc) }}
              >
                <Tooltip permanent direction="top" offset={[0, -14]} opacity={0.95}>
                  <span style={{ fontWeight: 700, fontSize: 11 }}>{loc.reg}</span>
                  {isAlert && <span style={{ color: '#f87171' }}> ⚠️</span>}
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* ── Trip Replay route line ── */}
          {history.length > 1 && selected && (() => {
            const pts = history.map(h => [Number(h.lat), Number(h.lon)]);
            const start = pts[pts.length - 1]; // oldest
            const end   = pts[0];              // most recent
            return (
              <>
                {/* gradient route line */}
                <Polyline
                  positions={pts}
                  pathOptions={{ color: '#00bfa5', weight: 3, opacity: 0.85, dashArray: '8 4' }}
                />
                {/* start dot (oldest) */}
                <CircleMarker center={start} radius={7}
                  pathOptions={{ fillColor: '#64748b', color: '#ffffff', weight: 2, fillOpacity: 1 }}>
                  <Tooltip direction="top" offset={[0,-8]} opacity={0.9}>
                    <span style={{fontSize:10, fontWeight:700}}>Trip Start</span>
                  </Tooltip>
                </CircleMarker>
                {/* end dot (latest / current) */}
                <CircleMarker center={end} radius={9}
                  pathOptions={{ fillColor: '#00e676', color: '#ffffff', weight: 2.5, fillOpacity: 1 }}>
                  <Tooltip permanent direction="top" offset={[0,-12]} opacity={0.95}>
                    <span style={{fontSize:10, fontWeight:700, color:'#00e676'}}>▶ Current</span>
                  </Tooltip>
                </CircleMarker>
              </>
            );
          })()}
        </MapContainer>

        {/* legend */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none flex flex-col gap-1.5">
          <div className="bg-here-dark/85 backdrop-blur-md border border-here-border px-3 py-2 rounded-xl text-xs space-y-1.5">
            <LegendDot color="#00e676" label="Active Vehicle" />
            <LegendDot color="#f87171" label="Safety Alert" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 border-t-2 border-dashed border-red-400" />
              <span className="text-here-muted">Restricted Zone</span>
            </div>
            {history.length > 1 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 border-t-2 border-dashed border-here-teal" />
                <span className="text-here-muted">Trip Route</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* vehicle list / history panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* fleet list */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-here-border bg-here-dark/50">
            <h3 className="font-bold text-white text-sm">Active Vehicles</h3>
          </div>
          <div className="divide-y divide-here-border/30">
            {locations.length === 0 ? (
              <div className="p-8 text-center text-here-muted text-sm opacity-40">No active vehicles</div>
            ) : (
              locations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => selectVehicle(loc)}
                  className={`w-full text-left flex items-center justify-between px-5 py-4 hover:bg-here-dark/60 transition-colors ${selected?.reg === loc.reg ? 'bg-here-teal/10 border-l-4 border-here-teal' : ''}`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">{loc.reg}</p>
                    <p className="text-[11px] text-here-muted font-mono mt-0.5">{Number(loc.lat).toFixed(4)}, {Number(loc.lon).toFixed(4)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {loc.speed !== undefined && (
                      <span className="text-xs text-here-teal font-bold">{loc.speed.toFixed(1)} km/h</span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${loc.status === 'Alert' ? 'bg-red-500/20 text-red-400' : 'bg-here-neon/10 text-here-neon'}`}>{loc.status}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* history panel */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setHistoryOpen(v => !v)}
            className="w-full flex items-center justify-between p-4 border-b border-here-border bg-here-dark/50 hover:bg-here-dark/80 transition-colors"
          >
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock size={14} className="text-here-teal" />
                {selected ? `History — ${selected.reg}` : 'Location History'}
              </h3>
              <p className="text-[10px] text-here-muted mt-0.5">Click a vehicle to load last 20 positions</p>
            </div>
            {historyOpen ? <ChevronUp size={16} className="text-here-muted" /> : <ChevronDown size={16} className="text-here-muted" />}
          </button>

          {historyOpen && (
            <div className="overflow-y-auto max-h-72 divide-y divide-here-border/20">
              {historyLoading ? (
                <div className="p-6 text-center text-here-muted text-sm opacity-50">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="p-6 text-center text-here-muted text-sm opacity-40">No history found</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-here-dark/40 transition-colors">
                    <div>
                      <p className="text-[11px] text-here-muted font-mono">{Number(h.lat).toFixed(5)}, {Number(h.lon).toFixed(5)}</p>
                      <p className="text-[10px] text-here-muted/60 mt-0.5">{h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.alertMessage && <AlertTriangle size={12} className="text-red-400" />}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${h.status === 'Alert' ? 'text-red-400 bg-red-500/10' : 'text-here-neon bg-here-neon/10'}`}>{h.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LegendDot = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-here-muted">{label}</span>
  </div>
);

export default MapPage;
