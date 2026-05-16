import React, { useState, useEffect, useRef } from 'react';
import { Activity, CarFront, AlertTriangle, Navigation, Gauge, ShieldCheck, Bell, TrendingUp, Clock, Mail, Phone, User } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { socketService } from '../services/socket';
import { locationApi, vehicleApi } from '../services/api';

/* ─── map re-centering helper ─── */
function FlyTo({ center, zoom }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!center || !center[0] || !center[1]) return;
    if (prev.current && prev.current[0] === center[0] && prev.current[1] === center[1]) return;
    map.flyTo(center, zoom, { duration: 1.5 });
    prev.current = center;
  }, [center, zoom, map]);
  return null;
}

export default function Dashboard() {
  const [locations, setLocations] = useState([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const vehiclesRef = useRef(0);

  /* derived stats */
  const activeCount   = locations.length;
  const alertCount    = locations.filter(l => l.status === 'Alert').length;
  const avgSpeed      = locations.length
    ? (locations.reduce((s, l) => s + (l.speed || 0), 0) / locations.length).toFixed(1)
    : '—';

  /* ─── data bootstrap ─── */
  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const [vRes, lRes] = await Promise.all([
          vehicleApi.getAll(),
          locationApi.getLocations()
        ]);

        if (!mounted) return;

        vehiclesRef.current = vRes.data.length;
        setTotalVehicles(vRes.data.length);

        const validLocs = (lRes.data || []).filter(l => l && l.lat != null && l.lon != null);
        setLocations(validLocs);

        if (validLocs.length > 0) {
          setCenter([Number(validLocs[0].lat), Number(validLocs[0].lon)]);
        }
      } catch (e) {
        console.error('[Dashboard] boot error:', e);
      }
    }

    boot();

    /* ─── live socket ─── */
    socketService.connect();
    socketService.subscribe('location', data => {
      if (!mounted || !Array.isArray(data)) return;
      const valid = data.filter(l => l && l.lat != null && l.lon != null);
      setLocations(valid);
      if (valid.length > 0) {
        setCenter([Number(valid[0].lat), Number(valid[0].lon)]);
      }
    });

    return () => {
      mounted = false;
      socketService.unsubscribe('location');
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-16">

      {/* ── page title ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Fleet Analytics <span className="text-here-teal">&amp;</span> Backend Tracking
          </h1>
          <p className="text-here-muted text-sm mt-1 flex items-center gap-2">
            <Activity size={13} className="text-here-neon" />
            Real-time fleet surveillance &amp; intelligent behavior detection
          </p>
        </div>
        <div className="flex items-center gap-2 bg-here-card px-4 py-2 rounded-full border border-here-border">
          <span className="w-2 h-2 rounded-full bg-here-neon animate-pulse shadow-[0_0_8px_#00e676]" />
          <span className="text-[11px] font-bold text-here-neon uppercase tracking-widest">
            {activeCount > 0 ? `${activeCount} live stream${activeCount > 1 ? 's' : ''}` : 'Awaiting streams'}
          </span>
        </div>
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat icon={<CarFront size={22} className="text-here-accent" />}   label="Total Fleet"    value={totalVehicles} sub="Registered" />
        <Stat icon={<Activity  size={22} className="text-here-neon"   />}   label="Live Tracking"  value={activeCount}   sub="Active Now" pulse={activeCount > 0} />
        <Stat icon={<Gauge     size={22} className="text-here-teal"   />}   label="Avg Speed"      value={`${avgSpeed} km/h`} sub="Current fleet" />
        <Stat icon={<AlertTriangle size={22} className={alertCount > 0 ? 'text-red-400' : 'text-here-muted'} />}
              label="Safety Alerts" value={alertCount} sub="Behaviour events" danger={alertCount > 0} />
      </div>

      {/* ── map + feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* MAP */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-here-border shadow-2xl relative" style={{ height: 560 }}>
          <MapContainer
            center={center}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <FlyTo center={center} zoom={locations.length > 0 ? 14 : 5} />

            {locations.map((loc, i) => {
              const isAlert = loc.status === 'Alert';
              return (
                <CircleMarker
                  key={`${loc.reg}-${i}`}
                  center={[Number(loc.lat), Number(loc.lon)]}
                  radius={12}
                  pathOptions={{
                    fillColor: isAlert ? '#f87171' : '#00e676',
                    color: isAlert ? '#fca5a5' : '#ffffff',
                    weight: 2.5,
                    fillOpacity: 0.85
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -14]} opacity={0.95}>
                    <span style={{ fontWeight: 700, fontSize: 11 }}>{loc.reg}</span>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* overlay badge */}
          <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
            <div className="bg-here-dark/80 backdrop-blur-md border border-here-border px-4 py-2 rounded-xl flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${locations.length > 0 ? 'bg-here-neon animate-pulse' : 'bg-here-muted'}`} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {locations.length > 0 ? `${locations.length} Vehicle${locations.length > 1 ? 's' : ''} On Map` : 'No Active Vehicles'}
              </span>
            </div>
          </div>

          {/* empty map helper */}
          {locations.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[999] pointer-events-none">
              <div className="bg-here-dark/70 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-3 text-center border border-here-border">
                <Navigation size={36} className="text-here-teal opacity-50" />
                <p className="text-sm font-bold text-white">No active devices</p>
                <p className="text-[11px] text-here-muted max-w-xs">
                  Open <code className="bg-here-card px-1 py-0.5 rounded text-here-teal">/tracker</code> on your phone,<br/>
                  select a registered vehicle and start driving.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* LIVE FEED */}
        <div className="card flex flex-col" style={{ height: 560 }}>
          <div className="p-5 border-b border-here-border shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Bell size={14} className="text-here-teal" /> Live Activity
                </h3>
                <p className="text-[10px] text-here-muted uppercase tracking-widest mt-0.5">
                  {locations.length} stream{locations.length !== 1 ? 's' : ''} active
                </p>
              </div>
              {alertCount > 0 && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/20 animate-pulse">
                  {alertCount} ALERT{alertCount > 1 ? 'S' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {locations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
                <Clock size={40} className="text-here-muted" />
                <div className="text-center">
                  <p className="text-sm font-bold text-white">No active pings</p>
                  <p className="text-[11px] text-here-muted mt-1">Start the tracker on any device</p>
                </div>
              </div>
            ) : (
              locations.map((loc, idx) => {
                const isAlert = loc.status === 'Alert';
                return (
                  <div key={idx} className={`p-4 rounded-xl border transition-all ${
                    isAlert
                      ? 'bg-red-500/10 border-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.08)]'
                      : 'bg-here-dark/50 border-here-border hover:border-here-teal/40 hover:bg-here-dark/80'
                  }`}>
                    {/* row 1 */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAlert ? 'bg-red-400 animate-ping' : 'bg-here-neon'}`} />
                        <p className="text-sm font-bold text-white">{loc.reg}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        isAlert ? 'bg-red-500/20 text-red-400' : 'bg-here-neon/10 text-here-neon'
                      }`}>{loc.status}</span>
                    </div>

                    {/* coordinates */}
                    <p className="text-[11px] text-here-muted font-mono mb-2">
                      📍 {Number(loc.lat).toFixed(5)}, {Number(loc.lon).toFixed(5)}
                    </p>

                    {/* speed */}
                    {loc.speed !== undefined && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mb-2 ${
                        loc.speed > 80 ? 'bg-red-500/15 text-red-400' : 'bg-here-teal/10 text-here-teal'
                      }`}>
                        <Gauge size={12} />
                        <span>{loc.speed.toFixed(1)} km/h</span>
                        {loc.speed > 80 && <span className="ml-auto text-[10px]">OVER LIMIT</span>}
                      </div>
                    )}

                    {/* alert message */}
                    {loc.alertMessage && (
                      <div className="bg-red-500/15 border border-red-500/20 rounded-lg p-2 text-[10px] text-red-400 font-bold uppercase tracking-tight">
                        ⚠️ {loc.alertMessage}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── how it works (user-friendly) ── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-here-accent" /> How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { n: '01', icon: <Navigation size={22} className="text-blue-400" />, t: 'Driver Goes Online', d: "Driver opens the Tracker page on their phone, selects their vehicle and presses Start. Their GPS location begins broadcasting instantly." },
            { n: '02', icon: <ShieldCheck size={22} className="text-here-neon" />, t: 'Automatic Analysis', d: "Our backend checks every location ping — measuring speed and checking if the vehicle has entered any restricted zone — in real time." },
            { n: '03', icon: <Bell size={22} className="text-here-teal" />, t: 'Instant Dashboard Update', d: "The map pin moves and the Activity Log updates the moment the server processes the event. No refresh needed." },
          ].map(s => (
            <div key={s.n} className="card p-6 relative overflow-hidden hover:border-here-border transition-all group">
              <span className="absolute -right-2 -top-2 text-7xl font-black text-white/[0.03] group-hover:text-white/[0.06] transition-colors select-none">{s.n}</span>
              <div className="w-10 h-10 rounded-xl bg-here-dark border border-here-border flex items-center justify-center mb-4">{s.icon}</div>
              <h4 className="text-white font-bold mb-2">{s.t}</h4>
              <p className="text-[12px] text-here-muted leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── footer / contact ── */}
      <footer className="border-t border-here-border pt-10 mt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-sm">
            <p className="text-white font-extrabold text-lg tracking-tight mb-1">Fleet Analytics &amp; Backend Tracking</p>
            <p className="text-[12px] text-here-muted leading-relaxed">
              Enterprise-grade real-time fleet operations platform with intelligent driver behavior analytics.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <FooterContact icon={<User size={15} />}  label="Managed By"    val="Paramveer Singh" />
            <FooterContact icon={<Phone size={15} />} label="Contact"        val="+91 7658828271" />
            <FooterContact icon={<Mail size={15} />}  label="Email"          val="paramveercse@gmail.com" />
          </div>
        </div>
        <p className="text-[10px] text-here-muted/40 uppercase tracking-[0.2em] text-center mt-8">
          © 2026 Fleet Analytics &amp; Backend Tracking — All Rights Reserved
        </p>
      </footer>
    </div>
  );
}

/* ─── small components ─── */
function Stat({ icon, label, value, sub, pulse, danger }) {
  return (
    <div className="card p-5 flex flex-col gap-4 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex justify-between items-start">
        <div className="w-11 h-11 rounded-xl bg-here-dark border border-here-border flex items-center justify-center">{icon}</div>
        {pulse  && <span className="w-2 h-2 rounded-full bg-here-neon animate-pulse" />}
        {danger && !pulse && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
      </div>
      <div>
        <p className="text-[10px] text-here-muted font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-white leading-none">{value}</p>
        <p className="text-[10px] text-here-muted mt-1">{sub}</p>
      </div>
    </div>
  );
}

function FooterContact({ icon, label, val }) {
  return (
    <div className="flex items-center gap-3 bg-here-card/40 border border-here-border rounded-xl px-4 py-3">
      <div className="text-here-teal opacity-70">{icon}</div>
      <div>
        <p className="text-[9px] text-here-muted uppercase font-bold tracking-widest">{label}</p>
        <p className="text-sm text-white font-medium">{val}</p>
      </div>
    </div>
  );
}
