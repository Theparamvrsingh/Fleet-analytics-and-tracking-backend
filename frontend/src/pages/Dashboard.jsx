import React, { useState, useEffect } from 'react';
import { Activity, CarFront, AlertTriangle, Navigation, Map as MapIcon, Mail, Phone, User, Zap, Clock, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { socketService } from '../services/socket';
import { locationApi, vehicleApi } from '../services/api';

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  if (center && center[0] && center[1]) {
    map.setView(center, zoom);
  }
  return null;
};

const Dashboard = () => {
  const [liveLocations, setLiveLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Center of India
  const [stats, setStats] = useState({
    active: 0,
    total: 0,
    alerts: 0,
    distance: 0
  });

  const updateDashboardStats = (locations, totalVehicles) => {
    setStats({
      total: totalVehicles,
      active: locations.length,
      distance: (locations.length * 12.4).toFixed(1),
      alerts: locations.filter(l => l.status === 'Alert').length
    });

    if (locations.length > 0) {
      setMapCenter([Number(locations[0].lat), Number(locations[0].lon)]);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [vRes, lRes] = await Promise.all([vehicleApi.getAll(), locationApi.getLocations()]);
        setVehicles(vRes.data);
        setLiveLocations(lRes.data);
        updateDashboardStats(lRes.data, vRes.data.length);
      } catch (err) {
        console.error("Dashboard Init Error:", err);
      }
    };
    init();
    socketService.subscribe('location', (data) => {
      if (Array.isArray(data)) {
        setLiveLocations(data);
        updateDashboardStats(data, vehicles.length);
      }
    });
    return () => socketService.unsubscribe('location');
  }, [vehicles.length]);

  return (
    <div className="min-h-screen flex flex-col gap-8 pb-12">
      {/* Premium Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-here-card to-here-dark p-6 rounded-2xl border border-here-border shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Fleet Operational Intelligence</h1>
          <p className="text-here-muted text-sm mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-here-neon" />
            Active monitoring and real-time behavioral analytics
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-here-dark/50 px-4 py-2 rounded-xl border border-here-border">
          <div className="text-right">
            <p className="text-[10px] text-here-muted uppercase font-bold tracking-widest">System Health</p>
            <p className="text-xs text-here-neon font-bold">OPTIMAL</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-here-neon/10 flex items-center justify-center border border-here-neon/20">
            <Zap size={20} className="text-here-neon animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Global Assets" value={stats.total} icon={<CarFront className="text-here-accent" />} label="Fleet Inventory" />
        <StatCard title="Active Streams" value={stats.active} icon={<Activity className="text-here-neon" />} label="Tracking Now" active />
        <StatCard title="Avg Speed" value="64 km/h" icon={<Navigation className="text-here-teal" />} label="Fleet Performance" />
        <StatCard title="Critical Alerts" value={stats.alerts} icon={<AlertTriangle className="text-red-500" />} label="Behavior Issues" danger={stats.alerts > 0} />
      </div>

      {/* Interactive Map & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 h-[600px] rounded-2xl overflow-hidden border border-here-border shadow-2xl relative group">
          <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%', background: '#0a0f18' }} zoomControl={false} attributionControl={false}>
            <ChangeView center={mapCenter} zoom={stats.active > 0 ? 13 : 5} />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {liveLocations.map((loc, i) => (
              <CircleMarker 
                key={`${loc.reg || i}-${i}`}
                center={[Number(loc.lat), Number(loc.lon)]}
                radius={10}
                pathOptions={{ 
                  fillColor: loc.status === 'Alert' ? '#f87171' : '#00e676', 
                  color: 'white', 
                  weight: 2, 
                  fillOpacity: 0.8 
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[150px]">
                    <div className="font-bold border-b pb-1 mb-2 text-gray-800">{loc.reg || 'Asset'}</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p className="flex justify-between"><span>Status:</span> <span className={loc.status === 'Alert' ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{loc.status}</span></p>
                      <p className="flex justify-between"><span>Speed:</span> <span className="font-bold">{loc.speed?.toFixed(1) || 0} km/h</span></p>
                      {loc.alertMessage && <p className="text-red-500 italic mt-1 font-bold">⚠️ {loc.alertMessage}</p>}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="absolute top-6 left-6 z-[1000] bg-here-card/90 backdrop-blur-md p-4 rounded-xl border border-here-border shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-here-neon animate-ping"></div>
              <p className="text-sm font-bold text-white uppercase tracking-tighter">Live Fleet Positions</p>
            </div>
          </div>
        </div>

        <div className="card flex flex-col h-[600px] overflow-hidden">
          <div className="p-5 border-b border-here-border bg-here-dark/50 flex flex-col gap-1">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-here-teal" /> Activity Log
            </h3>
            <p className="text-[10px] text-here-muted uppercase tracking-widest">Real-time behavior stream</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-here-border">
            {liveLocations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                <MapIcon size={48} className="text-here-muted" />
                <p className="text-sm text-here-muted">No active pings...</p>
              </div>
            ) : (
              liveLocations.map((loc, idx) => (
                <div key={idx} className={`p-4 rounded-xl border transition-all ${loc.status === 'Alert' ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-here-dark/40 border-here-border hover:bg-here-dark/60'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-white">{loc.reg}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${loc.status === 'Alert' ? 'bg-red-500/20 text-red-400' : 'bg-here-neon/20 text-here-neon'}`}>
                      {loc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-here-muted font-mono mb-2">
                    <Navigation size={10} /> {Number(loc.lat).toFixed(4)}, {Number(loc.lon).toFixed(4)}
                  </div>
                  {loc.speed !== undefined && (
                    <div className="flex items-center gap-2 bg-here-card/50 p-2 rounded-lg">
                      <Zap size={12} className="text-here-teal" />
                      <p className="text-xs font-bold text-white">{loc.speed.toFixed(1)} <span className="text-[10px] text-here-muted font-normal">km/h</span></p>
                    </div>
                  )}
                  {loc.alertMessage && (
                    <div className="mt-2 text-[10px] text-red-400 font-bold bg-red-400/10 p-2 rounded border border-red-400/20">
                      SAFETY ALERT: {loc.alertMessage}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Corporate Footer / Contact Section */}
      <footer className="mt-auto pt-12 border-t border-here-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-here-accent flex items-center justify-center">
                <Activity size={18} className="text-white" />
              </div>
              <h4 className="text-lg font-bold text-white tracking-tight">Fleet Analytics <span className="text-here-accent">& Tracking</span></h4>
            </div>
            <p className="text-sm text-here-muted leading-relaxed max-w-xs">
              A state-of-the-art platform for real-time fleet logistics, behavioral analysis, and safety management.
            </p>
          </div>
          
          <div className="md:col-span-2 flex flex-col md:flex-row gap-8 justify-end">
            <ContactInfo icon={<User size={18} />} title="Managed By" value="Paramveer Singh" />
            <ContactInfo icon={<Phone size={18} />} title="Direct Line" value="+91 7658828271" />
            <ContactInfo icon={<Mail size={18} />} title="Official Email" value="paramveercse@gmail.com" />
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-here-border/30 text-center">
          <p className="text-[11px] text-here-muted uppercase tracking-[0.2em] font-medium opacity-50">
            © 2026 Fleet Operational Intelligence • Enterprise Monitoring Group
          </p>
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ title, value, icon, label, active, danger }) => (
  <div className="bg-here-card p-6 rounded-2xl border border-here-border flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300 shadow-lg group">
    <div className="flex justify-between items-start">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border ${active ? 'bg-here-neon/10 border-here-neon/30' : 'bg-here-dark border-here-border'}`}>
        {icon}
      </div>
      {active && <span className="w-2 h-2 rounded-full bg-here-neon animate-pulse shadow-[0_0_8px_#00e676]"></span>}
      {danger && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_#f87171]"></span>}
    </div>
    <div>
      <h4 className="text-here-muted text-xs font-bold uppercase tracking-widest mb-1">{title}</h4>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-white">{value}</p>
        <p className="text-[10px] text-here-muted font-bold uppercase">{label}</p>
      </div>
    </div>
  </div>
);

const ContactInfo = ({ icon, title, value }) => (
  <div className="flex items-center gap-4 bg-here-card/30 p-4 rounded-xl border border-here-border hover:bg-here-card/60 transition-colors">
    <div className="text-here-accent opacity-70">{icon}</div>
    <div>
      <p className="text-[10px] text-here-muted uppercase font-bold tracking-tight">{title}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  </div>
);

export default Dashboard;
