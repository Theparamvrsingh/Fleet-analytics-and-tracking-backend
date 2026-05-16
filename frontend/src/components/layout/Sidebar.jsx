import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CarFront, Settings, Map, Navigation, Brain, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { name: 'Dashboard',    path: '/',        icon: <LayoutDashboard size={20} />, end: true },
    { name: 'Vehicles',     path: '/vehicles', icon: <CarFront size={20} /> },
    { name: 'Live Map',     path: '/map',      icon: <Map size={20} /> },
    { name: 'AI Insights',  path: '/ai',       icon: <Brain size={20} />, badge: 'AI' },
    { name: 'Settings',     path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed md:relative z-50 w-64 bg-here-card border-r border-here-border flex flex-col h-full shrink-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-here-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-here-neon shadow-[0_0_8px_#00e676] animate-pulse" />
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">
              Fleet<span className="text-here-teal">Intelligence</span>
            </h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-here-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
                  isActive
                    ? 'bg-here-teal text-white shadow-[0_4px_12px_rgba(0,191,165,0.3)]'
                    : 'text-here-muted hover:text-white hover:bg-[#28364a]'
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="text-[8px] bg-here-accent/20 text-here-accent px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-here-accent/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <div className="my-2 border-t border-here-border/40" />

          <a
            href="/tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-here-muted hover:text-white hover:bg-[#28364a] group"
          >
            <Navigation size={20} className="group-hover:text-here-neon transition-colors" />
            <span className="flex-1">Driver Tracker</span>
            <span className="text-[8px] bg-here-neon/10 text-here-neon px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-here-neon/20">
              Mobile
            </span>
          </a>
        </nav>

        <div className="p-4 border-t border-here-border/40">
          <div className="flex items-center gap-2 px-3">
            <span className="w-1.5 h-1.5 rounded-full bg-here-neon animate-pulse" />
            <span className="text-[10px] text-here-muted uppercase font-bold tracking-widest">All systems live</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
