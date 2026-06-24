import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';
import { getRoadmap, startRoadmapPhase, type RoadmapSummary } from '../api/roadmap';
import { getJobs, pauseJob } from '../api/jobs';
import { Map, CheckCircle2, Play, Pause, ChevronRight, ChevronDown } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import type { RoadmapPhase, Job } from '../types';
import { format, isValid } from 'date-fns';

const PhasePills = ({ names }: { names: string[] }) => {
  const [expanded, setExpanded] = useState(false);
  const displayNames = expanded ? names : names.slice(0, 5);
  const extraCount = names.length - 5;

  if (!names || names.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {displayNames.map(n => (
          <span key={n} className="text-xs font-mono text-slate-300 py-1.5 px-2.5 bg-slate-800/40 rounded border border-slate-700/50">
            {n}
          </span>
        ))}
        {!expanded && extraCount > 0 && (
          <span className="text-xs font-mono text-slate-500 py-1.5 px-2">
            + {extraCount} more
          </span>
        )}
      </div>
      {extraCount > 0 && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[10px] font-mono text-atlasmind-cyan uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
        >
          {expanded ? 'Show less' : 'Show all'} {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
};

export const Roadmap: React.FC = () => {
  const navigate = useNavigate();
  const { quota } = useAppStore();
  
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [summary, setSummary] = useState<RoadmapSummary | null>(null);
  const [activeJobs, setActiveJobs] = useState<Record<string, Job>>({});
  
  const activePhaseRef = useRef<HTMLDivElement>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchAll = async () => {
      try {
        const roadmapData = await getRoadmap();
        const activeJobsData = await getJobs({ status: 'running' });
        
        if (mounted) {
          setPhases(roadmapData.phases || []);
          setSummary(roadmapData.summary);
          
          const jobsMap: Record<string, Job> = {};
          activeJobsData.jobs?.forEach(j => {
            if (j.type === 'roadmap_generation') {
              // Match job name backward to phase title
              const phaseTitle = (j.name || '').replace('Roadmap Pipeline: ', '');
              const matchedPhase = roadmapData.phases.find(p => p.title === phaseTitle);
              if (matchedPhase) {
                jobsMap[matchedPhase.id] = j;
              }
            }
          });
          setActiveJobs(jobsMap);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Scroll to the first generating or planned phase
    if (phases.length > 0 && activePhaseRef.current) {
      setTimeout(() => {
        activePhaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500); // Wait for render
    }
  }, [phases.length > 0]);

  const handleStart = async (phase: RoadmapPhase) => {
    const cost = (phase.target_names?.length || phase.estimated_places) * 2; // Rough estimate
    
    // Quick quota check
    if (quota && (cost + quota.requests_made) > quota.requests_limit) {
      if (!window.confirm(`Only ${quota.requests_limit - quota.requests_made} requests remaining today. This phase might need ${cost}. Start anyway?`)) {
        return;
      }
    } else {
      if (!window.confirm(`This will use ~${cost} requests. Continue?`)) {
        return;
      }
    }

    setStartingId(phase.id);
    try {
      await startRoadmapPhase(phase.id);
      
      // Optimistic update
      setPhases(prev => prev.map(p => p.id === phase.id ? { ...p, status: 'generating' } : p));
      
      // Delay so polling can pick it up
      setTimeout(() => {
        setStartingId(null);
      }, 2000);
    } catch (e) {
      console.error(e);
      setStartingId(null);
    }
  };

  const handlePause = async (jobId: string) => {
    try {
      await pauseJob(jobId);
    } catch (e) {
      console.error(e);
    }
  };

  const getPhaseProgress = (phase: RoadmapPhase) => {
    const total = phase.target_names?.length || phase.estimated_places;
    if (phase.status === 'completed') return { current: total, total };
    
    const activeJob = activeJobs[phase.id];
    if (activeJob) {
      return { current: activeJob.processed, total };
    }
    
    return { current: 0, total };
  };

  const overallProgress = summary 
    ? ((summary.completed / (summary.completed + summary.in_progress + summary.pending)) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="mb-8 border-b border-atlasmind-border pb-4">
        <h2 className="text-3xl font-bold font-mono uppercase tracking-wider text-white">Data Generation Roadmap</h2>
        <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest">Bangladesh first, then the world 🌍</p>
      </div>

      {summary && (
        <Card className="bg-[#080C14] border-slate-800">
          <CardContent className="p-4 flex items-center justify-between gap-6">
            <div className="flex-1 font-mono text-sm tracking-widest flex items-center gap-4 text-slate-400">
              <span className="text-atlasmind-green items-center flex gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4" /> {summary.completed} done
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-atlasmind-cyan flex items-center gap-1 font-bold">
                {summary.in_progress} running
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">
                {summary.pending} remaining
              </span>
            </div>
            
            <div className="w-1/3 space-y-1">
              <div className="flex justify-end text-[10px] text-slate-500 font-mono font-bold">{overallProgress.toFixed(0)}%</div>
              <Progress value={overallProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {phases.length === 0 ? (
          <div className="text-slate-500 font-mono italic p-8 text-center bg-slate-800/10 rounded-lg border border-slate-800">No roadmap phases defined.</div>
        ) : (
          phases.map((phase, idx) => {
            const { current, total } = getPhaseProgress(phase);
            const isActive = phase.status === 'generating' || phase.status === 'running';
            const isCompleted = phase.status === 'completed';
            const job = activeJobs[phase.id];

            return (
              <div 
                key={phase.id} 
                ref={isActive || (summary?.completed === idx) ? activePhaseRef : null} // Rough ref setting
                className={`relative bg-atlasmind-surface border rounded-lg overflow-hidden transition-all duration-300 shadow-lg
                  ${isCompleted ? 'border-slate-800/60 opacity-80' : 
                    isActive ? 'border-atlasmind-cyan shadow-atlasmind-cyan/5 -translate-y-1' : 
                    'border-slate-800 border-dashed'}
                `}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Left accent strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 
                  ${isCompleted ? 'bg-atlasmind-green' : 
                    isActive ? 'bg-atlasmind-cyan animate-pulse' : 
                    'bg-slate-700'}
                `} />
                
                <div className="p-6 pl-8">
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold mb-1">
                        {phase.title.split('—')[0]?.trim()}
                      </div>
                      <h3 className="text-xl font-bold font-mono text-white tracking-wider flex items-center gap-2">
                        {phase.title.split('—')[1]?.trim() || phase.title}
                        {isActive && <span className="relative flex h-2.5 w-2.5 ml-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-atlasmind-cyan"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-atlasmind-cyan"></span>
                        </span>}
                      </h3>
                      {phase.description && <p className="text-sm font-mono text-slate-400 mt-1 max-w-xl">{phase.description}</p>}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                       <Badge variant={isActive ? 'running' : isCompleted ? 'completed' : 'pending'}>
                         {isActive ? 'Running' : phase.status}
                       </Badge>
                       <span className="text-[10px] bg-slate-800 border border-slate-700 font-mono font-bold uppercase tracking-widest text-slate-400 px-2 py-1 rounded">
                         {phase.priority}
                       </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="space-y-2 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-mono text-white font-bold">{current} <span className="text-slate-500">/ {total}</span></span>
                         <span className="text-xs font-mono text-slate-500">places</span>
                      </div>
                      <Badge variant="info" className="uppercase">{phase.type}</Badge>
                    </div>
                    <Progress value={current} max={total} colorClass={isCompleted ? 'bg-atlasmind-green' : isActive ? 'bg-atlasmind-cyan' : 'bg-slate-700'} />
                  </div>

                  {/* Previews */}
                  {phase.target_names && <PhasePills names={phase.target_names} />}

                  {/* Action Area */}
                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                    {isCompleted ? (
                      <>
                        <div className="text-xs font-mono text-atlasmind-green font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Completed {phase.created_at && isValid(new Date(phase.created_at)) ? format(new Date(phase.created_at), 'MMM d, yyyy') : ''}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')} className="text-slate-400 hover:text-white">View Jobs →</Button>
                      </>
                    ) : isActive ? (
                      <>
                        <div className="flex items-center gap-3 w-1/2">
                           <div className="text-xs font-mono text-atlasmind-cyan font-bold whitespace-nowrap">Job id #{job?.id ? job.id.substring(0,6) : '...'}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')} className="text-slate-400">View live →</Button>
                          {job && <Button variant="secondary" size="sm" className="h-8 text-atlasmind-amber border-atlasmind-amber/30 text-xs" onClick={() => handlePause(job.id)}>
                            <Pause className="w-3 h-3 mr-1" /> Pause
                          </Button>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-mono text-slate-500">Requires ~{((total || 0) * 2).toLocaleString()} API requests</div>
                        <Button 
                          className="bg-atlasmind-cyan text-black hover:bg-atlasmind-cyan/80 font-bold" 
                          onClick={() => handleStart(phase)}
                          isLoading={startingId === phase.id}
                        >
                          <Play className="w-4 h-4 mr-1.5" /> Start This Phase
                        </Button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

