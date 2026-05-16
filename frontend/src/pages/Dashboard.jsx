import React, { useState, useEffect } from 'react';
import { Activity, CarFront, AlertTriangle, Route, Server, Cpu, Database, Zap, ArrowRight, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { socketService } from '../services/socket';
import { locationApi, vehicleApi } from '../services/api';

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  if (center && center[0] && center[1]) {
    map.setView(center, zoom);
  }
  return null;
};

const neonIcon = new L.DivIcon({
  className: 'custom-neon-icon',
  html: `<div style="width: 16px; height: 16px; background-color: #00e676; border-radius: 50%; box-shadow: 0 0 15px #00e676; position: relative;"><div style="position: absolute; top: -8px; left: -8px; right: -8px; bottom: -8px; border-radius: 50%; background-color: rgba(0, 230, 118, 0.3); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const Dashboard = () => {
  const [liveLocations, setLiveLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]); 
  const [stats, setStats] = useState({
    active: 0,
    total: 0,
    alerts: 0,
    distance: 0
  });

  const updateDashboardStats = (locations, totalVehicles) => {
    const activeCount = locations.length;
    setStats(prev => ({
      ...prev,
      total: totalVehicles,
      active: activeCount,
      distance: (locations.length * 1.2).toFixed(1),
      alerts: locations.filter(l => l.status === 'Alert').length
    }));
    if (locations.length > 0) {
      setMapCenter([locations[0].lat, locations[0].lon]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, locationsRes] = await Promise.all([
          vehicleApi.getAll(),
          locationApi.getLocations()
        ]);
        setVehicles(vehiclesRes.data);
        setLiveLocations(locationsRes.data);
        updateDashboardStats(locationsRes.data, vehiclesRes.data.length);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
    socketService.connect();
    socketService.subscribe('location', (dataArray) => {
      if (Array.isArray(dataArray)) {
        setLiveLocations(dataArray);
        updateDashboardStats(dataArray, vehicles.length);
      }
    });
    return () => {
      socketService.unsubscribe('location');
    };
  }, [vehicles.length]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Fleet Analytics & Backend Tracking</h2>
          <p className="text-here-muted text-sm flex items-center gap-2">
            Managed by Paramveer Singh | +91 7658828271 | paramveercse@gmail.com
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#0f1621] px-4 py-2 rounded-full border border-here-border">
          <span className="w-2 h-2 rounded-full bg-here-neon animate-pulse shadow-[0_0_8px_#00e676]"></span>
          <span className="text-xs font-semibold text-here-neon uppercase tracking-wider">Live Monitor Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registered Fleet" value={stats.total} icon={<CarFront className="text-here-accent" />} trend="Secured Assets" trendUp={true} />
        <StatCard title="Live Movements" value={stats.active} icon={<Activity className="text-here-neon" />} trend="Real-time Tracking" trendUp={stats.active > 0} />
        <StatCard title="Current Trip Distance" value={`${stats.distance} km`} icon={<Route className="text-here-teal" />} trend="Auto-calculated" trendUp={true} />
        <StatCard title="Safety Alerts" value={stats.alerts} icon={<AlertTriangle className="text-red-400" />} trend="Driver Behavior Alerts" trendUp={false} danger={stats.alerts > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card flex flex-col h-[550px] overflow-hidden relative group border-2 border-here-border/50">
          <div className="flex-1 w-full h-full relative z-0">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', background: '#0a0f18' }} zoomControl={false} attributionControl={false}>
              <ChangeView center={mapCenter} zoom={13} />
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {liveLocations.map((loc, i) => (
                <Marker key={`${loc.reg || i}-${i}`} position={[Number(loc.lat), Number(loc.lon)]} icon={neonIcon}>
                  <Popup>
                    <div className="p-1 min-w-[120px]">
                      <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-1">
                        <CarFront size={14} className="text-here-teal" />
                        <strong className="text-gray-800">{loc.reg || 'Vehicle'}</strong>
                      </div>
                      <div className="text-[11px] text-gray-600 space-y-1">
                        <p className="flex justify-between"><span>Status:</span> <span className={loc.status === 'Alert' ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{loc.status}</span></p>
                        {loc.speed !== undefined && <p className="flex justify-between"><span>Speed:</span> <span className="font-bold">{loc.speed.toFixed(1)} km/h</span></p>}
                        {loc.alertMessage && <p className="text-red-500 italic mt-1 border-t pt-1">⚠️ {loc.alertMessage}</p>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="card flex flex-col h-[550px] overflow-hidden">
          <div className="p-5 border-b border-here-border bg-here-card/80 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-white">Live Logistics Stream</h3>
              <p className="text-[10px] text-here-muted uppercase tracking-widest">Real-time Data Channel Active</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {liveLocations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-here-muted text-sm gap-2 opacity-50">
                <Activity size={32} className="animate-spin-slow" />
                <p>Waiting for vehicle movement...</p>
              </div>
            ) : (
              liveLocations.map((loc, index) => (
                <div key={index} className={`flex gap-4 items-start p-3 rounded-xl transition-all border ${loc.status === 'Alert' ? 'bg-red-500/10 border-red-500/30' : 'bg-here-dark/40 border-here-border/30 hover:border-here-border'}`}>
                  <div className={`w-10 h-10 rounded-xl ${loc.status === 'Alert' ? 'bg-red-500/20' : 'bg-here-teal/20'} flex items-center justify-center shrink-0`}>
                    {loc.status === 'Alert' ? <AlertTriangle size={18} className="text-red-400" /> : <CarFront size={18} className="text-here-teal" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${loc.status === 'Alert' ? 'text-red-400' : 'text-white'}`}>{loc.reg || 'VEHICLE'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-here-muted font-mono bg-here-dark/80 px-1.5 py-0.5 rounded">
                        {loc.lat ? loc.lat.toFixed(4) : '0.000'}, {loc.lon ? loc.lon.toFixed(4) : '0.000'}
                      </span>
                      {loc.speed !== undefined && <span className="text-[11px] text-here-teal font-bold">{loc.speed.toFixed(1)} km/h</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-here-accent pl-3">How Tracking Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WorkflowStep icon={<Smartphone className="text-blue-400" />} title="Driver Broadcasting" tech="Secure GPS Feed" description="Driver's mobile device sends its exact location to our central hub at high frequency." step="01" />
          <WorkflowStep icon={<Cpu className="text-here-neon" />} title="Behavior Analysis" tech="Intelligent Monitoring" description="Our system automatically detects if a vehicle is speeding or entering restricted zones." step="02" />
          <WorkflowStep icon={<Zap className="text-here-teal" />} title="Instant Updates" tech="Real-time Display" description="Managers see the movement on this map instantly with zero delay or page reloading." step="03" />
        </div>

        <div className="card p-6 bg-gradient-to-br from-here-card to-here-dark border-here-border/50">
          <div className="flex items-start gap-4">
            <Info size={24} className="text-here-accent shrink-0" />
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">प्रोजेक्ट विवरण (Project Summary)</h4>
              <p className="text-sm text-here-muted">यह प्रोजेक्ट एक <strong>"स्मार्ट गाड़ी ट्रैकिंग सिस्टम"</strong> है जो असली समय में गाड़ियों की लोकेशन और स्पीड को ट्रैक करता है।</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-here-dark/50 p-3 rounded-lg border border-here-border/30">
                  <p className="text-here-teal font-bold text-xs uppercase mb-1">रियल-टाइम ट्रैकिंग</p>
                  <p className="text-[11px] text-here-muted">मैप पर लाइव गाड़ी की लोकेशन देखना और उसके हर मूवमेंट को ट्रैक करना।</p>
                </div>
                <div className="bg-here-dark/50 p-3 rounded-lg border border-here-border/30">
                  <p className="text-red-400 font-bold text-xs uppercase mb-1">ऑटोमैटिक अलर्ट</p>
                  <p className="text-[11px] text-here-muted">तेज़ रफ़्तार (80km/h+) और मना किए गए इलाकों में घुसने पर सिस्टम खबर देता है।</p>
                </div>
              </div>
              <div className="pt-3 border-t border-here-border/20 text-[11px] text-here-muted">
                <strong>Contact:</strong> Paramveer Singh | +91 7658828271 | paramveercse@gmail.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendUp, danger }) => (
  <div className="card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300 border-here-border/30">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 rounded-xl bg-here-dark border border-here-border flex items-center justify-center">{icon}</div>
      {danger && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
    </div>
    <div>
      <h4 className="text-here-muted text-sm font-semibold uppercase tracking-wider mb-1">{title}</h4>
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <span className={`text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded ${trendUp ? 'bg-here-neon/10 text-here-neon' : (danger ? 'bg-red-500/10 text-red-400' : 'bg-here-border text-here-muted')}`}>{trend}</span>
      </div>
    </div>
  </div>
);

const WorkflowStep = ({ icon, title, tech, description, step }) => (
  <div className="card p-6 border-here-border/50 hover:border-here-accent transition-all group relative overflow-hidden">
    <div className="absolute -right-4 -top-4 text-6xl font-black text-white/5">{step}</div>
    <div className="mb-4 w-10 h-10 rounded-lg bg-here-dark flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
    <h4 className="text-white font-bold mb-1">{title}</h4>
    <p className="text-[10px] text-here-accent font-bold uppercase mb-3">{tech}</p>
    <p className="text-xs text-here-muted leading-relaxed">{description}</p>
  </div>
);

const Smartphone = ({ className, size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);

export default Dashboard;
