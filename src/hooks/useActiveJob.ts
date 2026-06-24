import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { getJobs, getJob } from '../api/jobs';

export const useActiveJob = () => {
  const { activeJob, setActiveJob } = useAppStore();

  useEffect(() => {
    let mounted = true;

    const fetchActiveJob = async () => {
      try {
        if (activeJob && (activeJob.status === 'running' || activeJob.status === 'pending')) {
          const data = await getJob(activeJob.id);
          if (mounted) setActiveJob(data);
        } else {
          // If no running job is stored locally, look for one
          const res = await getJobs({ limit: 1, status: 'running' });
          const running = res.jobs.find((j) => j.status === 'running' || j.status === 'pending');
          if (mounted) setActiveJob(running || null);
        }
      } catch (err) {
        console.error('Failed to fetch active job', err);
      }
    };

    fetchActiveJob();
    const interval = setInterval(fetchActiveJob, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeJob?.id, activeJob?.status, setActiveJob]);
};
