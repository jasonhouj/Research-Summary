import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

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