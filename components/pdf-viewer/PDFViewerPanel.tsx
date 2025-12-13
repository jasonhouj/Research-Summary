import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { PaperPage, SummarySection } from '../../types';
import { PDFPageRenderer } from './PDFPageRenderer';
import { PDFNavigation } from './PDFNavigation';
import { PDFZoomControls } from './PDFZoomControls';

interface PDFViewerPanelProps {
  pages: PaperPage[];
  currentPage: number;
  zoom: number;
  activeSection?: SummarySection | null;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const PDFViewerPanel = forwardRef<HTMLDivElement, PDFViewerPanelProps>(({
  pages,
  currentPage,
  zoom,
  activeSection,
  onPageChange,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onZoomReset
}, ref) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-gray-50 rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <h3 className="font-semibold text-sm text-charcoal">Original PDF</h3>
        <PDFZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onZoomReset}
        />
      </div>

      {/* Scrollable pages container */}
      <div
        ref={ref}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {pages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No PDF pages available
          </div>
        ) : (
          pages.map((page) => (
            <PDFPageRenderer
              key={page.id}
              page={page}
              zoom={zoom}
              isActive={page.page_number === currentPage}
            />
          ))
        )}
      </div>

      {/* Footer with navigation */}
      {pages.length > 0 && (
        <PDFNavigation
          currentPage={currentPage}
          totalPages={pages.length}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          onPageChange={onPageChange}
        />
      )}
    </motion.div>
  );
});

PDFViewerPanel.displayName = 'PDFViewerPanel';
