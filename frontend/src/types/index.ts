export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'quota_exceeded';

export interface Job {
  id: string;
  name: string;
  place_type: string | null;
  status: JobStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  names_input: string[];
  results: JobResult[];
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string;
  error: string | null;
}

export interface JobResult {
  name: string;
  status: 'inserted' | 'duplicate' | 'failed' | 'low_quality';
  place_id: string | null;
  quality: number | null;
  error: string | null;
  questions_generated: number;
}

export interface QuotaStatus {
  date: string;
  model: string;
  requests_made: number;
  requests_limit: number;
  tokens_used: number;
  quota_exceeded: boolean;
  reset_at: string | null;
  percentage: number;
}

export interface RoadmapPhase {
  id: string;
  phase: string;
  title: string;
  description: string | null;
  place_type: string | null;
  names: string[];
  status: 'pending' | 'in_progress' | 'completed';
  priority: number;
  total_places: number;
  completed_places: number;
  job_id: string | null;
}

export interface GenerateRequest {
  job_name: string;
  names: string[];
  place_type: string | null;
  generate_questions: boolean;
  schedule_for?: string | null;
}
