import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="h-16 bg-here-card border-b border-here-border flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggleSidebar} className="md:hidden text-here-muted hover:text-white">
          <Menu size={24} />
        </button>
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-here-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search vehicles, locations..." 
              className="w-full bg-here-dark border border-here-border rounded-lg pl-10 pr-4 py-2 text-sm text-here-text focus:outline-none focus:border-here-teal focus:ring-1 focus:ring-here-teal transition-all placeholder:text-here-muted/50"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-here-muted hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-here-neon rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-here-border cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-here-accent/20 border border-here-accent/50 flex items-center justify-center text-here-accent group-hover:bg-here-accent group-hover:text-white transition-colors">
            <User size={16} />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-here-muted">Fleet Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
