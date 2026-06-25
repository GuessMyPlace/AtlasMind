import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface InfoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ variant = 'info', title, children, className, ...props }) => {
  const Icon = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  }[variant];

  return (
    <div
      className={cn(
        'rounded-lg p-4 border-l-4 flex items-start gap-3 text-sm',
        {
          'bg-slate-800/50 border-slate-500 text-slate-300': variant === 'info',
          'bg-atlasmind-green/10 border-atlasmind-green text-atlasmind-green': variant === 'success',
          'bg-atlasmind-amber/10 border-atlasmind-amber text-atlasmind-amber': variant === 'warning',
          'bg-atlasmind-red/10 border-atlasmind-red text-red-300': variant === 'error',
        },
        className
      )}
      {...props}
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', {
        'text-slate-400': variant === 'info',
        'text-atlasmind-green': variant === 'success',
        'text-atlasmind-amber': variant === 'warning',
        'text-atlasmind-red': variant === 'error',
      })} />
      <div className="space-y-1">
        {title && <h5 className="font-bold tracking-wider font-mono uppercase">{title}</h5>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
};
