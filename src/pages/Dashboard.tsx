import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';
import { InfoBox } from '../components/ui/InfoBox';
import { Skeleton } from '../components/ui/Skeleton';
import { useAppStore } from '../stores/appStore';
import { getJobs } from '../api/jobs';
import { getHealth, getRoadmapProgress, type HealthStatus, type RoadmapProgress } from '../api/dashboard';
import { Activity, Database, CheckCircle2, Server, Power, Clock, ArrowRight, PauseCircle } from 'lucide-react';
import type { Job } from '../types';
import { formatDistanceToNow, isValid } from 'date-fns';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeJob, quota } = useAppStore();
  
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [progress, setProgress] = useState<RoadmapProgress | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [fetchingRecent, setFetchingRecent] = useState(true);

  // Health Polling (60s)
  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const data = await getHealth();
        if (mounted) {
          setHealth(data);
          setHealthError(false);
        }
      } catch (err) {
        if (mounted) setHealthError(true);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Roadmap Progress (on mount)
  useEffect(() => {
    getRoadmapProgress()
      .then(setProgress)
      .catch((err) => console.error('Failed to load progress', err));
  }, []);

  // Recent Jobs (poll periodically or on mount)
  useEffect(() => {
    let mounted = true;
    const fetchRecentJobs = async () => {
      try {
        const data = await getJobs({ limit: 5 });
        if (mounted) setRecentJobs(data.jobs || []);
      } catch (err) {
        console.error('Failed to load recent jobs', err);
      } finally {
        if (mounted) setFetchingRecent(false);
      }
    };
    fetchRecentJobs();
    const interval = setInterval(fetchRecentJobs, 5000); // Polling recent jobs as well to keep dashboard fresh
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const hasQuotaExceededJob = recentJobs.some(j => j.status === 'quota_exceeded');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8 border-b border-atlasmind-border pb-4">
        <div>
          <h2 className="text-3xl font-bold font-mono uppercase tracking-wider text-white">System Overview</h2>
          <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest">AtlasMind Data Terminal Activity</p>
        </div>
      </div>

      {hasQuotaExceededJob && (
        <InfoBox variant="warning" title="Quota Exceeded">
          ⚠️ Quota exceeded — jobs paused. Quota resets at midnight UTC.
        </InfoBox>
      )}

      {/* SECTION 1: STATUS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: API Status */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">API Status</span>
            </div>
            
            <div className="flex items-center gap-3 mt-auto">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  healthError ? 'bg-atlasmind-red' : 'bg-atlasmind-green'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  healthError ? 'bg-atlasmind-red' : 'bg-atlasmind-green'
                }`}></span>
              </div>
              <div>
                <div className="text-xl font-bold text-white font-mono uppercase">
                  {healthError ? 'Offline' : 'Online'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                  Atlas GMP Backend {health?.version ? `v${health.version}` : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Quota */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Today's Quota</span>
            </div>
            
            <div className="mt-auto space-y-2">
              {!quota ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-xl font-bold text-white font-mono">
                    <span className={quota.percentage > 80 ? 'text-atlasmind-red' : quota.percentage > 60 ? 'text-atlasmind-amber' : ''}>
                      {quota.requests_made?.toLocaleString?.() ?? quota.requests_made}
                    </span>
                    <span className="text-slate-500 text-sm"> / {quota.requests_limit?.toLocaleString?.() ?? quota.requests_limit}</span>
                  </div>
                  <Progress 
                    value={quota.percentage} 
                    colorClass={
                      quota.percentage > 80 ? 'bg-atlasmind-red' 
                      : quota.percentage > 60 ? 'bg-atlasmind-amber' 
                      : 'bg-atlasmind-green'
                    }
                  />
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    Resets at midnight UTC
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Places Generated */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Places Generated</span>
            </div>
            
            <div className="mt-auto">
              {!progress ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-atlasmind-cyan font-mono">
                    {progress.total_places_generated?.toLocaleString?.() ?? progress.total_places_generated}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Across all phases
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Bangladesh Progress */}
        <Card className="flex flex-col justify-between relative overflow-hidden">
          <CardContent className="p-5 flex flex-col h-full z-10 relative">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Bangladesh</span>
            </div>
            
            <div className="mt-auto flex items-end justify-between">
              <div>
                {!progress ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white font-mono">
                      {progress.bd_progress_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                      BD data roadmap
                    </div>
                  </>
                )}
              </div>

              {/* SVG Circular Progress */}
              {progress && (
                <div className="shrink-0 relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-atlasmind-green transition-all duration-1000 ease-out"
                      strokeWidth="3"
                      strokeDasharray={`${progress.bd_progress_pct}, 100`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* SECTION 2: ACTIVE JOB */}
      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest pt-4">Active Generation</h3>
      {activeJob && (activeJob.status === 'running' || activeJob.status === 'pending') ? (
        <div className="bg-atlasmind-surface border border-atlasmind-border rounded-xl border-l-[3px] border-l-atlasmind-cyan overflow-hidden shadow-[0_0_15px_rgba(0,194,255,0.05)]">
          <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white font-mono tracking-wider">{activeJob.name}</h3>
                    <Badge variant="running" className="animate-pulse">Running</Badge>
                    {activeJob.place_type && (
                      <Badge variant="info">{activeJob.place_type}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Running since {activeJob.started_at && isValid(new Date(activeJob.started_at)) ? formatDistanceToNow(new Date(activeJob.started_at), { addSuffix: true }) : 'just now'}
                  </div>
                </div>

                <Button variant="danger" size="sm" className="hidden border-dashed">
                  <PauseCircle className="w-3.5 h-3.5 mr-1" />
                  Pause Job
                </Button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-mono font-bold tracking-widest uppercase">
                  <span>Processing</span>
                  <span className="text-atlasmind-cyan">{activeJob.processed} / {activeJob.total}</span>
                </div>
                <Progress value={activeJob.processed} max={activeJob.total} className="h-3" colorClass="bg-atlasmind-cyan" />
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                  <span className="text-atlasmind-green">✅ {activeJob.succeeded} inserted</span>
                  <span className="mx-2">·</span>
                  <span className="text-atlasmind-red">❌ {activeJob.failed} failed</span>
                </div>
              </div>
            </div>

            {/* Live Results Preview */}
            <div className="w-full md:w-1/3 bg-[#080C14] border border-slate-800 rounded-lg p-4 flex flex-col shrink-0">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold mb-3 block">Live Extraction Stream</span>
              <div className="flex-1 overflow-y-auto max-h-32 space-y-2 pr-1 custom-scrollbar text-xs font-mono leading-tight">
                {(!activeJob.results || activeJob.results.length === 0) ? (
                  <div className="text-slate-600 italic">No items processed yet...</div>
                ) : (
                  activeJob.results.slice(-5).reverse().map((res, i) => (
                    <div key={i} className="flex items-start gap-2 border-b border-slate-800/50 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                      {res.status === 'inserted' || res.status === 'duplicate' ? (
                        <span className="text-atlasmind-green shrink-0 mt-0.5">✅</span>
                      ) : (
                        <span className="text-atlasmind-red shrink-0 mt-0.5">❌</span>
                      )}
                      <div>
                        <span className={res.status === 'inserted' ? 'text-slate-200' : 'text-slate-400'}>
                          {res.name}
                        </span>
                        {res.status === 'inserted' && res.quality && (
                          <span className="text-atlasmind-cyan text-[10px] ml-2">(Q: {(res.quality * 100).toFixed(0)}%)</span>
                        )}
                        {res.status === 'failed' && (
                          <div className="text-atlasmind-red text-[10px] mt-0.5 opacity-80 line-clamp-1" title={res.error || 'Failed'}>
                            {res.error || 'Extraction failed'}
                          </div>
                        )}
                        {res.status === 'duplicate' && (
                          <span className="text-atlasmind-amber text-[10px] ml-2">(Duplicate)</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      ) : (
        <Card className="border-dashed bg-atlasmind-surface/50">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Power className="w-8 h-8 text-slate-600 mb-3" />
            <h4 className="text-white font-mono uppercase tracking-wider font-bold">No active job</h4>
            <p className="text-slate-400 text-sm mt-1 mb-4">Start generating coordinates and trivia from the Generate tab.</p>
            <Button onClick={() => navigate('/generate')}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Generate Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: RECENT JOBS */}
      <div className="flex items-center justify-between pt-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest">Recent Jobs</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
          View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-atlasmind-border bg-[#080C14]/50 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 w-48">Progress</th>
                <th className="py-3 px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fetchingRecent && recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </td>
                </tr>
              ) : recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    No recent jobs found.
                  </td>
                </tr>
              ) : (
                recentJobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/jobs`)} // In a real app we'd navigate to `/jobs/${job.id}`
                  >
                    <td className="py-3 px-6 font-bold text-slate-200">{job.name}</td>
                    <td className="py-3 px-6">
                      <span className="text-xs text-slate-400 py-1 px-2 bg-slate-800 rounded">
                        {job.place_type || 'Mixed'}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <Badge variant={job.status}>{(job.status || '').replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <Progress value={job.processed} max={job.total} className="h-1.5" />
                        <span className="text-[10px] text-slate-400 shrink-0">{job.processed}/{job.total}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right text-xs text-slate-500">
                      {job.created_at && isValid(new Date(job.created_at)) ? new Date(job.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
