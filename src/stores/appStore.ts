import { create } from 'zustand';
import type { QuotaStatus, Job } from '../types';

interface AppState {
  quota: QuotaStatus | null;
  activeJob: Job | null;
  setQuota: (quota: QuotaStatus | null) => void;
  setActiveJob: (job: Job | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  quota: null,
  activeJob: null,
  setQuota: (quota) => set({ quota }),
  setActiveJob: (job) => set({ activeJob: job }),
}));
