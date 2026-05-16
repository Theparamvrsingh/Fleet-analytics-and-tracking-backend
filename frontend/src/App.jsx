import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import TrackerApp from './pages/TrackerApp';
import MapPage from './pages/MapPage';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/tracker" element={<TrackerApp />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="map" element={<MapPage />} />
          <Route path="ai" element={<AIInsights />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
