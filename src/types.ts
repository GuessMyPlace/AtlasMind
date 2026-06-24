export interface Place {
  id: string;
  name: string;
  type: 'country' | 'city' | 'landmark';
  latitude: number;
  longitude: number;
  country: string;
  city?: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  clues: string[];
  created_at: string;
}

export interface Question {
  id: string;
  place_id: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface AtlasMindJob {
  id: string;
  name: string;
  type: string;
  place_type?: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'quota_exceeded';
  target_query?: string;
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  results: any[];
  error_message?: string;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GeminiQuotaLog {
  id: string;
  tokens_used: number;
  calls_count: number;
  model: string;
  prompt_summary: string;
  timestamp: string;
}

export interface AtlasMindRoadmap {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  estimated_places: number;
  target_names?: string[];
  created_at: string;
}

export interface UnknownPlacesQueue {
  id: string;
  name: string;
  context: string;
  status: 'queued' | 'resolved' | 'ignored';
  reported_at: string;
}

export interface QuotaConfig {
  maxDailyTokens: number;
  maxTokensPerMinute: number;
  simulateQuotaLimit: boolean;
  artificialErrorRate: number; // 0 to 1
  monthlyBudgetUSD: number;
}

export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'quota_exceeded';

export interface JobResult {
  name: string;
  status: 'inserted' | 'duplicate' | 'failed' | 'low_quality';
  quality?: number;
  questions_generated?: number;
  error?: string;
}

export interface Job {
  id: string;
  name: string;
  type: string;
  place_type?: string;
  status: JobStatus;
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  results: JobResult[];
}

export interface GenerateRequest {
  job_name: string;
  names: string[];
  place_type: string | null;
  generate_questions: boolean;
  schedule_for: string | null;
}

export interface QuotaStatus {
  requests_made: number;
  requests_limit: number;
  percentage: number;
  quota_exceeded: boolean;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  estimated_places: number;
  target_names?: string[];
  created_at: string;
}
