import client from './client';
import type { QuotaStatus } from '../types';

export const getQuotaStatus = async (): Promise<QuotaStatus> => {
  const response = await client.get('/quota/today');
  return response.data;
};
