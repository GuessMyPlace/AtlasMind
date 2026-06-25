import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';
import { JobDetailPanel } from '../components/jobs/JobDetailPanel';
import { getJobs, pauseJob, resumeJob, cancelJob } from '../api/jobs';
import { ListChecks, Play, Pause, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { Job, JobStatus } from '../types';
import { format, isValid } from 'date-fns';

export const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters and Pagination
  const [filter, setFilter] = useState<'All' | JobStatus | 'scheduled'>('All');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Detail panel state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const fetchJobs = async () => {
      try {
        const offset = page * limit;
        const params: Record<string, any> = { limit, offset };
        if (filter !== 'All') {
          if (filter === 'scheduled') {
            // Need a way to filter scheduled... assuming backend handles it or we'll just request all and filter if not supported.
            params.status = 'scheduled'; 
          } else {
            params.status = filter;
          }
        }
        
        const data = await getJobs(params);
        if (mounted) {
          setJobs(data.jobs || []);
          setTotal(data.total || 0);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setLoading(false);
      }
    };
    
    fetchJobs();
    
    // Poll if viewing running jobs
    let interval: any;
    if (filter === 'running' || filter === 'All') {
      interval = setInterval(fetchJobs, 5000);
    }
    
    return () => { 
      mounted = false; 
      if (interval) clearInterval(interval);
    };
  }, [filter, page]);

  const handleAction = async (e: React.MouseEvent, action: 'pause' | 'resume' | 'cancel', id: string) => {
    e.stopPropagation();
    try {
      if (action === 'pause') { await pauseJob(id); toast('⏸ Job paused', { icon: '⏸' }); }
      if (action === 'resume') { await resumeJob(id); toast.success('▶ Job resumed'); }
      if (action === 'cancel') { await cancelJob(id); toast.error('Job cancelled'); }
      
      // Optistic update
      setJobs(prev => prev.map(j => {
        if (j.id === id) {
          return {
            ...j, 
            status: action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'failed'
          };
        }
        return j;
      }));
    } catch (err) {
      console.error(`Failed to ${action} job`, err);
    }
  };

  const tabs = ['All', 'running', 'completed', 'failed', 'scheduled'];

  return (
    <div className="space-y-6">
      <div className="mb-8 border-b border-atlasmind-border pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-mono uppercase tracking-wider text-white">Generation Jobs</h2>
          <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest">Active and Historic Executions</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pt-4 pb-0 border-b-0 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-px overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setFilter(tab as any); setPage(0); }}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
                  filter === tab 
                    ? 'border-atlasmind-cyan text-atlasmind-cyan bg-atlasmind-cyan/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm min-w-[800px]">
              <thead className="bg-[#080C14]/50 border-b border-atlasmind-border">
                <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  <th className="py-3 px-6">JDID</th>
                  <th className="py-3 px-6">Job Name</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 w-48">Progress</th>
                  <th className="py-3 px-6">Created</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 transition-opacity" style={{ opacity: loading ? 0.5 : 1 }}>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="text-slate-500 font-mono italic">No jobs yet. Start from Generate →</div>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr 
                      key={job.id} 
                      className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedJobId === job.id ? 'bg-slate-800/50' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <td className="py-4 px-6 text-slate-600 font-bold">#{job.id.substring(0,6)}</td>
                      <td className="py-4 px-6 text-slate-200 font-bold truncate max-w-[200px]" title={job.name}>{job.name}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] text-slate-400 py-1.5 px-2 bg-slate-800 rounded border border-slate-700 uppercase tracking-widest">
                          {job.place_type || 'Mixed'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status}>{(job.status || '').replace('_', ' ')}</Badge>
                          {job.status === 'running' && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-atlasmind-cyan"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-atlasmind-cyan"></span>
                            </span>
                          )}
                        </div>
                        {job.scheduled_for && job.status === 'pending' && (
                          <div className="text-[10px] text-atlasmind-amber mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Scheduled
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Progress value={job.processed} max={job.total} className="h-1.5 min-w-[80px]" />
                          <span className="text-[10px] text-slate-400 shrink-0 w-12">{job.processed}/{job.total}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {job.created_at && isValid(new Date(job.created_at)) ? format(new Date(job.created_at), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {job.status === 'running' && (
                             <>
                               <button title="Pause Job" onClick={(e) => handleAction(e, 'pause', job.id)} className="p-1.5 bg-slate-800 hover:bg-atlasmind-amber/20 hover:text-atlasmind-amber text-slate-400 rounded transition-colors"><Pause className="w-4 h-4" /></button>
                               <button title="Cancel Job" onClick={(e) => handleAction(e, 'cancel', job.id)} className="p-1.5 bg-slate-800 hover:bg-atlasmind-red/20 hover:text-atlasmind-red text-slate-400 rounded transition-colors"><X className="w-4 h-4" /></button>
                             </>
                           )}
                           {job.status === 'paused' && (
                             <>
                               <button title="Resume Job" onClick={(e) => handleAction(e, 'resume', job.id)} className="p-1.5 bg-slate-800 hover:bg-atlasmind-green/20 hover:text-atlasmind-green text-slate-400 rounded transition-colors"><Play className="w-4 h-4 pl-0.5" /></button>
                               <button title="Cancel Job" onClick={(e) => handleAction(e, 'cancel', job.id)} className="p-1.5 bg-slate-800 hover:bg-atlasmind-red/20 hover:text-atlasmind-red text-slate-400 rounded transition-colors"><X className="w-4 h-4" /></button>
                             </>
                           )}
                           {job.status === 'quota_exceeded' && (
                             <button title="Resume (Needs active quota)" onClick={(e) => handleAction(e, 'resume', job.id)} className="p-1.5 bg-slate-800/50 hover:bg-atlasmind-green/20 hover:text-atlasmind-green text-slate-500 rounded transition-colors"><Play className="w-4 h-4 pl-0.5 opacity-50" /></button>
                           )}
                           {job.status === 'pending' && job.scheduled_for && (
                             <button title="Run Now" onClick={(e) => handleAction(e, 'resume', job.id)} className="p-1.5 bg-slate-800 hover:bg-atlasmind-cyan/20 hover:text-atlasmind-cyan text-slate-400 rounded transition-colors border border-atlasmind-cyan/30 text-[10px] font-bold px-3 py-1">RUN NOW</button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {total > limit && (
            <div className="p-4 border-t border-atlasmind-border bg-[#080C14]/30 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">
                Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-xs font-mono text-slate-400 min-w-[20px] text-center">{page + 1}</div>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Panel Detail */}
      <JobDetailPanel 
        jobId={selectedJobId} 
        onClose={() => setSelectedJobId(null)} 
      />
    </div>
  );
};
