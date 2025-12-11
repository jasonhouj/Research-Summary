import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SummaryView } from './pages/SummaryView';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/paper/:id" element={<SummaryView />} />
          <Route path="/papers" element={<div className="text-center py-20 text-gray-400">Paper Library View Placeholder</div>} />
          <Route path="/saved" element={<div className="text-center py-20 text-gray-400">Saved Summaries Placeholder</div>} />
          <Route path="/settings" element={<div className="text-center py-20 text-gray-400">Settings Placeholder</div>} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;