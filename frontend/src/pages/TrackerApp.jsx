import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, StopCircle, Car, Wifi } from 'lucide-react';
import { locationApi, vehicleApi } from '../services/api';

const TrackerApp = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [watchId, setWatchId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedReg, setSelectedReg] = useState('');
  const [status, setStatus] = useState('Loading vehicles...');

  useEffect(() => {
    vehicleApi.getAll().then(res => {
      setVehicles(res.data);
      if (res.data.length > 0) {
        setSelectedReg(res.data[0].reg);
        setStatus('Select your vehicle and start tracking.');
      } else {
        setStatus('No vehicles registered. Go to Vehicles page to add one.');
      }
    }).catch(() => setStatus('Could not load vehicles. Check connection.'));
  }, []);

  const startTracking = () => {
    if (!selectedReg) { setError('Please select a vehicle first.'); return; }
    if (!navigator.geolocation) { setError('Geolocation not supported by browser.'); return; }

    setIsTracking(true);
    setError('');

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lon: longitude });
        try {
          await locationApi.create({ reg: selectedReg, lat: latitude, lon: longitude, status: 'Active' });
        } catch (err) {
          console.error('Failed to send location:', err);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    setIsTracking(false);
    setPosition(null);
    setWatchId(null);
  };

  useEffect(() => {
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [watchId]);

  return (
    <div className="min-h-screen bg-here-dark flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full card p-8 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-here-teal/20 border border-here-teal/30 flex items-center justify-center">
          <Car size={32} className="text-here-teal" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Driver Tracker</h1>
          <p className="text-here-muted text-sm">{status}</p>
        </div>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">{error}</div>
        )}

        {!isTracking ? (
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs text-here-muted uppercase font-bold tracking-wider">Select Your Vehicle</label>
              <select
                value={selectedReg}
                onChange={e => setSelectedReg(e.target.value)}
                className="input-field"
                disabled={vehicles.length === 0}
              >
                {vehicles.length === 0
                  ? <option>No vehicles registered</option>
                  : vehicles.map(v => <option key={v.id} value={v.reg}>{v.reg} — {v.make} {v.model}</option>)
                }
              </select>
            </div>
            <button
              onClick={startTracking}
              disabled={vehicles.length === 0}
              className="w-full bg-here-teal hover:bg-[#00a892] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-here-teal/20 flex items-center justify-center gap-2"
            >
              <MapPin size={20} /> Start Broadcasting Location
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-here-neon/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-here-neon/40 rounded-full animate-pulse"></div>
              <div className="w-14 h-14 bg-here-neon rounded-full flex items-center justify-center shadow-[0_0_30px_#00e676] z-10">
                <Navigation size={24} className="text-here-dark" />
              </div>
            </div>

            <div className="bg-here-dark p-4 rounded-xl w-full space-y-2 border border-here-border">
              <div className="flex justify-between text-sm">
                <span className="text-here-muted">Vehicle</span>
                <span className="text-white font-bold font-mono">{selectedReg}</span>
              </div>
              {position && (
                <div className="flex justify-between text-xs">
                  <span className="text-here-muted">Live Position</span>
                  <span className="text-here-teal font-mono">{position.lat.toFixed(5)}, {position.lon.toFixed(5)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 justify-center pt-1">
                <Wifi size={12} className="text-here-neon animate-pulse" />
                <span className="text-here-neon text-xs font-bold">Broadcasting to Dashboard</span>
              </div>
            </div>

            <button
              onClick={stopTracking}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <StopCircle size={20} /> Stop Tracking
            </button>
          </div>
        )}
      </div>
      <p className="mt-6 text-here-muted text-xs opacity-50">Allow location permissions when the browser prompts you.</p>
    </div>
  );
};

export default TrackerApp;
