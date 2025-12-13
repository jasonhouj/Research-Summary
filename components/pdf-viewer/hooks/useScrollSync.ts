import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { SectionMapping, SummarySection } from '../../../types';

interface UseScrollSyncOptions {
  pdfContainerRef: RefObject<HTMLDivElement>;
  summaryContainerRef: RefObject<HTMLDivElement>;
  sectionMappings: SectionMapping[];
  enabled: boolean;
  onPageChange?: (page: number) => void;
}

interface UseScrollSyncReturn {
  activeSection: SummarySection | null;
  currentPdfPage: number;
  scrollToSection: (section: SummarySection) => void;
  scrollToPdfPage: (page: number) => void;
}

export function useScrollSync({
  pdfContainerRef,
  summaryContainerRef,
  sectionMappings,
  enabled,
  onPageChange
}: UseScrollSyncOptions): UseScrollSyncReturn {
  const [activeSection, setActiveSection] = useState<SummarySection | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const isScrollingFromPdf = useRef(false);
  const isScrollingFromSummary = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Scroll PDF to a specific page
  const scrollToPdfPage = useCallback((page: number) => {
    if (!pdfContainerRef.current || isScrollingFromSummary.current) return;

    const pageElements = pdfContainerRef.current.querySelectorAll('[data-page]');
    const targetPage = Array.from(pageElements).find(
      el => el.getAttribute('data-page') === String(page)
    );

    if (targetPage) {
      isScrollingFromPdf.current = true;
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Reset flag after scroll completes
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isScrollingFromPdf.current = false;
      }, 500);
    }

    setCurrentPdfPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  }, [pdfContainerRef, onPageChange]);

  // Scroll summary to a specific section
  const scrollToSection = useCallback((section: SummarySection) => {
    if (!summaryContainerRef.current || isScrollingFromPdf.current) return;

    const sectionElement = summaryContainerRef.current.querySelector(
      `[data-section="${section}"]`
    );

    if (sectionElement) {
      isScrollingFromSummary.current = true;
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Reset flag after scroll completes
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isScrollingFromSummary.current = false;
      }, 500);
    }

    setActiveSection(section);
  }, [summaryContainerRef]);

  // Observe summary sections to detect which is visible
  useEffect(() => {
    if (!enabled || !summaryContainerRef.current || sectionMappings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingFromPdf.current) return;

        // Find the most visible section
        const visibleEntry = entries.find(e => e.isIntersecting);
        if (visibleEntry) {
          const sectionId = visibleEntry.target.getAttribute('data-section') as SummarySection;
          if (sectionId && sectionId !== activeSection) {
            setActiveSection(sectionId);

            // Find corresponding PDF page and scroll to it
            const mapping = sectionMappings.find(m => m.section_type === sectionId);
            if (mapping) {
              isScrollingFromSummary.current = true;
              scrollToPdfPage(mapping.start_page);
              setTimeout(() => {
                isScrollingFromSummary.current = false;
              }, 500);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      }
    );

    // Observe all section elements
    const sections = summaryContainerRef.current.querySelectorAll('[data-section]');
    sections.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      clearTimeout(scrollTimeout.current);
    };
  }, [enabled, sectionMappings, activeSection, scrollToPdfPage, summaryContainerRef]);

  // Observe PDF pages to detect which is visible
  useEffect(() => {
    if (!enabled || !pdfContainerRef.current || sectionMappings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingFromSummary.current) return;

        const visibleEntry = entries.find(e => e.isIntersecting);
        if (visibleEntry) {
          const pageNum = parseInt(visibleEntry.target.getAttribute('data-page') || '1', 10);
          if (pageNum !== currentPdfPage) {
            setCurrentPdfPage(pageNum);

            // Find which section this page belongs to
            const mapping = sectionMappings.find(
              m => pageNum >= m.start_page && pageNum <= m.end_page
            );
            if (mapping && mapping.section_type !== activeSection) {
              setActiveSection(mapping.section_type);
            }
          }
        }
      },
      {
        root: pdfContainerRef.current,
        rootMargin: '0px',
        threshold: 0.5
      }
    );

    const pages = pdfContainerRef.current.querySelectorAll('[data-page]');
    pages.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [enabled, sectionMappings, currentPdfPage, activeSection, pdfContainerRef]);

  return {
    activeSection,
    currentPdfPage,
    scrollToSection,
    scrollToPdfPage
  };
}
