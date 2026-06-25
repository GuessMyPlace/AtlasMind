import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  colorClass?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, colorClass = 'bg-atlasmind-cyan', className, ...props }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={cn("w-full bg-slate-800 rounded-full h-2 overflow-hidden", className)} {...props}>
      <div 
        className={cn("h-full rounded-full transition-all duration-500", colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
