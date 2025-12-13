import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
}

export const PDFNavigation: React.FC<PDFNavigationProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onPageChange
}) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-white border-t border-gray-100">
      <button
        onClick={onPrevPage}
        disabled={currentPage <= 1}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Previous page"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex items-center gap-1 text-sm">
        <input
          type="number"
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value, 10);
            if (page >= 1 && page <= totalPages) {
              onPageChange(page);
            }
          }}
          min={1}
          max={totalPages}
          className="w-12 text-center border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-sage"
        />
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{totalPages}</span>
      </div>

      <button
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
