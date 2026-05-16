import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { socketService } from '../services/socket';
import { locationApi } from '../services/api';

// Reuse the neon icon
const neonIcon = new L.DivIcon({
  className: 'custom-neon-icon',
  html: `<div style="width: 16px; height: 16px; background-color: #00e676; border-radius: 50%; box-shadow: 0 0 15px #00e676; position: relative;"><div style="position: absolute; top: -8px; left: -8px; right: -8px; bottom: -8px; border-radius: 50%; background-color: rgba(0, 230, 118, 0.3); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const MapPage = () => {
  const [liveLocations, setLiveLocations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationsRes = await locationApi.getLocations();
        setLiveLocations(locationsRes.data);
      } catch (error) {
        console.error("Error fetching map data:", error);
      }
    };
    fetchData();

    socketService.connect();
    socketService.subscribe('location', (dataArray) => {
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        setLiveLocations(dataArray);
      }
    });

    return () => {
      socketService.unsubscribe('location');
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
      <h2 className="text-2xl font-bold text-white">Live Operations Map</h2>
      <div className="card flex-1 w-full relative overflow-hidden min-h-[500px]">
        <MapContainer 
          center={[18.5204, 73.8567]} 
          zoom={12} 
          style={{ height: '100%', width: '100%', background: '#0a0f18' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {liveLocations.map((loc) => (
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
    </div>
  );
};

export default MapPage;
