import client from './client';
import type { GenerateRequest } from '../types';

export interface CheckResult {
  exists: boolean;
  place_id: string | null;
  similar_to: string | null;
}

export interface GenerateCheckResponse {
  results: Record<string, CheckResult>;
}

export interface QueuePlace {
  id: string;
  name: string;
  reported: number;
  created_at: string;
}

export const checkDuplicates = async (names: string[]): Promise<GenerateCheckResponse> => {
  const response = await client.post('/generate/check', { names });
  return response.data;
};

export const startGeneration = async (data: GenerateRequest): Promise<{ job_id: string, message: string, status: string }> => {
  const response = await client.post('/generate/start', data);
  return response.data;
};

export const getQueue = async (): Promise<{ places: QueuePlace[], total: number }> => {
  const response = await client.get('/generate/queue');
  return response.data;
};
