import React from 'react';

export type PaperStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  department?: string;
  affiliation?: string;
  subscription_tier?: string;
  paper_count?: number;
  subscription_started_at?: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  paper_limit: number | null;
  price_monthly: number;
  features: {
    storage: string;
    support: string;
    priority_processing?: boolean;
    api_access?: boolean;
  };
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Paper {
  id: string;
  user_id?: string;
  folder_id?: string | null;
  title: string;
  authors: string[];
  upload_date: string;
  status: PaperStatus;
  original_filename: string;
  file_url?: string;
  page_count?: number;
}

export interface SummaryResult {
  label: string;
  content: string;
  discussion: string;
}

export interface PaperSummary {
  id: string;
  paper_id: string;
  hypothesis: string;
  introduction: string;
  methodology: string;
  results: SummaryResult[];
  conclusion: string;
  key_findings: string[];
  conflict_of_interest?: string;
  abstract_summary?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

// PDF Viewer Types

// Paper page image (converted from PDF)
export interface PaperPage {
  id: string;
  paper_id: string;
  page_number: number;
  image_url: string;
  width?: number;
  height?: number;
  created_at?: string;
}

// Section types for scroll synchronization
export type SummarySection =
  | 'hypothesis'
  | 'introduction'
  | 'methodology'
  | 'conclusion'
  | 'conflict_of_interest'
  | `result_${number}`;

// Highlight region on a PDF page (for future use)
export interface HighlightRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Section-to-page mapping for scroll sync
export interface SectionMapping {
  id: string;
  summary_id: string;
  section_type: SummarySection;
  start_page: number;
  end_page: number;
  highlight_regions?: HighlightRegion[];
  created_at?: string;
}

// PDF Viewer state
export interface PDFViewerState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  isCollapsed: boolean;
}

// Processed page during upload (before storage)
export interface ProcessedPage {
  pageNumber: number;
  imageBlob: Blob;
  width: number;
  height: number;
}