import React, { useState, useEffect } from 'react';
import { AtlasMindRoadmap, AtlasMindJob } from '../types.js';
import { MapPin, AlertCircle, Plus, Sparkles, Loader2, Play, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoadmapViewProps {
  roadmap: AtlasMindRoadmap[];
  jobs: AtlasMindJob[];
  loading: boolean;
  onAddRoadmap: (item: { title: string; description: string; type: 'country' | 'city' | 'landmark'; priority: 'high' | 'medium' | 'low'; estimated_places: number }) => Promise<void>;
  onTriggerGenerate: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function RoadmapView({ roadmap, jobs, loading, onAddRoadmap, onTriggerGenerate, onRefresh }: RoadmapViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'country' | 'city' | 'landmark'>('landmark');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [estimatedPlaces, setEstimatedPlaces] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Track the most recent job matching each active roadmap generation campaign 
  const getActiveJobForRoadmap = (roadmapItem: AtlasMindRoadmap) => {
    return jobs.find(j => j.target_query.includes(roadmapItem.title) && j.status === 'running');
  };

  const getCompletedJobForRoadmap = (roadmapItem: AtlasMindRoadmap) => {
    return jobs.find(j => j.target_query.includes(roadmapItem.title) && (j.status === 'completed' || j.status === 'failed'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setLocalError('Campaign title is required.');
      return;
    }
    setLocalError('');
    setSubmitting(true);
    try {
      await onAddRoadmap({
        title,
        description,
        type,
        priority,
        estimated_places: estimatedPlaces
      });
      setTitle('');
      setDescription('');
      setType('landmark');
      setPriority('medium');
      setEstimatedPlaces(3);
      setShowAddForm(false);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to register roadmap item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-[#0F1623] border border-slate-800 rounded-xl p-6">
        <div>
          <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">AtlasMind Roadmap Campaigns</h4>
          <p className="text-xs text-slate-400 mt-1">Manage campaign priorities and launch batch geodata pipelines</p>
        </div>
        <button
          id="btn-toggle-add-roadmap"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-[#080C14] font-bold text-xs uppercase tracking-wider font-mono rounded transition cursor-pointer"
        >
          {showAddForm ? 'Close Sandbox' : 'Create Campaign'}
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {localError && (
        <div className="bg-red-950/40 border-l-4 border-red-500 rounded p-4 text-red-200 text-xs font-mono flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block uppercase tracking-wider text-red-400">Campaign Creation Error:</span>
            <p className="leading-relaxed">{localError}</p>
          </div>
        </div>
      )}

      {/* Add Campaign collapsible panel */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0F1623] border border-slate-800 rounded-xl p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <h5 className="text-xs font-bold text-[#00C2FF] font-mono uppercase tracking-wider pb-2 border-b border-slate-800/60">Configure New Batch Campaign</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Campaign Title *</label>
                  <input
                    id="input-roadmap-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., European Castles & Châteaux"
                    className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Target Geodata Category</label>
                  <select
                    id="select-roadmap-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] outline-none transition appearance-none"
                  >
                    <option value="landmark">Landmark / Monument</option>
                    <option value="city">Major/Historic City</option>
                    <option value="country">Sovereign State</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Scope description & guidelines</label>
                  <input
                    id="input-roadmap-desc"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Focus on medieval fortifications across France, Germany, and Scotland."
                    className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Priority Tier</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        id={`btn-roadmap-priority-${p}`}
                        type="button"
                        onClick={() => setPriority(p as any)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono border transition cursor-pointer ${
                          priority === p 
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)] text-[var(--accent-color)]' 
                            : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                        style={{ '--accent-color': p === 'high' ? '#f43f5e' : p === 'medium' ? '#f59e0b' : '#10b981' } as React.CSSProperties}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Target Quantity to Generate</label>
                  <div className="flex items-center gap-3">
                    <input
                      id="input-roadmap-quantity"
                      type="number"
                      min={1}
                      max={8}
                      value={estimatedPlaces}
                      onChange={(e) => setEstimatedPlaces(Math.min(8, Math.max(1, Number(e.target.value))))}
                      className="w-24 bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 text-center focus:border-[#00C2FF] outline-none transition"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Maximum 8 sequential AI requests per batch</span>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800 mt-2">
                <button
                  id="btn-submit-roadmap"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-[#080C14] font-bold text-xs uppercase tracking-wider font-mono rounded transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register Campaign'}
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of roadmap items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roadmap.map((item) => {
          const activeJob = getActiveJobForRoadmap(item);
          const completedJob = getCompletedJobForRoadmap(item);
          const isGenerating = item.status === 'generating' || !!activeJob;

          return (
            <div 
              key={item.id} 
              id={`roadmap-card-${item.id}`}
              className="bg-[#0F1623] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] text-white font-mono uppercase px-2 py-1 bg-slate-800 rounded font-bold tracking-wider">
                    {item.type}
                  </span>
                  
                  {/* Priority Badge */}
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    item.priority === 'high' 
                      ? 'bg-rose-500/10 text-rose-400' 
                      : item.priority === 'medium'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {item.priority}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white font-mono mt-2 leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-400 min-h-12 mt-2 leading-relaxed line-clamp-3">
                  {item.description || 'Geographic catalog targeting batch updates.'}
                </p>

                {/* Scope estimates */}
                <div className="bg-[#080C14] rounded-lg p-3 border border-slate-800/80 my-4 text-[10px] uppercase tracking-wider font-mono space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Campaign Target:</span>
                    <span className="text-white font-bold">{item.estimated_places} items</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Current Status:</span>
                    <span className={`font-bold ${
                      item.status === 'completed' ? 'text-emerald-400' : isGenerating ? 'text-amber-400' : 'text-slate-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status details & Generation triggers */}
              <div>
                {isGenerating ? (
                  <div className="bg-amber-500/10 border-l-2 border-amber-500 p-2.5 text-xs font-mono text-amber-200 flex items-center justify-between mb-3 rounded-r">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="font-bold">Pipeline working...</span>
                    </div>
                    {activeJob && (
                      <span className="text-amber-400 font-bold">{activeJob.processed}/{item.estimated_places}</span>
                    )}
                  </div>
                ) : item.status === 'completed' ? (
                  <div className="bg-emerald-500/10 border-l-2 border-emerald-500 p-2.5 text-xs font-mono text-emerald-200 flex items-center gap-2 mb-3 rounded-r">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">Verified & generated into DB</span>
                  </div>
                ) : null}

                {completedJob && completedJob.status === 'failed' && (
                  <div className="bg-rose-500/10 border-l-2 border-rose-500 p-2.5 text-xs font-mono text-rose-300 mb-3 block truncate rounded-r" title={completedJob.error_message}>
                     <span className="font-bold">Failure:</span> {completedJob.error_message || 'Quota error'}
                  </div>
                )}

                <button
                  id={`btn-trigger-roadmap-${item.id}`}
                  disabled={isGenerating || loading}
                  onClick={() => onTriggerGenerate(item.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-[10px] uppercase tracking-wider font-mono font-bold transition cursor-pointer ${
                    isGenerating 
                      ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' 
                      : 'bg-transparent border border-[#00C2FF] text-[#00C2FF] hover:bg-[#00C2FF] hover:text-[#080C14]'
                  }`}
                >
                  {isGenerating ? 'Generating Pipeline...' : 'Run Pipeline'}
                  {!isGenerating && <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}

        {roadmap.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 bg-[#0F1623] border border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-slate-500 animate-pulse" />
            </div>
            <h5 className="text-white font-mono uppercase tracking-widest text-sm font-bold">No Active Campaigns</h5>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
              Assemble campaigns in the builder above, and run automated geodata generator workflows.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
