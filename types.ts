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
