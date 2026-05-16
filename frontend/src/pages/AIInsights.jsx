import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Gauge, ShieldCheck, Navigation, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { locationApi, vehicleApi } from '../services/api';
import { socketService } from '../services/socket';

export default function AIInsights() {
  const [vehicles, setVehicles] = useState([]);
  const [liveLocations, setLiveLocations] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [historyByReg, setHistoryByReg] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expanded, setExpanded] = useState(null);

  /* ─── bootstrap ─── */
  useEffect(() => {
    vehicleApi.getAll().then(r => setVehicles(r.data)).catch(console.error);
    locationApi.getLocations().then(r => {
      const valid = (r.data || []).filter(l => l.lat && l.lon);
      setLiveLocations(valid);
      extractAlerts(valid);
    }).catch(console.error);

    socketService.connect();
    socketService.subscribe('location', data => {
      if (!Array.isArray(data)) return;
      const valid = data.filter(l => l.lat && l.lon);
      setLiveLocations(valid);
      extractAlerts(valid);
    });
    return () => socketService.unsubscribe('location');
  }, []);

  const extractAlerts = (locs) => {
    const alerts = locs
      .filter(l => l.status === 'Alert' || l.alertMessage)
      .map(l => ({ ...l, time: l.timestamp || new Date().toISOString() }));
    setAllAlerts(prev => {
      const merged = [...alerts, ...prev];
      // deduplicate by reg+message
      const seen = new Set();
      return merged.filter(a => {
        const k = `${a.reg}-${a.alertMessage}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 50);
    });
  };

  /* ─── load per-vehicle history for detailed analysis ─── */
  const loadHistory = useCallback(async (reg) => {
    if (historyByReg[reg]) { setExpanded(reg); return; }
    setLoadingHistory(true);
    try {
      const res = await locationApi.getHistory(reg);
      const locs = res.data.locations || [];
      setHistoryByReg(prev => ({ ...prev, [reg]: locs }));
      setExpanded(reg);
    } catch { console.error('History fetch failed'); }
    finally { setLoadingHistory(false); }
  }, [historyByReg]);

  /* ─── per-vehicle AI analysis from stored history ─── */
  const analyse = (reg) => {
    const locs = historyByReg[reg] || [];
    const speedEvents = locs.filter(l => l.alertMessage?.includes('Speeding'));
    const zoneEvents  = locs.filter(l => l.alertMessage?.includes('Restricted'));
    const maxSpeed    = locs.reduce((m, l) => Math.max(m, l.speed || 0), 0);
    const avgSpeed    = locs.length
      ? (locs.reduce((s, l) => s + (l.speed || 0), 0) / locs.length).toFixed(1)
      : '—';
    return { speedEvents, zoneEvents, maxSpeed, avgSpeed, totalPings: locs.length };
  };

  /* ─── live stats ─── */
  const activeAlerts  = allAlerts.filter(a => a.alertMessage).length;
  const speedAlerts   = allAlerts.filter(a => a.alertMessage?.includes('Speeding')).length;
  const zoneAlerts    = allAlerts.filter(a => a.alertMessage?.includes('Restricted')).length;

  return (
    <div className="flex flex-col gap-8">
      {/* header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Behavior Insights</h2>
        <p className="text-here-muted text-sm mt-1">
          Powered by real-time Haversine speed analysis &amp; geofence monitoring
        </p>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <AlertStat icon={<AlertTriangle className="text-red-400" />} label="Total Alerts (session)" value={activeAlerts} danger />
        <AlertStat icon={<Gauge className="text-orange-400" />}      label="Over-speed Events"      value={speedAlerts} warn />
        <AlertStat icon={<ShieldCheck className="text-here-teal" />} label="Zone Breach Events"     value={zoneAlerts} />
      </div>

      {/* live alert feed */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-here-border bg-here-dark/40 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" /> Live Alert Feed
            </h3>
            <p className="text-[10px] text-here-muted mt-0.5 uppercase tracking-widest">Auto-updates via WebSocket</p>
          </div>
          {allAlerts.length === 0 && (
            <span className="text-[10px] bg-here-neon/10 text-here-neon px-2 py-1 rounded-full font-bold border border-here-neon/20">
              All Clear
            </span>
          )}
        </div>

        <div className="divide-y divide-here-border/20 max-h-64 overflow-y-auto">
          {allAlerts.length === 0 ? (
            <div className="p-8 text-center text-here-muted text-sm opacity-40">
              No anomalies detected — fleet operating normally
            </div>
          ) : (
            allAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-here-dark/40 transition-colors">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${a.alertMessage?.includes('Speeding') ? 'bg-orange-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-white">{a.reg}</p>
                    <span className="text-[10px] text-here-muted ml-2 shrink-0">
                      {a.time ? new Date(a.time).toLocaleTimeString() : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-400 font-bold mt-0.5">⚠️ {a.alertMessage}</p>
                  {a.speed !== undefined && (
                    <p className="text-[10px] text-here-muted mt-0.5">Speed: {a.speed.toFixed(1)} km/h</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* per-vehicle analysis */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Navigation size={16} className="text-here-teal" /> Per-Vehicle AI Analysis
        </h3>
        <div className="space-y-3">
          {vehicles.length === 0 ? (
            <div className="card p-8 text-center text-here-muted text-sm opacity-40">
              No registered vehicles
            </div>
          ) : (
            vehicles.map(v => {
              const live    = liveLocations.find(l => l.reg === v.reg);
              const isOpen  = expanded === v.reg;
              const stats   = isOpen ? analyse(v.reg) : null;

              return (
                <div key={v.id} className={`card overflow-hidden transition-all ${live?.status === 'Alert' ? 'border-red-500/30' : ''}`}>
                  <button
                    onClick={() => isOpen ? setExpanded(null) : loadHistory(v.reg)}
                    className="w-full flex items-center justify-between p-5 hover:bg-here-dark/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${live ? (live.status === 'Alert' ? 'bg-red-400 animate-ping' : 'bg-here-neon') : 'bg-here-muted'}`} />
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{v.reg}</p>
                        <p className="text-[11px] text-here-muted">{v.make} {v.model} ({v.year})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {live && (
                        <>
                          {live.speed !== undefined && (
                            <span className="text-xs font-bold text-here-teal">{live.speed.toFixed(1)} km/h</span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${live.status === 'Alert' ? 'bg-red-500/20 text-red-400' : 'bg-here-neon/10 text-here-neon'}`}>
                            {live.status}
                          </span>
                        </>
                      )}
                      {!live && <span className="text-[10px] text-here-muted uppercase">Offline</span>}
                      {loadingHistory && expanded !== v.reg ? null : (
                        <ChevronRight size={16} className={`text-here-muted transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      )}
                    </div>
                  </button>

                  {isOpen && stats && (
                    <div className="px-5 pb-5 border-t border-here-border/30 pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <MiniStat label="Total Pings" value={stats.totalPings} />
                        <MiniStat label="Max Speed"   value={`${stats.maxSpeed.toFixed(1)} km/h`} danger={stats.maxSpeed > 80} />
                        <MiniStat label="Avg Speed"   value={`${stats.avgSpeed} km/h`} />
                        <MiniStat label="Zone Alerts" value={stats.zoneEvents.length} danger={stats.zoneEvents.length > 0} />
                      </div>

                      {stats.speedEvents.length > 0 && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-3">
                          <p className="text-[11px] text-orange-400 font-bold uppercase mb-1">Over-speed events ({stats.speedEvents.length})</p>
                          {stats.speedEvents.slice(0, 3).map((e, i) => (
                            <p key={i} className="text-[10px] text-here-muted">• {e.alertMessage} at {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '—'}</p>
                          ))}
                        </div>
                      )}

                      {stats.zoneEvents.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                          <p className="text-[11px] text-red-400 font-bold uppercase mb-1">Zone breaches ({stats.zoneEvents.length})</p>
                          {stats.zoneEvents.slice(0, 3).map((e, i) => (
                            <p key={i} className="text-[10px] text-here-muted">• {e.alertMessage}</p>
                          ))}
                        </div>
                      )}

                      {stats.speedEvents.length === 0 && stats.zoneEvents.length === 0 && (
                        <div className="bg-here-neon/5 border border-here-neon/20 rounded-xl p-3 flex items-center gap-2">
                          <ShieldCheck size={14} className="text-here-neon" />
                          <p className="text-[11px] text-here-neon font-bold">No anomalies detected in last 20 pings</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AlertStat({ icon, label, value, danger, warn }) {
  return (
    <div className={`card p-5 flex items-center gap-4 ${danger && value > 0 ? 'border-red-500/30' : warn && value > 0 ? 'border-orange-500/30' : ''}`}>
      <div className="w-12 h-12 rounded-xl bg-here-dark border border-here-border flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-here-muted uppercase font-bold tracking-widest">{label}</p>
        <p className={`text-3xl font-black ${danger && value > 0 ? 'text-red-400' : warn && value > 0 ? 'text-orange-400' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, danger }) {
  return (
    <div className="bg-here-dark/50 border border-here-border/30 rounded-xl p-3">
      <p className="text-[9px] text-here-muted uppercase font-bold tracking-widest">{label}</p>
      <p className={`text-base font-black mt-1 ${danger ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
