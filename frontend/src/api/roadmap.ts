import client from './client';
import type { RoadmapPhase } from '../types';

export interface RoadmapSummary {
  completed: number;
  in_progress: number;
  pending: number;
}

export const getRoadmap = async (): Promise<{ phases: RoadmapPhase[], summary: RoadmapSummary }> => {
  const response = await client.get('/roadmap');
  return response.data;
};

export const startRoadmapPhase = async (phaseId: string): Promise<{ job_id: string, message: string }> => {
  const response = await client.post(`/roadmap/${phaseId}/start`);
  return response.data;
};
