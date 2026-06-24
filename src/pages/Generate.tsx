import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InfoBox } from '../components/ui/InfoBox';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../stores/appStore';
import { getJobs, getJob } from '../api/jobs';
import { checkDuplicates, startGeneration, getQueue, type CheckResult, type QueuePlace } from '../api/generate';
import { Zap, Search, Calendar, ChevronDown, ChevronRight, CheckCircle2, Clock, Lightbulb, ArrowRight, ListPlus, AlertTriangle, Info } from 'lucide-react';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import type { Job } from '../types';

export const Generate: React.FC = () => {
  const navigate = useNavigate();
  const { quota, activeJob, setActiveJob } = useAppStore();

  // Form State
  const [namesText, setNamesText] = useState('');
  const [placeType, setPlaceType] = useState('All');
  const [jobName, setJobName] = useState(`Manual — ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
  const [runNow, setRunNow] = useState(true);
  const [scheduleFor, setScheduleFor] = useState('');
  
  // Checking State
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<Record<string, CheckResult> | null>(null);
  
  // Selection State (after check)
  const [selectedNew, setSelectedNew] = useState<Record<string, boolean>>({});
  const [generateQuestions, setGenerateQuestions] = useState(true);
  
  // Execution
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queue
  const [queuePlaces, setQueuePlaces] = useState<QueuePlace[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<Record<string, boolean>>({});

  // Recent jobs
  const [recentJob, setRecentJob] = useState<Job | null>(null);

  useEffect(() => {
    getQueue().then(res => setQueuePlaces(res.places)).catch(console.error);
    getJobs({ limit: 1 }).then(res => setRecentJob(res.jobs[0] || null)).catch(console.error);
  }, []);

  const parsedNames = useMemo(() => {
    return namesText.split('\n').map(n => n.trim()).filter(Boolean);
  }, [namesText]);

  const newNamesList = useMemo(() => {
    if (!checkResults) return [];
    return parsedNames.filter(n => checkResults[n] && !checkResults[n].exists);
  }, [parsedNames, checkResults]);

  const existingNamesList = useMemo(() => {
    if (!checkResults) return [];
    return parsedNames.filter(n => checkResults[n] && checkResults[n].exists);
  }, [parsedNames, checkResults]);

  const selectedCount = useMemo(() => {
    if (!checkResults) return parsedNames.length;
    return Object.values(selectedNew).filter(Boolean).length;
  }, [checkResults, parsedNames, selectedNew]);

  const estimatedRequests = generateQuestions ? selectedCount * 2 : selectedCount;

  const handleCheck = async () => {
    if (parsedNames.length === 0) return;
    setIsChecking(true);
    setError(null);
    try {
      const res = await checkDuplicates(parsedNames);
      setCheckResults(res.results);
      const initialSelected: Record<string, boolean> = {};
      let newCount = 0;
      parsedNames.forEach(n => {
        if (res.results[n] && !res.results[n].exists) {
          initialSelected[n] = true;
          newCount++;
        }
      });
      setSelectedNew(initialSelected);
      toast.success(`Found ${newCount} new places`);
    } catch (err: any) {
      setError(err.message || 'Failed to check duplicates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStart = async () => {
    const namesToGenerate = newNamesList.filter(n => selectedNew[n]);
    if (namesToGenerate.length === 0) return;

    if (quota?.quota_exceeded) {
      setError('Cannot start generation: Quota exceeded.');
      return;
    }

    setIsStarting(true);
    setError(null);
    try {
      const resp = await startGeneration({
        job_name: jobName,
        names: namesToGenerate,
        place_type: placeType === 'All' ? null : placeType,
        generate_questions: generateQuestions,
        schedule_for: runNow ? null : new Date(scheduleFor).toISOString()
      });
      
      toast.success('✅ Generation job started!');
      
      // Wait briefly for job to propagate
      setTimeout(async () => {
        try {
          const freshJob = await getJob(resp.job_id);
          setActiveJob(freshJob);
        } catch {
          // fallback, useActiveJob hooks will pick it up
          getJobs({status: 'running'}).then(r => setActiveJob(r.jobs[0] || null));
        }
        setIsStarting(false);
      }, 1000);
      
      setCheckResults(null);
      setNamesText('');
    } catch (err: any) {
      setError(err.message || 'Generation setup failed');
      setIsStarting(false);
    }
  };

  const addQueueToInput = () => {
    const toAdd = queuePlaces.filter(p => selectedQueue[p.id]).map(p => p.name);
    if (toAdd.length) {
      setNamesText(prev => prev ? prev + '\n' + toAdd.join('\n') : toAdd.join('\n'));
      // Deselect them
      setSelectedQueue({});
      setQueueOpen(false);
      setCheckResults(null);
    }
  };
  
  const resetForm = () => {
    setActiveJob(null);
    setNamesText('');
    setCheckResults(null);
    setJobName(`Manual — ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
  }

  // Live View Render
  if (activeJob) {
    return (
      <div className="space-y-6">
        <div className="mb-8 border-b border-atlasmind-border pb-4">
          <h2 className="text-3xl font-bold font-mono uppercase tracking-wider text-white">Live Generation</h2>
          <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest">Job execution in progress</p>
        </div>

        <Card className="border-l-[3px] border-l-atlasmind-cyan">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white font-mono tracking-wider mb-2">{activeJob.name}</h3>
               <div className="flex items-center gap-3">
                  <Badge variant={activeJob.status}>{(activeJob.status || '').replace('_', ' ')}</Badge>
                  <span className="text-sm font-mono text-slate-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {activeJob.started_at && isValid(new Date(activeJob.started_at)) ? formatDistanceToNow(new Date(activeJob.started_at), { addSuffix: true }) : 'Pending'}
                  </span>
               </div>
              </div>
              {(activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'quota_exceeded') && (
                <Button onClick={resetForm}>
                  New Batch <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            <div className="space-y-2 bg-[#080C14] p-4 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm text-slate-300 font-mono font-bold tracking-widest uppercase">
                <span>Progress</span>
                <span className="text-atlasmind-cyan">{activeJob.processed} / {activeJob.total}</span>
              </div>
              <Progress value={activeJob.processed} max={activeJob.total} className="h-4" colorClass="bg-atlasmind-cyan" />
              <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-2">
                <span className="text-atlasmind-green font-bold">✅ {activeJob.succeeded} inserted</span>
                <span className="mx-3 text-slate-700">|</span>
                <span className="text-atlasmind-red font-bold">❌ {activeJob.failed} failed</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs text-slate-500 font-mono uppercase tracking-widest font-bold block mb-2">Live stream</span>
              <div className="border border-slate-800 rounded-lg bg-[#080C14] p-4 max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                {(!activeJob.results || activeJob.results.length === 0) ? (
                  <div className="text-slate-600 italic font-mono text-sm py-4 text-center">Waiting for items...</div>
                ) : (
                  activeJob.results.slice().reverse().map((res, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b border-slate-800/50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                       <div className="shrink-0 mt-0.5">
                         {res.status === 'inserted' ? <CheckCircle2 className="w-4 h-4 text-atlasmind-green" /> : 
                          res.status === 'duplicate' ? <AlertTriangle className="w-4 h-4 text-atlasmind-amber" /> : 
                          <div className="w-4 h-4 rounded-full bg-atlasmind-red flex items-center justify-center text-[10px] font-bold text-white border border-atlasmind-red/50">X</div>}
                       </div>
                       <div>
                         <div className="font-mono text-sm text-slate-200">
                           {res.name}
                           {res.status === 'inserted' && res.quality && (
                             <span className="text-atlasmind-cyan ml-3 text-xs tracking-wider">Quality: {(res.quality * 100).toFixed(0)}%</span>
                           )}
                           {res.status === 'inserted' && (
                             <span className="text-slate-500 ml-3 text-xs tracking-wider border border-slate-700 px-1.5 py-0.5 rounded">{res.questions_generated} Qs</span>
                           )}
                           {res.status === 'duplicate' && (
                             <span className="text-atlasmind-amber ml-3 text-xs tracking-wider bg-atlasmind-amber/10 px-1.5 py-0.5 rounded">Duplicate</span>
                           )}
                         </div>
                         {res.status === 'failed' && (
                           <div className="text-atlasmind-red text-xs font-mono mt-1 opacity-90">{res.error || 'Unknown error'}</div>
                         )}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 border-b border-atlasmind-border pb-4">
        <h2 className="text-3xl font-bold font-mono uppercase tracking-wider text-white">Generate Places</h2>
        <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest">Enter place names → Atlas generates structured data</p>
      </div>

      {error && <InfoBox variant="error" title="Generation Error" className="mb-6">{error}</InfoBox>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN: Input */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {!checkResults ? (
                <>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs uppercase font-mono text-slate-400 font-bold tracking-widest">Target Names</label>
                      <span className="text-xs text-slate-500 font-mono">{parsedNames.length} names entered</span>
                    </div>
                    <textarea
                      value={namesText}
                      onChange={(e) => setNamesText(e.target.value)}
                      placeholder="Dhaka\nCox's Bazar\nSundarbans\n..."
                      className="w-full h-48 bg-[#080C14] border border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-white focus:border-atlasmind-cyan outline-none transition-colors resize-none placeholder:text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-mono text-slate-400 font-bold tracking-widest mb-2">Place Type</label>
                      <select 
                        value={placeType} 
                        onChange={(e) => setPlaceType(e.target.value)}
                        className="w-full bg-[#080C14] border border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-white focus:border-atlasmind-cyan outline-none transition-colors appearance-none"
                      >
                        {['All', 'Country', 'City', 'Landmark', 'Natural', 'Historical', 'Religious', 'Geographic', 'Tourist'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-mono text-slate-400 font-bold tracking-widest mb-2">Job Name</label>
                      <input
                        value={jobName}
                        onChange={(e) => setJobName(e.target.value)}
                        className="w-full bg-[#080C14] border border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-white focus:border-atlasmind-cyan outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={runNow} onChange={() => setRunNow(true)} className="accent-atlasmind-cyan w-4 h-4" />
                      <span className="text-sm font-mono text-slate-300">Run now</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!runNow} onChange={() => setRunNow(false)} className="accent-atlasmind-cyan w-4 h-4" />
                      <span className="text-sm font-mono text-slate-300">Schedule for later</span>
                    </label>
                    {!runNow && (
                      <input 
                        type="datetime-local" 
                        value={scheduleFor}
                        onChange={(e) => setScheduleFor(e.target.value)}
                        className="bg-[#080C14] border border-slate-700 rounded px-3 py-1 text-xs text-white font-mono focus:border-atlasmind-cyan outline-none"
                      />
                    )}
                  </div>

                  <Button className="w-full h-12 text-sm" onClick={handleCheck} disabled={parsedNames.length === 0 || isChecking} isLoading={isChecking}>
                    <Search className="w-4 h-4 mr-2 hidden sm:block" /> Check Duplicates
                  </Button>
                </>
              ) : (
                /* AFTER CHECK */
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                     <h4 className="font-mono font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                       <ListPlus className="w-4 h-4 text-atlasmind-cyan" /> Select Places
                     </h4>
                     <Button variant="ghost" size="sm" onClick={() => setCheckResults(null)}>Edit List</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#080C14] p-4 rounded-lg border border-slate-800">
                    
                    {/* Exists */}
                    <div>
                      <div className="text-xs font-mono text-atlasmind-green uppercase tracking-widest font-bold mb-3 pb-2 border-b border-slate-800">
                        Already in DB ({existingNamesList.length})
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                        {existingNamesList.length === 0 && <div className="text-slate-600 text-xs font-mono italic">None</div>}
                        {existingNamesList.map(n => (
                          <div key={n} className="text-xs font-mono text-slate-500 py-1.5 px-2 bg-slate-800/20 rounded border border-slate-800/50 flex items-center gap-2 line-clamp-1">
                             <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                             {n}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* New */}
                    <div>
                      <div className="flex justify-between items-end border-b border-slate-800 pb-2 mb-3">
                        <div className="text-xs font-mono text-atlasmind-cyan uppercase tracking-widest font-bold">
                          New ({newNamesList.length})
                        </div>
                        <button 
                          onClick={() => {
                            const allChecked = newNamesList.every(n => selectedNew[n]);
                            const next: Record<string, boolean> = {};
                            newNamesList.forEach(n => next[n] = !allChecked);
                            setSelectedNew(next);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white font-mono uppercase tracking-widest"
                        >
                          Toggle All
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                        {newNamesList.length === 0 && <div className="text-slate-600 text-xs font-mono italic">None</div>}
                        {newNamesList.map(n => (
                          <label key={n} className="flex items-center gap-2 text-xs font-mono text-slate-300 py-1.5 px-2 bg-slate-800/40 rounded border border-atlasmind-border cursor-pointer hover:bg-slate-700/50 transition-colors line-clamp-1" title={n}>
                             <input 
                               type="checkbox" 
                               checked={!!selectedNew[n]}
                               onChange={(e) => setSelectedNew({...selectedNew, [n]: e.target.checked})}
                               className="accent-atlasmind-cyan w-3.5 h-3.5 shrink-0" 
                             />
                             {n}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-slate-800/30 rounded border border-atlasmind-border">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={generateQuestions} 
                        onChange={(e) => setGenerateQuestions(e.target.checked)}
                        className="accent-atlasmind-cyan w-4 h-4" 
                      />
                      <div>
                        <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">Generate Questions Automatically</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">Creates 10 trivia questions per place. Uses 1 extra API request.</div>
                      </div>
                    </label>
                  </div>

                  <Button 
                    className="w-full h-14 text-sm mt-4 tracking-widest bg-atlasmind-green/20 border-atlasmind-green/50 text-atlasmind-green hover:bg-atlasmind-green/30" 
                    variant="ghost"
                    onClick={handleStart}
                    disabled={selectedCount === 0 || isStarting}
                    isLoading={isStarting}
                  >
                    Start Generation →
                    <span className="opacity-70 ml-2 border-l border-atlasmind-green/30 pl-2">
                       Will generate {selectedCount} places
                    </span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-slate-800/30 transition-colors flex flex-row items-center justify-between"
              onClick={() => setQueueOpen(!queueOpen)}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-slate-400" />
                From Game Feedback Queue ({queuePlaces.length})
              </CardTitle>
              {queueOpen ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
            </CardHeader>
            {queueOpen && (
              <CardContent className="pt-0 border-t border-slate-800">
                <div className="space-y-4 pt-4">
                  <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {queuePlaces.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-3 bg-[#080C14] border border-slate-800 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
                        <input 
                           type="checkbox" 
                           checked={!!selectedQueue[p.id]}
                           onChange={(e) => setSelectedQueue({...selectedQueue, [p.id]: e.target.checked})}
                           className="accent-atlasmind-cyan w-4 h-4 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-slate-200 truncate">{p.name}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Reported {p.reported} times</div>
                        </div>
                      </label>
                    ))}
                    {queuePlaces.length === 0 && <div className="text-slate-500 font-mono text-sm italic py-4">No unknown places from game yet</div>}
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    disabled={Object.values(selectedQueue).filter(Boolean).length === 0}
                    onClick={addQueueToInput}
                  >
                    Add selected to input
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
               <h4 className="font-mono font-bold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-atlasmind-cyan" /> Quota Status
               </h4>
               {quota ? (
                 <div className="space-y-4">
                   <div>
                     <div className="flex justify-between text-xs text-slate-400 font-mono font-bold tracking-widest uppercase mb-1.5">
                       <span>Today</span>
                       <span>{(quota.requests_made ?? 0).toLocaleString()} / {(quota.requests_limit ?? 0).toLocaleString()}</span>
                     </div>
                     <Progress value={quota.percentage ?? 0} colorClass={(quota.percentage ?? 0) > 80 ? 'bg-atlasmind-red' : (quota.percentage ?? 0) > 60 ? 'bg-atlasmind-amber' : 'bg-atlasmind-green'} />
                   </div>
                   
                   <div className="bg-[#080C14] p-3 rounded border border-slate-800 flex items-start gap-3">
                     <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                     <div>
                       <div className="text-xs font-mono text-slate-300">This batch will use <span className="text-atlasmind-cyan font-bold">~{estimatedRequests}</span> requests</div>
                       {(estimatedRequests + (quota.requests_made ?? 0) > (quota.requests_limit ?? 0)) && (
                         <div className="text-[10px] text-atlasmind-amber font-mono mt-2 leading-relaxed">
                           ⚠️ This batch needs {estimatedRequests} requests but only {(quota.requests_limit ?? 0) - (quota.requests_made ?? 0)} left today. Generation will pause and resume tomorrow automatically.
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-slate-500 font-mono text-xs italic">Loading quota...</div>
               )}
            </CardContent>
          </Card>

          <Card>
           <CardContent className="p-6">
             <h4 className="font-mono font-bold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
               <Lightbulb className="w-4 h-4 text-atlasmind-amber" /> Tips for best results
             </h4>
             <ul className="text-xs font-mono text-slate-400 space-y-3 leading-relaxed">
               <li className="flex items-start gap-2">
                 <span className="text-atlasmind-cyan mt-1">•</span>
                 <span>Use specific names: <strong>"Lalbagh Fort Dhaka"</strong> not "Fort"</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="text-atlasmind-cyan mt-1">•</span>
                 <span>Include country for disambiguation: <strong>"Sylhet Bangladesh"</strong></span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="text-atlasmind-cyan mt-1">•</span>
                 <span>Max 50 names per batch recommended</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="text-atlasmind-cyan mt-1">•</span>
                 <span>Questions auto-generated unless disabled</span>
               </li>
             </ul>
           </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
               <h4 className="font-mono font-bold text-white uppercase tracking-wider text-sm mb-4 flex items-center justify-between">
                 Recent Job
                 <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => navigate('/jobs')}>View all →</Button>
               </h4>
               {recentJob ? (
                 <div className="bg-[#080C14] border border-slate-800 rounded-lg p-3">
                   <div className="font-mono font-bold text-sm text-slate-200 truncate">{recentJob.name}</div>
                   <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1 mb-2">
                     {recentJob.created_at && isValid(new Date(recentJob.created_at)) ? format(new Date(recentJob.created_at), 'MMM d, yyyy') : 'Unknown'}
                   </div>
                   <div className="flex items-center gap-2">
                     <Badge variant={recentJob.status}>{recentJob.status}</Badge>
                     <span className="text-xs text-slate-400 font-mono ml-auto">{recentJob.processed}/{recentJob.total}</span>
                   </div>
                 </div>
               ) : (
                 <div className="text-slate-500 font-mono text-xs italic">No recent jobs</div>
               )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
