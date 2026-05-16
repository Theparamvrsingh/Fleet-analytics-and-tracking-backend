import React, { useState, useEffect } from 'react';
import { Activity, CarFront, AlertTriangle, Route } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { socketService } from '../services/socket';
import { locationApi, vehicleApi } from '../services/api';

// Component to auto-center map when locations update
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  if (center && center[0] && center[1]) {
    map.setView(center, zoom);
  }
  return null;
};

// Fix for default Leaflet icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Neon Icon for vehicles
const neonIcon = new L.DivIcon({
  className: 'custom-neon-icon',
  html: `<div style="width: 16px; height: 16px; background-color: #00e676; border-radius: 50%; box-shadow: 0 0 15px #00e676; position: relative;"><div style="position: absolute; top: -8px; left: -8px; right: -8px; bottom: -8px; border-radius: 50%; background-color: rgba(0, 230, 118, 0.3); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const Dashboard = () => {
  const [liveLocations, setLiveLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]); // Default Pune
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

    // Auto-center map to the first active vehicle if available
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
      socketService.disconnect();
    };
  }, [vehicles.length]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Fleet Overview</h2>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-here-neon animate-pulse"></span>
          <span className="text-sm text-here-muted">Live Tracking Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Vehicles" 
          value={stats.total} 
          icon={<CarFront className="text-here-accent" />} 
          trend="In database"
          trendUp={true}
        />
        <StatCard 
          title="Active Vehicles" 
          value={stats.active} 
          icon={<Activity className="text-here-neon" />} 
          trend="Tracking now"
          trendUp={stats.active > 0}
        />
        <StatCard 
          title="Total Distance" 
          value={`${stats.distance} km`} 
          icon={<Route className="text-here-teal" />} 
          trend="Session total"
          trendUp={true}
        />
        <StatCard 
          title="AI Behavior Alerts" 
          value={stats.alerts} 
          icon={<AlertTriangle className="text-red-400" />} 
          trend="Anomalies detected"
          trendUp={false}
          danger={stats.alerts > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 card flex flex-col overflow-hidden relative group">
          <div className="flex-1 w-full h-full relative z-0">
            <MapContainer 
              center={mapCenter}
              zoom={13} 
              style={{ height: '100%', width: '100%', background: '#0a0f18' }}
              zoomControl={false}
              attributionControl={false}
            >
              <ChangeView center={mapCenter} zoom={13} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {liveLocations.map((loc, i) => (
                <Marker 
                  key={`${loc.reg}-${i}`} 
                  position={[loc.lat, loc.lon]}
                  icon={neonIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="block text-gray-800">{loc.reg}</strong>
                      <span className="text-xs text-gray-500">Status: {loc.status}</span>
                      {loc.alertMessage && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">{loc.alertMessage}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          
          <div className="absolute top-0 left-0 w-full z-[1000] p-5 bg-gradient-to-b from-here-card/90 to-transparent flex justify-between items-center pointer-events-none">
            <h3 className="font-semibold text-white pointer-events-auto">Live Tracking Map</h3>
          </div>
        </div>

        <div className="card flex flex-col overflow-hidden">
          <div className="p-5 border-b border-here-border bg-here-card/80 flex justify-between items-center">
            <h3 className="font-semibold text-white">Live Events & AI Insights</h3>
            {stats.alerts > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse border border-red-500/30">
                {stats.alerts} Issues
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {liveLocations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-here-muted text-sm gap-2">
                <Activity size={24} className="opacity-50" />
                <p>Waiting for vehicle data...</p>
              </div>
            ) : (
              liveLocations.map((loc, index) => (
                <div key={index} className={`flex gap-4 items-start p-3 rounded-lg transition-colors border ${loc.status === 'Alert' ? 'bg-red-500/10 border-red-500/30' : 'hover:bg-[#1f2a3a] border-transparent hover:border-here-border'} group`}>
                  <div className={`w-8 h-8 rounded-full ${loc.status === 'Alert' ? 'bg-red-500/20' : 'bg-here-teal/20'} flex items-center justify-center shrink-0 mt-0.5`}>
                    {loc.status === 'Alert' ? <AlertTriangle size={14} className="text-red-400" /> : <CarFront size={14} className="text-here-teal" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${loc.status === 'Alert' ? 'text-red-400' : 'text-white'}`}>{loc.reg}</p>
                    <div className="flex flex-col mt-1">
                      <span className="text-xs text-here-muted font-mono">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</span>
                      {loc.alertMessage && (
                        <span className="text-[10px] text-red-400 font-medium mt-1">
                          ⚠️ {loc.alertMessage}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-here-muted whitespace-nowrap text-[10px]">
                    {new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendUp, danger }) => (
  <div className="card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 rounded-xl bg-[#0f1621] border border-here-border flex items-center justify-center shadow-inner">
        {icon}
      </div>
      {danger && (
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </div>
    <div>
      <h4 className="text-here-muted text-sm font-medium mb-1">{title}</h4>
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-bold text-white">{value}</p>
        <span className={`text-xs font-medium ${trendUp ? 'text-here-neon' : (danger ? 'text-red-400' : 'text-here-muted')}`}>
          {trend}
        </span>
      </div>
    </div>
  </div>
);

export default Dashboard;
