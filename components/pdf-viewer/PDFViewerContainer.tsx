import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { PaperPage, SectionMapping } from '../../types';
import { PDFViewerPanel } from './PDFViewerPanel';
import { usePDFViewer } from './hooks/usePDFViewer';
import { useScrollSync } from './hooks/useScrollSync';

interface PDFViewerContainerProps {
  pages: PaperPage[];
  sectionMappings: SectionMapping[];
  children: React.ReactNode;
}

export const PDFViewerContainer: React.FC<PDFViewerContainerProps> = ({
  pages,
  sectionMappings,
  children
}) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const {
    currentPage,
    zoom,
    isCollapsed,
    setCurrentPage,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    setZoom,
    toggleCollapse
  } = usePDFViewer(pages.length);

  const { activeSection, scrollToPdfPage } = useScrollSync({
    pdfContainerRef: pdfRef,
    summaryContainerRef: summaryRef,
    sectionMappings,
    enabled: !isCollapsed && pages.length > 0,
    onPageChange: setCurrentPage
  });

  const hasPages = pages.length > 0;

  return (
    <div className="relative flex gap-6">
      {/* PDF Panel - Collapsible */}
      <AnimatePresence mode="wait">
        {!isCollapsed && hasPages && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 h-[calc(100vh-200px)] sticky top-32"
          >
            <PDFViewerPanel
              ref={pdfRef}
              pages={pages}
              currentPage={currentPage}
              zoom={zoom}
              activeSection={activeSection}
              onPageChange={scrollToPdfPage}
              onPrevPage={prevPage}
              onNextPage={nextPage}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onZoomReset={() => setZoom(1)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse/Expand Toggle Button */}
      {hasPages && (
        <button
          onClick={toggleCollapse}
          className={`
            absolute top-4 z-20 flex items-center gap-1 px-2 py-2
            bg-white border border-gray-200 shadow-md rounded-lg
            hover:bg-gray-50 hover:shadow-lg transition-all
            ${isCollapsed ? 'left-0' : 'left-[388px]'}
          `}
          title={isCollapsed ? 'Show PDF' : 'Hide PDF'}
        >
          {isCollapsed ? (
            <>
              <FileText size={16} className="text-sage" />
              <ChevronRight size={16} className="text-gray-400" />
            </>
          ) : (
            <ChevronLeft size={16} className="text-gray-400" />
          )}
        </button>
      )}

      {/* Summary Content */}
      <div
        ref={summaryRef}
        className={`flex-1 min-w-0 transition-all duration-300 ${
          hasPages && !isCollapsed ? 'ml-4' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};
