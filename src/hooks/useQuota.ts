import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { getQuotaStatus } from '../api/quota';

export const useQuota = () => {
  const setQuota = useAppStore((state) => state.setQuota);

  useEffect(() => {
    let mounted = true;

    const fetchQuota = async () => {
      try {
        const data = await getQuotaStatus();
        if (mounted) setQuota(data);
      } catch (err) {
        console.error('Failed to fetch quota', err);
      }
    };

    fetchQuota();
    const interval = setInterval(fetchQuota, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setQuota]);
};
