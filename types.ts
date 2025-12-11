import React from 'react';

export type PaperStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  department?: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  upload_date: string;
  status: PaperStatus;
  original_filename: string;
  file_url?: string;
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
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}