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

export type FolderColor = 'gray' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'purple' | 'pink';

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: FolderColor;
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

export interface TerminologyItem {
  term: string;
  explanation: string;
}

export interface LimitationItem {
  issue: string;
  reason: string;
}

export interface MethodSection {
  subsection_title: string;
  description: string;
}

export interface DocumentSection {
  section_title: string;
  subsection_title?: string;
  content: string;
}

export interface PaperSummary {
  id: string;
  paper_id: string;
  hypothesis: string;
  introduction: string;
  methodology: string;
  method_sections?: MethodSection[];
  results: SummaryResult[];
  results_sections?: DocumentSection[];
  discussion_sections?: DocumentSection[];
  conclusion: string;
  key_findings: string[];
  conflict_of_interest?: string;
  abstract_summary?: string;
  terminology_to_clarify?: TerminologyItem[];
  gaps_and_limitations?: LimitationItem[];
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}
