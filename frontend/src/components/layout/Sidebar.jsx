import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CarFront, Settings, Map, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Vehicles', path: '/vehicles', icon: <CarFront size={20} /> },
    { name: 'Live Map', path: '/map', icon: <Map size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}
      
      <aside className={`fixed md:relative z-50 w-64 bg-here-card border-r border-here-border flex flex-col h-full shrink-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-here-border">
          <h1 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
            Fleet<span className="text-here-teal">Intelligence</span>
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-here-muted hover:text-white">
            <X size={20} />
          </button>
        </div>
      
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-here-teal text-white shadow-[0_4px_12px_rgba(0,191,165,0.3)]'
                  : 'text-here-muted hover:text-white hover:bg-[#28364a]'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
      

    </aside>
    </>
  );
};

export default Sidebar;
