import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'complete'>('idle');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        startUpload(droppedFile);
      } else {
        alert("Only PDF files are allowed.");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        startUpload(e.target.files[0]);
    }
  };

  const startUpload = (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('uploading');
    
    // Simulate upload progress
    let curr = 0;
    const interval = setInterval(() => {
        curr += 5;
        setProgress(curr);
        if (curr >= 100) {
            clearInterval(interval);
            setStatus('complete');
            setTimeout(() => {
                onUpload(selectedFile);
                reset();
            }, 1000);
        }
    }, 100);
  };

  const reset = () => {
    setFile(null);
    setProgress(0);
    setStatus('idle');
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`
              relative h-48 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
              ${isDragging ? 'border-sage bg-sage/5' : 'border-gray-200 hover:border-sage hover:bg-offwhite'}
            `}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileSelect}
            />
            <div className={`p-4 rounded-full bg-offwhite-dark mb-3 group-hover:scale-110 transition-transform ${isDragging ? 'bg-white text-sage' : 'text-gray-400'}`}>
              <UploadCloud size={28} />
            </div>
            <p className="font-display font-medium text-lg text-charcoal">
                Drop your PDF here
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            <span className="absolute bottom-4 text-xs text-gray-400 font-medium">Max size: 50MB</span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-48 rounded-xl border border-gray-200 bg-white p-6 flex flex-col justify-center relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sage/10 rounded text-sage">
                        <File size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-charcoal truncate max-w-[200px]">{file?.name}</p>
                        <p className="text-xs text-gray-400">{(file?.size || 0) / 1000} KB</p>
                    </div>
                </div>
                {status === 'complete' ? (
                    <div className="text-status-success">
                        <Check size={24} />
                    </div>
                ) : (
                    <button onClick={reset} className="text-gray-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="space-y-2 z-10">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
                    <span className={status === 'complete' ? 'text-status-success' : 'text-sage'}>
                        {status === 'complete' ? 'Upload Complete' : 'Uploading...'}
                    </span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-sage"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear" }}
                    />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};