import React, { useEffect, useState } from 'react';
import { X, Clock, HelpCircle, AlertTriangle, CheckCircle2, Copy, Download } from 'lucide-react';
import { getJob } from '../../api/jobs';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';
import type { Job } from '../../types';
import { formatDistanceToNow, format, isValid } from 'date-fns';

interface JobDetailPanelProps {
  jobId: string | null;
  onClose: () => void;
}

export const JobDetailPanel: React.FC<JobDetailPanelProps> = ({ jobId, onClose }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    
    let mounted = true;
    setLoading(true);
    getJob(jobId).then((data) => {
      if (mounted) {
        setJob(data);
        setLoading(false);
      }
    }).catch(err => {
      console.error(err);
      if (mounted) setLoading(false);
    });
    
    return () => { mounted = false; };
  }, [jobId]);

  if (!jobId) return null;

  const handleExport = () => {
    if (!job) return;
    const blob = new Blob([JSON.stringify(job.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlasmind-job-${job.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRetryFailed = () => {
    // Retry failed logic would go here
    console.log("Retry failed");
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-atlasmind-bg/80 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-atlasmind-surface border-l border-atlasmind-border z-50 flex flex-col shadow-2xl overflow-hidden transform transition-transform duration-300">
        {loading || !job ? (
          <div className="p-8 flex items-center justify-center flex-1">
            <div className="animate-pulse text-atlasmind-cyan font-mono">Loading job details...</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-atlasmind-border shrink-0 bg-slate-900/50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white mb-2 tracking-wider">{job.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status}>{(job.status || '').replace('_', ' ')}</Badge>
                    <span className="text-xs text-slate-500 font-mono tracking-widest">{job.place_type || 'Mixed'}</span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-atlasmind-bg custom-scrollbar">
              
              <div className="p-6 space-y-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-atlasmind-surface border border-atlasmind-border p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 font-bold">Total Processed</div>
                    <div className="text-lg font-mono text-white flex items-baseline gap-2">
                      {job.processed} <span className="text-xs text-slate-500">/ {job.total}</span>
                    </div>
                  </div>
                  <div className="bg-atlasmind-surface border border-atlasmind-border p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 font-bold">Duration</div>
                    <div className="text-lg font-mono text-white">
                      {job.started_at && job.completed_at && isValid(new Date(job.started_at))
                        ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true }) // approximation for now
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="bg-atlasmind-surface border border-atlasmind-border rounded-lg p-4 flex justify-between items-center text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 font-bold items-center flex gap-1 justify-center"><CheckCircle2 className="w-3 h-3 text-atlasmind-green" /> Succeeded</div>
                    <div className="text-lg font-mono text-atlasmind-green">{job.succeeded}</div>
                  </div>
                  <div className="w-px h-8 bg-atlasmind-border"></div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 font-bold items-center flex gap-1 justify-center"><div className="w-3 h-3 bg-atlasmind-red rounded-full flex items-center justify-center text-[8px] font-bold text-white">X</div> Failed</div>
                    <div className="text-lg font-mono text-atlasmind-red">{job.failed}</div>
                  </div>
                  <div className="w-px h-8 bg-atlasmind-border"></div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 font-bold items-center flex gap-1 justify-center"><Copy className="w-3 h-3 text-atlasmind-amber" /> Duplicates</div>
                    <div className="text-lg font-mono text-atlasmind-amber">{(job.results || []).filter(r => r.status === 'duplicate').length}</div>
                  </div>
                </div>

                {/* Quota Info */}
                <div className="bg-[#080C14] border border-slate-800 p-3 flex items-center justify-center rounded">
                  <span className="text-xs font-mono text-slate-400">
                    Used <span className="text-atlasmind-cyan font-bold">{job.results.reduce((acc, r) => acc + (r.questions_generated && r.questions_generated > 0 ? 2 : 1), 0)}</span> API requests
                  </span>
                </div>

                {/* Results Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Results Log</h3>
                    <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 text-[10px]">
                      <Download className="w-3 h-3 mr-1" /> Export JSON
                    </Button>
                  </div>

                  <div className="border border-atlasmind-border rounded-lg overflow-hidden bg-atlasmind-surface shadow-inner">
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left font-mono">
                        <thead className="bg-[#080C14] sticky top-0 z-10 border-b border-atlasmind-border">
                          <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            <th className="p-3 w-8 text-center">St</th>
                            <th className="p-3">Name</th>
                            <th className="p-3 w-16 text-center">Qty</th>
                            <th className="p-3 w-16 text-center">Qs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                          {(!job.results || job.results.length === 0) ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-500 italic">No execution data logged.</td>
                            </tr>
                          ) : job.results.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center">
                                {r.status === 'inserted' ? <CheckCircle2 className="w-3.5 h-3.5 mx-auto text-atlasmind-green" /> : 
                                 r.status === 'duplicate' ? <AlertTriangle className="w-3.5 h-3.5 mx-auto text-atlasmind-amber" /> : 
                                 r.status === 'low_quality' ? <AlertTriangle className="w-3.5 h-3.5 mx-auto text-orange-500" /> : 
                                 <div className="w-3.5 h-3.5 mx-auto bg-atlasmind-red rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-atlasmind-red/50">X</div>}
                              </td>
                              <td className="p-3 text-slate-300">
                                <div>{r.name}</div>
                                {r.status === 'failed' && (
                                  <div className="text-[10px] text-atlasmind-red mt-0.5 opacity-80">{r.error}</div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {r.quality ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-slate-400">{(r.quality * 100).toFixed(0)}%</span>
                                    <div className="w-full bg-slate-800 h-1 rounded-full">
                                      <div className="h-full rounded-full bg-atlasmind-cyan" style={{ width: `${r.quality * 100}%` }}></div>
                                    </div>
                                  </div>
                                ) : '—'}
                              </td>
                              <td className="p-3 text-center text-slate-400">
                                {r.questions_generated ? <Badge variant="info" className="px-1">{r.questions_generated}</Badge> : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            {job.failed > 0 && (
              <div className="p-4 border-t border-atlasmind-border bg-slate-900/80 shrink-0">
                <Button variant="secondary" className="w-full text-atlasmind-red border-atlasmind-red/20 hover:bg-atlasmind-red/10" onClick={handleRetryFailed}>
                  Retry {job.failed} Failed Places
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
