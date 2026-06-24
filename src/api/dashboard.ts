import client from './client';

export interface HealthStatus {
  status: string;
  version: string;
}

export const getHealth = async (): Promise<HealthStatus> => {
  // If Vite's proxy covers /health, use client. If not, use standard axios.
  // Using client since it has baseURL
  const response = await client.get('/health');
  return response.data;
};

export interface RoadmapProgress {
  total_phases: number;
  completed: number;
  in_progress: number;
  pending: number;
  total_places_generated: number;
  bd_progress_pct: number;
}

export const getRoadmapProgress = async (): Promise<RoadmapProgress> => {
  const response = await client.get('/roadmap/progress');
  return response.data;
};
