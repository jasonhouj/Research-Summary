import React from 'react';
import { motion } from 'framer-motion';
import { PaperPage } from '../../types';

interface PDFPageRendererProps {
  page: PaperPage;
  zoom: number;
  isActive: boolean;
  onVisible?: () => void;
}

/**
 * Renders a single PDF page as an image.
 * This component is the abstraction point for future react-pdf integration.
 * To switch to react-pdf, replace the <img> with <Document><Page /></Document>
 */
export const PDFPageRenderer: React.FC<PDFPageRendererProps> = ({
  page,
  zoom,
  isActive
}) => {
  return (
    <motion.div
      data-page={page.page_number}
      className={`relative mb-4 ${isActive ? 'ring-2 ring-sage ring-offset-2' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Page number badge */}
      <div className="absolute top-2 left-2 bg-charcoal/80 text-white text-xs px-2 py-1 rounded z-10">
        {page.page_number}
      </div>

      {/* Page image */}
      <img
        src={page.image_url}
        alt={`Page ${page.page_number}`}
        className="w-full shadow-lg rounded bg-white"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: `${100 / zoom}%`
        }}
        loading="lazy"
      />
    </motion.div>
  );
};
