import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserProfile } from '../types';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

// Mock User
const mockUser: UserProfile = {
  id: '123',
  full_name: 'Dr. Elena Vance',
  email: 'elena.vance@university.edu',
  avatar_url: 'https://picsum.photos/200',
  department: 'Computational Neuroscience'
};

const getTitleFromPath = (path: string) => {
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/paper')) return 'Paper Summary';
    if (path === '/papers') return 'My Papers';
    if (path === '/settings') return 'Settings';
    return 'Dashboard';
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-offwhite flex">
      <Sidebar 
        user={mockUser} 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out flex flex-col min-h-screen`}
        style={{ marginLeft: sidebarOpen ? '280px' : '80px' }}
      >
        <Header title={getTitleFromPath(location.pathname)} />
        
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};