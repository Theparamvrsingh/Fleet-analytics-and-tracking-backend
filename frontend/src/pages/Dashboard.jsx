import React, { useState, useEffect } from 'react';
import { Activity, CarFront, AlertTriangle, Route } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { socketService } from '../services/socket';
import { locationApi, vehicleApi } from '../services/api';

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
  const [stats, setStats] = useState({
    active: 0,
    total: 0,
    alerts: 0,
    distance: 12540 // Mock distance for now
  });

  useEffect(() => {
    // Initial data fetch
    const fetchData = async () => {
      try {
        const [vehiclesRes, locationsRes] = await Promise.all([
          vehicleApi.getAll(),
          locationApi.getLocations()
        ]);
        
        setVehicles(vehiclesRes.data);
        
        // Count active vehicles (those with recent locations)
        const activeCount = locationsRes.data.filter(l => l.status === 'Active').length || Math.floor(vehiclesRes.data.length * 0.8);
        
        setStats(prev => ({
          ...prev,
          total: vehiclesRes.data.length,
          active: activeCount,
          alerts: Math.floor(Math.random() * 5) // Mock alerts
        }));

        setLiveLocations(locationsRes.data.slice(0, 10)); // Just keep latest 10 for display
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();

    // WebSocket connection for real-time updates
    socketService.connect();

    // Listen to the actual 'location' event sent from Spring Boot backend
    // It sends a List<SocketIOVehicleTrackingDataResponse>
    socketService.subscribe('location', (dataArray) => {
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        setLiveLocations(dataArray.slice(0, 10));
      } else if (dataArray && dataArray.reg) {
        // Fallback just in case it sends a single object
        setLiveLocations(prev => {
          const newLocations = [dataArray, ...prev].slice(0, 10);
          return newLocations;
        });
      }
    });

    return () => {
      socketService.unsubscribe('location');
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Fleet Overview</h2>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-here-neon animate-pulse"></span>
          <span className="text-sm text-here-muted">Live Tracking Active</span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Vehicles" 
          value={stats.total} 
          icon={<CarFront className="text-here-accent" />} 
          trend="+2 this month"
          trendUp={true}
        />
        <StatCard 
          title="Active Vehicles" 
          value={stats.active} 
          icon={<Activity className="text-here-neon" />} 
          trend="Currently online"
          trendUp={true}
        />
        <StatCard 
          title="Total Distance" 
          value={`${stats.distance} km`} 
          icon={<Route className="text-here-teal" />} 
          trend="+450 km today"
          trendUp={true}
        />
        <StatCard 
          title="Speed Alerts" 
          value={stats.alerts} 
          icon={<AlertTriangle className="text-red-400" />} 
          trend="-2 from yesterday"
          trendUp={false}
          danger={stats.alerts > 0}
        />
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Live Map Panel */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden relative group">
          <div className="flex-1 w-full h-full relative z-0">
            <MapContainer 
              center={[18.5204, 73.8567]} // Default to Pune, India coordinates or dynamic
              zoom={12} 
              style={{ height: '100%', width: '100%', background: '#0a0f18' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {liveLocations.map((loc, i) => (
                <Marker 
                  key={`${loc.reg}-${loc.timestamp}`} 
                  position={[loc.lat, loc.lon]}
                  icon={neonIcon}
                >
                  <Popup className="custom-popup">
                    <div className="text-center">
                      <strong className="block text-gray-800">{loc.reg}</strong>
                      <span className="text-xs text-gray-500">Status: {loc.status}</span>
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

        {/* Live Event Feed */}
        <div className="card flex flex-col overflow-hidden">
          <div className="p-5 border-b border-here-border bg-here-card/80">
            <h3 className="font-semibold text-white">Live Events</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {liveLocations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-here-muted text-sm gap-2">
                <Activity size={24} className="opacity-50" />
                <p>Waiting for vehicle data...</p>
              </div>
            ) : (
              liveLocations.map((loc, index) => (
                <div key={index} className="flex gap-4 items-start p-3 rounded-lg hover:bg-[#1f2a3a] transition-colors border border-transparent hover:border-here-border group">
                  <div className="w-8 h-8 rounded-full bg-here-teal/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-here-teal/30">
                    <CarFront size={14} className="text-here-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{loc.reg}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-here-muted font-mono">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-here-muted whitespace-nowrap">
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
