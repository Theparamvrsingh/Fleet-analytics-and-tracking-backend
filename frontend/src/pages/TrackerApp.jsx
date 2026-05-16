import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, StopCircle, Car } from 'lucide-react';
import { locationApi } from '../services/api';

const TrackerApp = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [watchId, setWatchId] = useState(null);
  
  // A random registration number for the demo driver
  const [regNumber] = useState(`DEMO-${Math.floor(Math.random() * 10000)}`);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setError('');

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lon: longitude });

        // Send to backend
        try {
          console.log(`Sending location to backend for ${regNumber}:`, { latitude, longitude });
          await locationApi.create({
            reg: regNumber,
            lat: latitude,
            lon: longitude,
            status: 'Active'
          });
          console.log('Location sent successfully');
        } catch (err) {
          console.error('Failed to send location to server', err);
        }
      },
      (err) => {
        setError(`Error getting location: ${err.message}`);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
    
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    setIsTracking(false);
    setPosition(null);
    setWatchId(null);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="min-h-screen bg-here-dark flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full card p-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-here-teal/20 flex items-center justify-center mb-6">
          <Car size={32} className="text-here-teal" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Driver Tracker</h1>
        <p className="text-here-muted mb-8 text-sm">
          Your temporary vehicle ID is <strong className="text-white bg-[#0f1621] px-2 py-1 rounded">{regNumber}</strong>. 
          When you start tracking, your location will instantly appear on the admin dashboard.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {isTracking ? (
          <div className="w-full flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
              <div className="absolute inset-0 border-4 border-here-neon/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-here-neon/60 rounded-full animate-pulse"></div>
              <div className="w-16 h-16 bg-here-neon rounded-full flex items-center justify-center shadow-[0_0_30px_#00e676] z-10">
                <Navigation size={28} className="text-[#0f1621]" />
              </div>
            </div>
            
            <p className="text-here-neon font-medium mb-2">Broadcasting Location...</p>
            {position && (
              <p className="text-here-muted font-mono text-sm mb-8">
                {position.lat.toFixed(5)}, {position.lon.toFixed(5)}
              </p>
            )}

            <button 
              onClick={stopTracking}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <StopCircle size={20} />
              Stop Tracking
            </button>
          </div>
        ) : (
          <button 
            onClick={startTracking}
            className="w-full bg-here-teal hover:bg-[#00a892] text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-here-teal/20 flex items-center justify-center gap-2"
          >
            <MapPin size={20} />
            Start Driving
          </button>
        )}
      </div>
      <div className="mt-8 text-here-muted text-xs">
        Make sure you allow location permissions when prompted.
      </div>
    </div>
  );
};

export default TrackerApp;
