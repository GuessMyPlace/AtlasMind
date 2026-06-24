import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'running' | 'completed' | 'failed' | 'warning' | 'info' | 'paused' | 'quota_exceeded';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'info', children, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest border',
        {
          'bg-slate-800/50 border-slate-700/50 text-slate-400': variant === 'pending',
          'bg-atlasmind-cyan/10 border-atlasmind-cyan/30 text-atlasmind-cyan': variant === 'running',
          'bg-atlasmind-green/10 border-atlasmind-green/30 text-atlasmind-green': variant === 'completed',
          'bg-atlasmind-red/10 border-atlasmind-red/30 text-atlasmind-red': variant === 'failed',
          'bg-atlasmind-amber/10 border-atlasmind-amber/30 text-atlasmind-amber': variant === 'warning' || variant === 'paused' || variant === 'quota_exceeded',
          'bg-slate-800 border-slate-700 text-slate-300': variant === 'info',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
