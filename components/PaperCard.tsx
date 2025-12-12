import React, { useState } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Eye, Trash2, FolderOpen, MoreVertical } from 'lucide-react';
import { Paper, Folder } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface PaperCardProps {
  paper: Paper;
  onView: (id: string) => void;
  onDelete?: () => void;
  folders?: Folder[];
  onMoveToFolder?: (folderId: string | null) => void;
}

const statusConfig = {
  pending: { color: 'border-l-status-pending', icon: Clock, text: 'text-status-pending', label: 'Pending' },
  processing: { color: 'border-l-status-processing', icon: Clock, text: 'text-status-processing', label: 'Processing' },
  completed: { color: 'border-l-status-success', icon: CheckCircle2, text: 'text-status-success', label: 'Completed' },
  failed: { color: 'border-l-status-error', icon: AlertCircle, text: 'text-status-error', label: 'Failed' },
};

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onView, onDelete, folders, onMoveToFolder }) => {
  const config = statusConfig[paper.status];
  const StatusIcon = config.icon;
  const [showMenu, setShowMenu] = useState(false);

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
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${config.text}`}>
            <StatusIcon size={14} />
            <span>{config.label}</span>
          </div>

          {/* Menu for folders */}
          {folders && folders.length > 0 && onMoveToFolder && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-2 min-w-[160px] z-20"
                  >
                    <p className="px-3 py-1 text-xs text-gray-400 uppercase font-medium">Move to folder</p>
                    <button
                      onClick={() => {
                        onMoveToFolder(null);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FolderOpen size={14} />
                      No Folder
                    </button>
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => {
                          onMoveToFolder(folder.id);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${paper.folder_id === folder.id ? 'text-sage font-medium' : 'text-gray-600'
                          }`}
                      >
                        <FolderOpen size={14} />
                        {folder.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
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
          <button
            onClick={onDelete}
            className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete Paper"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  );
};