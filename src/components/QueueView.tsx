import React, { useState } from 'react';
import { UnknownPlacesQueue } from '../types.js';
import { Ticket, AlertCircle, Trash2, CheckCircle2, RefreshCw, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { isValid } from 'date-fns';

interface QueueViewProps {
  queue: UnknownPlacesQueue[];
  loading: boolean;
  onProcessQueue: (id: string, type: 'country' | 'city' | 'landmark') => Promise<void>;
  onIgnoreQueue: (id: string) => Promise<void>;
  onAddTicket: (name: string, context: string) => Promise<void>;
}

export default function QueueView({ queue, loading, onProcessQueue, onIgnoreQueue, onAddTicket }: QueueViewProps) {
  const [activeProcessingId, setActiveProcessingId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, 'landmark' | 'city' | 'country'>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newContext, setNewContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleProcess = async (id: string, name: string) => {
    setActiveProcessingId(id);
    const placeType = selectedTypes[id] || 'landmark';
    try {
      await onProcessQueue(id, placeType);
    } catch (e) {
      console.error(e);
    } finally {
      setActiveProcessingId(null);
    }
  };

  const handleTypeChange = (id: string, value: 'landmark' | 'city' | 'country') => {
    setSelectedTypes({
      ...selectedTypes,
      [id]: value
    });
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim()) {
      setFormError('Place name is required');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await onAddTicket(newPlaceName, newContext);
      setNewPlaceName('');
      setNewContext('');
      setShowAddForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create queue ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const activeTickets = queue.filter(q => q.status === 'queued');
  const finishedTickets = queue.filter(q => q.status !== 'queued');

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Top action header */}
      <div className="flex justify-between items-center bg-[#0F1623] border border-slate-800 rounded-xl p-6">
        <div>
          <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Unknown Places Tickets Queue</h4>
          <p className="text-xs text-slate-400 mt-1">Resolve game error logs or missing coordinate requests with adaptive AI</p>
        </div>
        <button
          id="btn-toggle-add-ticket"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-[#080C14] font-bold text-xs uppercase tracking-wider font-mono rounded transition cursor-pointer"
        >
          {showAddForm ? 'Hide Ticket Panel' : 'Report Missing Place'}
        </button>
      </div>

      {formError && (
        <div className="bg-red-950/40 border-l-4 border-red-500 rounded p-4 text-red-200 text-xs font-mono">
          {formError}
        </div>
      )}

      {/* Report Custom Ticket Panel */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F1623] border border-[#00C2FF]/30 rounded-xl p-6"
        >
          <form onSubmit={handleCreateTicket} className="space-y-5">
            <h5 className="text-xs font-bold text-[#00C2FF] font-mono uppercase tracking-wider pb-2 border-b border-slate-800/60">Manually Queue Place Request</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Target Name</label>
                <input
                  id="input-ticket-name"
                  type="text"
                  required
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  placeholder="e.g., Mount Everest or Berlin Wall"
                  className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-[#00C2FF] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Ticket Context / User Issue</label>
                <input
                  id="input-ticket-context"
                  type="text"
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  placeholder="e.g., Missing coordinate reported by player."
                  className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-[#00C2FF] outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-2">
              <button
                id="btn-submit-ticket"
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-[#080C14] font-bold text-xs uppercase tracking-wider font-mono rounded transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Adding...' : 'Add Ticket'}
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Active tickets */}
      <div className="bg-[#0F1623] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 bg-[#080C14]/50 border-b border-slate-800 flex justify-between items-center">
          <h5 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            Unresolved Submissions ({activeTickets.length})
          </h5>
          <span className="text-[10px] text-slate-500 font-mono">Real-time coordinates verification active</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {activeTickets.map((ticket) => {
            const isProcessingThis = activeProcessingId === ticket.id;
            const currentType = selectedTypes[ticket.id] || 'landmark';

            return (
              <div key={ticket.id} id={`ticket-row-${ticket.id}`} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-800/10 transition-colors">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white text-base font-bold">{ticket.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">#{ticket.id}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono bg-[#080C14] border border-slate-800/60 p-2.5 rounded">
                    {ticket.context}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Reported on {ticket.reported_at && isValid(new Date(ticket.reported_at)) ? new Date(ticket.reported_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>

                {/* Processing controls */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  
                  {/* Select adapt target type */}
                  <div className="flex items-center gap-1.5 bg-[#080C14] border border-slate-800 rounded px-3 py-2">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">Adapt:</span>
                    <select
                      id={`select-ticket-type-${ticket.id}`}
                      disabled={isProcessingThis}
                      value={currentType}
                      onChange={(e) => handleTypeChange(ticket.id, e.target.value as any)}
                      className="bg-transparent text-xs text-[#00C2FF] font-mono outline-none border-none cursor-pointer font-bold uppercase tracking-wider"
                    >
                      <option value="landmark">Landmark</option>
                      <option value="city">City</option>
                      <option value="country">Country</option>
                    </select>
                  </div>

                  {/* Silencer (Ignore) button */}
                  <button
                    id={`btn-ignore-ticket-${ticket.id}`}
                    disabled={isProcessingThis || loading}
                    onClick={() => onIgnoreQueue(ticket.id)}
                    className="p-2.5 border border-slate-800 hover:border-red-500 hover:text-red-400 text-slate-500 rounded transition cursor-pointer"
                    title="Ignore reported Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Execute generator resolution */}
                  <button
                    id={`btn-resolve-ticket-${ticket.id}`}
                    disabled={isProcessingThis || loading}
                    onClick={() => handleProcess(ticket.id, ticket.name)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      isProcessingThis
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-not-allowed'
                        : 'bg-transparent border-[#00C2FF] text-[#00C2FF] hover:bg-[#00C2FF] hover:text-[#080C14]'
                    }`}
                  >
                    {isProcessingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Enrich & Resolve</span>
                      </>
                    )}
                  </button>

                </div>
              </div>
            );
          })}

          {activeTickets.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-mono">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
              <p className="text-sm font-bold tracking-wider uppercase">All tickets resolved</p>
              <p className="text-xs mt-1">Clean desk. No pending queue items.</p>
            </div>
          )}
        </div>
      </div>

      {/* History resolved tickets */}
      <div className="bg-[#0F1623] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 bg-[#080C14]/50 border-b border-slate-800">
          <h5 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Processed Tickets Archive</h5>
        </div>
        <div className="divide-y divide-slate-800/60 text-xs text-slate-400">
          {finishedTickets.map((ticket) => (
            <div key={ticket.id} className="p-5 flex justify-between items-center hover:bg-slate-800/10">
              <div>
                <span className="font-mono text-slate-300 font-bold">{ticket.name}</span>
                <span className="text-[10px] text-slate-500 ml-2">({ticket.status})</span>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-mono border font-bold uppercase tracking-wider ${
                ticket.status === 'resolved' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
              }`}>
                {ticket.status}
              </span>
            </div>
          ))}
          {finishedTickets.length === 0 && (
            <div className="p-8 text-center text-slate-600 font-mono text-xs">
              No historical entries found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
