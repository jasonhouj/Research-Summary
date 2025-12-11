import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PaperCard } from '../components/PaperCard';
import { UploadZone } from '../components/UploadZone';
import { Paper, PaperStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, FileText, Zap } from 'lucide-react';

const mockPapers: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Vaswani A.', 'Shazeer N.', 'Parmar N.', 'et al.'],
    upload_date: '2023-10-24T10:00:00Z',
    status: 'completed',
    original_filename: 'transformer.pdf'
  },
  {
    id: '2',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['He K.', 'Zhang X.', 'Ren S.', 'Sun J.'],
    upload_date: '2023-10-22T14:30:00Z',
    status: 'completed',
    original_filename: 'resnet.pdf'
  },
  {
    id: '3',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Devlin J.', 'Chang M.', 'Lee K.', 'Toutanova K.'],
    upload_date: '2023-10-25T09:15:00Z',
    status: 'processing',
    original_filename: 'bert_google.pdf'
  },
  {
    id: '4',
    title: 'Generative Adversarial Nets',
    authors: ['Goodfellow I.', 'Pouget-Abadie J.', 'et al.'],
    upload_date: '2023-10-20T11:20:00Z',
    status: 'pending',
    original_filename: 'gan_seminal.pdf'
  }
];

const statsData = [
  { name: 'Mon', papers: 2 },
  { name: 'Tue', papers: 4 },
  { name: 'Wed', papers: 1 },
  { name: 'Thu', papers: 8 },
  { name: 'Fri', papers: 5 },
  { name: 'Sat', papers: 2 },
  { name: 'Sun', papers: 3 },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>(mockPapers);

  const handleUpload = (file: File) => {
    // Optimistic update
    const newPaper: Paper = {
      id: Math.random().toString(36).substr(2, 9),
      title: file.name.replace('.pdf', ''),
      authors: ['Unknown Author'], // Placeholder until processed
      upload_date: new Date().toISOString(),
      status: 'pending',
      original_filename: file.name
    };
    setPapers([newPaper, ...papers]);
  };

  const handleView = (id: string) => {
    navigate(`/paper/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-between"
          >
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Overview</p>
              <h2 className="text-3xl font-display font-bold text-charcoal">Good Morning, Dr. Vance</h2>
            </div>
            <p className="text-sm text-gray-400 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Total Papers" value="128" delay={0.1} />
            <StatCard icon={BookOpen} label="Reading Time" value="42h" delay={0.2} sub="Saved this month" />
            <StatCard icon={Clock} label="Processing" value="3" delay={0.3} active />
            <StatCard icon={Zap} label="Insights" value="1.2k" delay={0.4} />
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-charcoal">Activity</h3>
                <span className="text-xs text-sage font-medium bg-sage/10 px-2 py-1 rounded">Weekly View</span>
             </div>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={statsData}>
                   <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                    dy={10}
                   />
                   <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                   />
                   <Bar dataKey="papers" radius={[4, 4, 0, 0]}>
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 3 ? '#8fbc8f' : '#e5e7eb'} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Upload Column */}
        <div className="space-y-6">
           <h3 className="font-display font-semibold text-xl text-charcoal">Quick Upload</h3>
           <UploadZone onUpload={handleUpload} />
           
           <div className="bg-charcoal text-white p-6 rounded-xl relative overflow-hidden group cursor-pointer">
              <div className="relative z-10">
                  <h4 className="font-display text-lg font-bold mb-2">Connect Sources</h4>
                  <p className="text-gray-400 text-sm mb-4">Auto-sync with Google Scholar or Zotero.</p>
                  <button className="text-xs font-bold uppercase tracking-widest text-accent group-hover:text-white transition-colors">Configure &rarr;</button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BookOpen size={120} />
              </div>
           </div>
        </div>
      </section>

      {/* Papers Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
           <h3 className="font-display font-semibold text-xl text-charcoal">Recent Papers</h3>
           <div className="flex gap-2">
             <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-lg px-3 py-2 outline-none focus:border-sage">
               <option>All Statuses</option>
               <option>Completed</option>
               <option>Processing</option>
             </select>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} onView={handleView} />
          ))}
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, delay, active }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className={`p-4 rounded-xl border ${active ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-100'} shadow-sm`}
  >
    <div className={`mb-3 ${active ? 'text-sage' : 'text-gray-400'}`}>
      <Icon size={20} />
    </div>
    <div className="font-display font-bold text-2xl mb-1">{value}</div>
    <div className={`text-xs font-medium ${active ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
  </motion.div>
);