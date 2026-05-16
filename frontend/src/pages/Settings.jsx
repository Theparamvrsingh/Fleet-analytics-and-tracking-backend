import React, { useState } from 'react';
import { Bell, Shield, Smartphone, Globe, Save, CheckCircle2, Database } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    speedAlerts: true,
    geofenceAlerts: true,
    twoFactor: false,
    publicMap: true
  });

  const [saved, setSaved] = useState(false);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">System Configuration</h2>
          <p className="text-here-muted text-sm">Manage fleet tracking parameters and AI agent thresholds</p>
        </div>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${saved ? 'bg-here-neon text-here-dark scale-105' : 'bg-here-accent text-white hover:bg-here-accent/80 hover:scale-105 active:scale-95'}`}
        >
          {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {saved ? 'Settings Applied' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-here-accent font-bold uppercase tracking-wider text-xs">
            <Bell size={14} />
            Alerting & Notifications
          </div>
          
          <SettingCard 
            title="Real-time Speed Alerts" 
            description="Notify when vehicles exceed 80 km/h (AI Logic threshold)"
            icon={<Shield size={20} className="text-here-neon" />}
            active={settings.speedAlerts}
            onToggle={() => toggleSetting('speedAlerts')}
          />
          <SettingCard 
            title="Geofence Breach Protocol" 
            description="Trigger emergency alerts when restricted zones are entered"
            icon={<Globe size={20} className="text-here-teal" />}
            active={settings.geofenceAlerts}
            onToggle={() => toggleSetting('geofenceAlerts')}
          />
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-here-accent font-bold uppercase tracking-wider text-xs">
            <Smartphone size={14} />
            Device Management
          </div>
          
          <SettingCard 
            title="Browser GPS Streaming" 
            description="Allow mobile browsers to broadcast location via Geolocation API"
            icon={<Smartphone size={20} className="text-blue-400" />}
            active={settings.notifications}
            onToggle={() => toggleSetting('notifications')}
          />
          <SettingCard 
            title="Data Retention Policy" 
            description="Archive vehicle history to MongoDB after 30 days"
            icon={<Database size={20} className="text-purple-400" />}
            active={settings.publicMap}
            onToggle={() => toggleSetting('publicMap')}
          />
        </section>
      </div>

      <div className="card p-8 bg-gradient-to-r from-[#0f1621] to-[#161e2c] border-dashed border-here-border/50 border-2 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-here-accent/10 flex items-center justify-center shrink-0 border border-here-accent/20">
          <Shield size={32} className="text-here-accent" />
        </div>
        <div className="text-center md:text-left">
          <h4 className="text-xl font-bold text-white">Advanced AI Enterprise Controls</h4>
          <p className="text-sm text-here-muted max-w-2xl mt-1 leading-relaxed">
            Customizable speed thresholds, dynamic geofence polygon creation, and Apache Kafka cluster integration for 10,000+ devices are available in the Enterprise Tier. Currently operating on standard HA-Zone-1 parameters.
          </p>
        </div>
      </div>
    </div>
  );
};

const SettingCard = ({ title, description, icon, active, onToggle }) => (
  <div 
    onClick={onToggle}
    className="card p-6 flex items-center justify-between hover:border-here-border/80 transition-all cursor-pointer group bg-here-card/40"
  >
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-xl bg-here-dark border border-here-border/50 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-here-card group-hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        {icon}
      </div>
      <div>
        <h4 className="text-base font-bold text-white group-hover:text-here-accent transition-colors">{title}</h4>
        <p className="text-xs text-here-muted mt-1 leading-snug">{description}</p>
      </div>
    </div>
    <div className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${active ? 'bg-here-neon shadow-[0_0_10px_rgba(0,230,118,0.3)]' : 'bg-here-border'}`}>
      <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${active ? 'translate-x-7' : 'translate-x-0'}`}></div>
    </div>
  </div>
);

export default Settings;
