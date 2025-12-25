import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Bookmark, Settings, LogOut, ChevronLeft, Search } from 'lucide-react';
import { NavItem } from '../types';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Summaries', path: '/papers', icon: FileText },
  { label: 'Find Papers', path: '/search', icon: Search },
  { label: 'Saved Papers', path: '/saved', icon: Bookmark },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? '280px' : '80px' }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
      className="fixed left-0 top-0 h-screen bg-charcoal text-white flex flex-col z-50 shadow-xl overflow-visible"
    >
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-charcoal-light relative flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-accent to-purple-600 flex-shrink-0" />
          <motion.span
            animate={{ opacity: isOpen ? 1 : 0 }}
            className="font-display font-bold text-xl tracking-tight whitespace-nowrap"
          >
            STEM Stack
          </motion.span>
        </div>
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-gray-500 hover:bg-accent text-white p-1 rounded-full shadow-lg z-50 transition-colors ring-2 ring-offwhite/20"
        >
          <ChevronLeft size={14} className={`transform transition-transform ${!isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Content Wrapper for Clipping */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={`flex-shrink-0 ${isActive ? 'text-sage' : 'group-hover:text-white'}`} />
                  <motion.span
                    animate={{ opacity: isOpen ? 1 : 0, display: isOpen ? 'block' : 'none' }}
                    className="whitespace-nowrap font-medium"
                  >
                    {item.label}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute left-0 top-0 w-1 h-full bg-sage rounded-r"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-charcoal-light flex-shrink-0">
          <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${!isOpen ? 'justify-center' : ''}`}>
            <img
              src={profile?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=8fbc8f&color=fff'}
              alt={profile?.full_name || 'User'}
              className="w-10 h-10 rounded-full object-cover border-2 border-charcoal-light flex-shrink-0"
            />
            {isOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {profile?.department || profile?.affiliation || 'Researcher'}
                </p>
              </div>
            )}
            {isOpen && (
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-accent flex-shrink-0"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
};