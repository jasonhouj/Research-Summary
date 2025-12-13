import { useState, useCallback } from 'react';
import { PDFViewerState } from '../../../types';

const DEFAULT_STATE: PDFViewerState = {
  currentPage: 1,
  totalPages: 0,
  zoom: 1,
  isCollapsed: false
};

export function usePDFViewer(totalPages: number) {
  const [state, setState] = useState<PDFViewerState>({
    ...DEFAULT_STATE,
    totalPages
  });

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, prev.totalPages)
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(prev.currentPage - 1, 1)
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(zoom, 3))
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.25, 3)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.25, 0.5)
    }));
  }, []);

  const toggleCollapse = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed
    }));
  }, []);

  const setCollapsed = useCallback((isCollapsed: boolean) => {
    setState(prev => ({
      ...prev,
      isCollapsed
    }));
  }, []);

  return {
    ...state,
    setCurrentPage,
    nextPage,
    prevPage,
    setZoom,
    zoomIn,
    zoomOut,
    toggleCollapse,
    setCollapsed
  };
}
