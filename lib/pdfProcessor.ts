import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from './supabaseClient';
import { ProcessedPage, PaperPage, SectionMapping, SummarySection } from '../types';

// Configure PDF.js worker - use unpkg which mirrors npm packages directly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Extract text content from a PDF file
 */
export async function extractPDFText(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => (item as { str: string }).str)
      .join(' ');
    textParts.push(pageText);

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return textParts.join('\n\n');
}

/**
 * Process a PDF file and convert each page to an image
 */
export async function processPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: ProcessedPage[] = [];
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.5; // Good balance of quality and file size
    const viewport = page.getViewport({ scale });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    // Convert canvas to blob (WebP for smaller file size, fallback to PNG)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        },
        'image/webp',
        0.85
      );
    });

    pages.push({
      pageNumber: i,
      imageBlob: blob,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height)
    });

    // Report progress
    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return pages;
}

/**
 * Upload processed pages to Supabase storage and create database records
 */
export async function uploadPaperPages(
  userId: string,
  paperId: string,
  pages: ProcessedPage[],
  onProgress?: (current: number, total: number) => void
): Promise<PaperPage[]> {
  const uploadedPages: PaperPage[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const filePath = `${userId}/${paperId}/page-${page.pageNumber}.webp`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('paper-pages')
      .upload(filePath, page.imageBlob, {
        upsert: true,
        contentType: 'image/webp'
      });

    if (uploadError) {
      console.error(`Error uploading page ${page.pageNumber}:`, uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('paper-pages')
      .getPublicUrl(filePath);

    // Create database record
    const { data, error: dbError } = await supabase
      .from('paper_pages')
      .insert({
        paper_id: paperId,
        page_number: page.pageNumber,
        image_url: publicUrl,
        width: page.width,
        height: page.height
      })
      .select()
      .single();

    if (dbError) {
      console.error(`Error saving page ${page.pageNumber} to database:`, dbError);
      throw dbError;
    }

    uploadedPages.push(data as PaperPage);

    // Report progress
    if (onProgress) {
      onProgress(i + 1, pages.length);
    }
  }

  return uploadedPages;
}

/**
 * Generate default section mappings based on page count
 * Distributes pages evenly across sections
 */
export function generateDefaultSectionMappings(
  summaryId: string,
  pageCount: number,
  resultsCount: number
): Omit<SectionMapping, 'id' | 'created_at'>[] {
  // Define all sections including dynamic results
  const sections: SummarySection[] = [
    'hypothesis',
    'introduction',
    'methodology',
    ...Array.from({ length: resultsCount }, (_, i) => `result_${i}` as SummarySection),
    'conclusion'
  ];

  const totalSections = sections.length;
  const pagesPerSection = Math.max(1, Math.floor(pageCount / totalSections));
  let currentPage = 1;

  return sections.map((section, idx) => {
    const startPage = currentPage;
    // Last section gets all remaining pages
    const endPage = idx === totalSections - 1
      ? pageCount
      : Math.min(currentPage + pagesPerSection - 1, pageCount);

    currentPage = endPage + 1;

    return {
      summary_id: summaryId,
      section_type: section,
      start_page: startPage,
      end_page: endPage
    };
  });
}

/**
 * Save section mappings to database
 */
export async function saveSectionMappings(
  mappings: Omit<SectionMapping, 'id' | 'created_at'>[]
): Promise<SectionMapping[]> {
  const { data, error } = await supabase
    .from('section_mappings')
    .insert(mappings)
    .select();

  if (error) {
    console.error('Error saving section mappings:', error);
    throw error;
  }

  return data as SectionMapping[];
}

/**
 * Fetch paper pages for a given paper
 */
export async function fetchPaperPages(paperId: string): Promise<PaperPage[]> {
  const { data, error } = await supabase
    .from('paper_pages')
    .select('*')
    .eq('paper_id', paperId)
    .order('page_number', { ascending: true });

  if (error) {
    console.error('Error fetching paper pages:', error);
    throw error;
  }

  return data as PaperPage[];
}

/**
 * Fetch section mappings for a given summary
 */
export async function fetchSectionMappings(summaryId: string): Promise<SectionMapping[]> {
  const { data, error } = await supabase
    .from('section_mappings')
    .select('*')
    .eq('summary_id', summaryId)
    .order('start_page', { ascending: true });

  if (error) {
    console.error('Error fetching section mappings:', error);
    throw error;
  }

  return data as SectionMapping[];
}

/**
 * Delete all pages for a paper (used when re-uploading)
 */
export async function deletePaperPages(userId: string, paperId: string): Promise<void> {
  // Delete from storage
  const { data: files } = await supabase.storage
    .from('paper-pages')
    .list(`${userId}/${paperId}`);

  if (files && files.length > 0) {
    const filePaths = files.map(f => `${userId}/${paperId}/${f.name}`);
    await supabase.storage.from('paper-pages').remove(filePaths);
  }

  // Delete from database (cascade will handle this if paper is deleted)
  await supabase
    .from('paper_pages')
    .delete()
    .eq('paper_id', paperId);
}
