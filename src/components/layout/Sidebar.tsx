import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, ListChecks, Map, Settings, Compass } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Zap, label: 'Generate', to: '/generate' },
  { icon: ListChecks, label: 'Jobs', to: '/jobs' },
  { icon: Map, label: 'Roadmap', to: '/roadmap' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export const Sidebar: React.FC = () => {
  const quota = useAppStore((state) => state.quota);

  return (
    <>
    {/* Desktop Sidebar */}
    <aside className="hidden md:flex w-64 fixed inset-y-0 left-0 bg-atlasmind-surface border-r border-atlasmind-border flex-col z-20">
      <div className="p-6 border-b border-atlasmind-border flex items-center gap-3">
        <div className="w-8 h-8 rounded shrink-0 bg-atlasmind-cyan flex items-center justify-center">
          <Compass className="w-5 h-5 text-atlasmind-bg" />
        </div>
        <div>
          <h1 className="font-mono font-bold tracking-widest text-[#00C2FF] uppercase text-sm leading-tight">AtlasMind</h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Data Terminal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm tracking-wider uppercase font-bold transition-colors',
                isActive
                  ? 'bg-atlasmind-cyan/10 text-atlasmind-cyan'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              )
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {quota && (
        <div className="p-5 border-t border-atlasmind-border bg-[#080C14]/50">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">API Quota</span>
            <span className="text-[10px] font-mono text-slate-300">{(quota.requests_made ?? 0).toLocaleString()} / {(quota.requests_limit ?? 0).toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', {
                'bg-atlasmind-green': (quota.percentage ?? 0) < 60,
                'bg-atlasmind-amber': (quota.percentage ?? 0) >= 60 && (quota.percentage ?? 0) <= 80,
                'bg-atlasmind-red': (quota.percentage ?? 0) > 80,
              })}
              style={{ width: `${quota.percentage ?? 0}%` }}
            />
          </div>
        </div>
      )}
    </aside>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-atlasmind-surface border-t border-atlasmind-border z-30 pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center p-3 flex-1',
                isActive
                  ? 'text-atlasmind-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <item.icon className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              {item.label === 'Dashboard' ? 'Dash' : item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
    </>
  );
};
