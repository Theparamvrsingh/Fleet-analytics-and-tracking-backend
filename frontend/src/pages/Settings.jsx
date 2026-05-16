import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, Smartphone } from 'lucide-react';

const Settings = () => {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingCard 
          icon={<Bell className="text-here-neon" />}
          title="Notifications"
          description="Configure email and push alerts for speeding and geofence breaches."
        />
        <SettingCard 
          icon={<Shield className="text-here-teal" />}
          title="Security & Access"
          description="Manage API keys and administrative permissions for fleet managers."
        />
        <SettingCard 
          icon={<Database className="text-here-accent" />}
          title="Data Storage"
          description="Set data retention policies for vehicle location history in MongoDB."
        />
        <SettingCard 
          icon={<Smartphone className="text-blue-400" />}
          title="Device Management"
          description="Pair mobile devices with specific vehicle registration numbers."
        />
      </div>
    </div>
  );
};

const SettingCard = ({ icon, title, description }) => (
  <div className="card p-6 flex items-start gap-4 hover:bg-here-card/50 transition-colors cursor-pointer border-here-border/50">
    <div className="w-12 h-12 rounded-xl bg-here-dark border border-here-border flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-here-muted leading-relaxed">{description}</p>
    </div>
  </div>
);

export default Settings;
