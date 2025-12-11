import React from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { Paper } from '../types';
import { motion } from 'framer-motion';

interface PaperCardProps {
  paper: Paper;
  onView: (id: string) => void;
}

const statusConfig = {
  pending: { color: 'border-l-status-pending', icon: Clock, text: 'text-status-pending', label: 'Pending' },
  processing: { color: 'border-l-status-processing', icon: Clock, text: 'text-status-processing', label: 'Processing' },
  completed: { color: 'border-l-status-success', icon: CheckCircle2, text: 'text-status-success', label: 'Completed' },
  failed: { color: 'border-l-status-error', icon: AlertCircle, text: 'text-status-error', label: 'Failed' },
};

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onView }) => {
  const config = statusConfig[paper.status];
  const StatusIcon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
      className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 border-l-4 ${config.color} group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-offwhite-dark rounded-md text-charcoal-light">
          <FileText size={24} />
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${config.text}`}>
          <StatusIcon size={14} />
          <span>{config.label}</span>
        </div>
      </div>

      <h3 className="font-display font-semibold text-lg text-charcoal mb-2 line-clamp-2 leading-tight group-hover:text-sage transition-colors">
        {paper.title}
      </h3>

      <p className="text-sm text-gray-500 mb-6 line-clamp-1">
        {paper.authors.join(', ')}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
        <span className="text-xs text-gray-400 font-medium">
          {new Date(paper.upload_date).toLocaleDateString()}
        </span>
        
        <div className="flex gap-2">
            <button 
                onClick={() => onView(paper.id)}
                className="p-2 rounded-full hover:bg-sage/10 text-gray-400 hover:text-sage transition-colors"
                title="View Summary"
                disabled={paper.status !== 'completed'}
            >
                <Eye size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
            </button>
        </div>
      </div>
    </motion.div>
  );
};