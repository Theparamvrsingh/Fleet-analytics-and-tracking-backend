import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      <div className="card p-8 flex flex-col items-center justify-center min-h-[400px]">
        <SettingsIcon size={48} className="text-here-muted mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">Configuration Panel</h3>
        <p className="text-here-muted text-center max-w-md">
          This is where admins would configure geofences, alert thresholds, and notification preferences. 
          (Coming soon in a future update).
        </p>
      </div>
    </div>
  );
};

export default Settings;
