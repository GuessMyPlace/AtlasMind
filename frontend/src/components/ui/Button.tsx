import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center rounded font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-atlasmind-cyan text-atlasmind-bg hover:bg-atlasmind-cyan/90': variant === 'primary',
            'bg-atlasmind-elevated border border-atlasmind-border text-slate-200 hover:bg-slate-800': variant === 'secondary',
            'bg-atlasmind-red/20 border border-atlasmind-red/50 text-atlasmind-red hover:bg-atlasmind-red/30': variant === 'danger',
            'bg-transparent hover:bg-atlasmind-elevated text-slate-300': variant === 'ghost',
            'px-3 py-1.5 text-[10px]': size === 'sm',
            'px-4 py-2 text-xs': size === 'md',
            'px-6 py-3 text-sm': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
