import client from './client';
import type { Job } from '../types';

export const getJobs = async (params?: Record<string, any>): Promise<{ jobs: Job[], total: number }> => {
  const response = await client.get('/jobs', { params });
  // Handle both array and paginated response formats gracefully
  if (Array.isArray(response.data)) {
    return { jobs: response.data, total: response.data.length };
  }
  return response.data;
};

export const getJob = async (id: string): Promise<Job> => {
  const response = await client.get(`/jobs/${id}`);
  return response.data;
};

export const pauseJob = async (id: string): Promise<Job> => {
  const response = await client.post(`/jobs/${id}/pause`);
  return response.data;
};

export const resumeJob = async (id: string): Promise<Job> => {
  const response = await client.post(`/jobs/${id}/resume`);
  return response.data;
};

export const cancelJob = async (id: string): Promise<Job> => {
  const response = await client.post(`/jobs/${id}/cancel`);
  return response.data;
};
