import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { InfoBox } from '../ui/InfoBox';

export const QuotaBanner: React.FC = () => {
  const quota = useAppStore((state) => state.quota);

  if (!quota) return null;

  if (quota.quota_exceeded) {
    return (
      <div className="bg-red-400/10 border-l-4 border-red-500 p-4 m-8 mb-0">
        <div className="flex items-center">
          <span className="text-xl mr-3">🔴</span>
          <p className="text-red-400 font-mono text-sm leading-relaxed">
            <strong className="block font-bold">Daily quota exceeded</strong>
            generation paused until midnight UTC
          </p>
        </div>
      </div>
    );
  }

  if (quota.percentage > 80) {
    return (
      <div className="bg-amber-400/10 border-l-4 border-amber-500 p-4 m-8 mb-0">
        <div className="flex items-center">
          <span className="text-xl mr-3">⚠️</span>
          <p className="text-amber-400 font-mono text-sm leading-relaxed">
            <strong className="block font-bold">API quota at {Math.round(quota.percentage)}%</strong>
            {quota.requests_limit - quota.requests_made} requests left today
          </p>
        </div>
      </div>
    );
  }

  return null;
};
