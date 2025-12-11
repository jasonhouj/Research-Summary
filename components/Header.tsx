import React from 'react';
import { Search, Bell } from 'lucide-react';

interface HeaderProps {
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-20 bg-offwhite/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/50 flex items-center justify-between px-8 transition-all">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
          <span>App</span>
          <span className="text-gray-300">/</span>
          <span className="text-sage-dark">{title}</span>
        </div>
        <h1 className="text-2xl font-display font-semibold text-charcoal">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sage transition-colors" />
          <input 
            type="text" 
            placeholder="Search papers, authors..." 
            className="w-64 lg:w-96 pl-10 pr-4 py-2 bg-white border border-transparent focus:border-sage/30 rounded-full text-sm outline-none shadow-sm focus:shadow-md transition-all placeholder:text-gray-400"
          />
        </div>

        <button className="relative p-2 text-gray-500 hover:text-charcoal transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-offwhite"></span>
        </button>
      </div>
    </header>
  );
};