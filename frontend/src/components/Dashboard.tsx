import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Database, Brain, Ticket, Compass, ArrowUpRight, Zap, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { isValid } from 'date-fns';

interface StatsRates {
  landmark: number;
  city: number;
  country: number;
  total: number;
}

interface Stats {
  rates: StatsRates;
  questions_count: number;
  pending_queue_count: number;
  roadmap_count: number;
  jobs_count: number;
  total_tokens: number;
  total_api_calls: number;
}

interface QuotaLog {
  id: string;
  tokens_used: number;
  calls_count: number;
  model: string;
  prompt_summary: string;
  timestamp: string;
}

interface DashboardProps {
  stats: Stats;
  quotaLogs: QuotaLog[];
  onRefresh: () => void;
  loading: boolean;
}

export default function Dashboard({ stats, quotaLogs, onRefresh, loading }: DashboardProps) {
  // Format quota timeline
  const chartData = [...quotaLogs].reverse().map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    tokens: log.tokens_used,
    summary: log.prompt_summary
  })).slice(-15); // latest 15 operations

  const placeDistribution = [
    { name: 'Landmarks', num: stats.rates.landmark, color: '#00C2FF' },
    { name: 'Cities', num: stats.rates.city, color: '#10B981' },
    { name: 'Countries', num: stats.rates.country, color: '#F59E0B' }
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        
        {/* Total Places */}
        <div id="card-total-places" className="bg-[#0F1623] p-5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-tight">Total Places</span>
          <span className="text-3xl font-bold text-white">{stats.rates.total}</span>
          <span className="text-[10px] text-emerald-400 mt-2 font-mono">
            {stats.rates.landmark} Lnd · {stats.rates.city} Cit · {stats.rates.country} Ctr
          </span>
        </div>

        {/* Total Trivia Questions */}
        <div id="card-total-questions" className="bg-[#0F1623] p-5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-tight">Trivia Records</span>
          <span className="text-3xl font-bold text-white">{stats.questions_count}</span>
          <span className="text-[10px] text-[#00C2FF] mt-2 font-mono">
            Avg {stats.rates.total > 0 ? (stats.questions_count / stats.rates.total).toFixed(1) : 0} per place
          </span>
        </div>

        {/* Tickets */}
        <div id="card-pending-tickets" className="bg-[#0F1623] p-5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-tight">Pending Tickets</span>
          <span className="text-3xl font-bold text-white">{stats.pending_queue_count}</span>
          <span className="text-[10px] text-rose-400 mt-2 font-mono flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Reported missing by players
          </span>
        </div>

        {/* Quota Consumed */}
        <div id="card-quota-consumed" className="bg-[#0F1623] p-5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-tight">Consumed Quota</span>
          <span className="text-3xl font-bold text-white">{stats.total_tokens.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">
            Tokens over {stats.total_api_calls} pipeline tasks
          </span>
        </div>

      </div>

      {/* Main dashboard visual bento section */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Token Consumption Graph */}
        <div className="xl:col-span-2 bg-[#0F1623] rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gemini API Token Wave</h3>
            <button 
              id="btn-refresh-stats"
              disabled={loading}
              onClick={onRefresh}
              className="px-3 py-1 bg-[#00C2FF] text-[#080C14] text-[10px] font-bold rounded hover:bg-[#00C2FF]/90 transition-colors uppercase disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="flex-1 p-6 min-h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00C2FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke="#4B5563" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#4B5563" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F1623', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}
                    itemStyle={{ color: '#00C2FF', fontFamily: 'monospace', fontSize: 11 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#00C2FF" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTokens)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                No api tokens logs recorded. Generate maps data to populate.
              </div>
            )}
          </div>
        </div>

        {/* Geodata Distribution Chart & Logs */}
        <section className="flex flex-col gap-6">
          <div className="bg-[#0F1623] p-5 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Category Dispersion</h3>
            
            <div className="space-y-4">
              {placeDistribution.map((entry) => {
                const perc = stats.rates.total > 0 ? ((entry.num / stats.rates.total) * 100).toFixed(0) : '0';
                return (
                  <div key={entry.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">{entry.name}</span>
                      <span className="font-mono text-slate-300">{perc}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${perc}%`, backgroundColor: entry.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0F1623] flex-1 rounded-xl border border-slate-800 flex flex-col overflow-hidden min-h-[200px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider p-4 border-b border-slate-800 shrink-0">Recent Operations</h3>
            <ul className="flex-1 overflow-y-auto w-full p-4 space-y-4">
              {quotaLogs.slice(0, 5).map((log) => (
                <li key={log.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded border border-[#00C2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-[#00C2FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate" title={log.prompt_summary}>{log.prompt_summary}</p>
                    <p className="text-[10px] text-slate-500">
                      {log.timestamp && isValid(new Date(log.timestamp)) ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'} · {(log.tokens_used || 0).toLocaleString()} tokens
                    </p>
                  </div>
                </li>
              ))}
              {quotaLogs.length === 0 && (
                <li className="text-center text-slate-500 text-xs py-4">No recent queries.</li>
              )}
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
