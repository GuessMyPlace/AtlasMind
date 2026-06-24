import React from 'react';
import { Sidebar } from './Sidebar';
import { QuotaBanner } from '../quota/QuotaBanner';
import { useQuota } from '../../hooks/useQuota';
import { useActiveJob } from '../../hooks/useActiveJob';

export const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useQuota();
  useActiveJob();

  return (
    <div className="flex h-screen overflow-hidden bg-atlasmind-bg">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-y-auto w-full pb-16 md:pb-0">
        <QuotaBanner />
        <div className="p-4 md:p-8 pb-32">
          {children}
        </div>
      </main>
    </div>
  );
};
