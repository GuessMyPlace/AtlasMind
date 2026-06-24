import React, { useState } from 'react';
import { Place, Question } from '../types.js';
import { Sparkles, Loader2, AlertCircle, Play, ChevronRight, CheckCircle2, FileJson, Copy, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManualGeneratorProps {
  onGenerateManual: (item: { name: string; type: 'country' | 'city' | 'landmark'; difficulty: 'easy' | 'medium' | 'hard'; instruction: string }) => Promise<{ success: boolean; place: Place; questions: Question[] }>;
  loading: boolean;
}

export default function ManualGenerator({ onGenerateManual, loading }: ManualGeneratorProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'country' | 'city' | 'landmark'>('landmark');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [instruction, setInstruction] = useState('');
  const [generatedResult, setGeneratedResult] = useState<{ place: Place; questions: Question[] } | null>(null);
  const [localError, setLocalError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError('Please specify a target name to query.');
      return;
    }
    setLocalError('');
    setGeneratedResult(null);

    try {
      const result = await onGenerateManual({
        name,
        type,
        difficulty,
        instruction
      });
      if (result && result.success) {
        setGeneratedResult({
          place: result.place,
          questions: result.questions
        });
        setName('');
        setInstruction('');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Generation failed. Check Gemini API key configuration.');
    }
  };

  const copyToClipboard = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(JSON.stringify(generatedResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Sandbox controller form */}
      <div className="lg:col-span-2 bg-[#0F1623] border border-slate-800 rounded-xl p-6 h-fit">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Sparkles className="w-4 h-4 text-[#00C2FF]" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Manual Geodata Sandbox</h4>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Target Name Query *</label>
            <input
              id="manual-input-name"
              type="text"
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Colosseum or Sydney Opera House"
              className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-[#00C2FF] outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Geodata Category</label>
              <select
                id="manual-select-type"
                disabled={loading}
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-bold uppercase tracking-wider font-mono focus:border-[#00C2FF] outline-none transition cursor-pointer"
              >
                <option value="landmark">Landmark</option>
                <option value="city">City</option>
                <option value="country">Country</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Target Difficulty</label>
              <select
                id="manual-select-difficulty"
                disabled={loading}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-[#080C14] border border-[#00C2FF]/30 rounded px-3 py-2 text-sm text-[#00C2FF] font-bold uppercase tracking-wider font-mono focus:border-[#00C2FF] outline-none transition cursor-pointer"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5">Special Administrator Directives</label>
            <textarea
              id="manual-input-directives"
              rows={4}
              disabled={loading}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Include specific historical dates for the construct in clue #3. Avoid modern coordinates confusion with nearby landmarks."
              className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-[#00C2FF] outline-none resize-none leading-relaxed transition"
            />
          </div>

          <button
            id="btn-execute-manual-generate"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 disabled:opacity-50 text-[#080C14] font-bold text-xs uppercase tracking-wider font-mono rounded transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                <span>Generating Geodata...</span>
              </>
            ) : (
              <>
                <span>Generate Place details</span>
                <Play className="w-3.5 h-3.5 text-[#080C14]" />
              </>
            )}
          </button>
        </form>

        {localError && (
          <div className="bg-red-950/40 border-l-4 border-red-500 rounded p-4 text-red-200 text-xs font-mono mt-5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider">Error:</span>
              <p className="leading-relaxed">{localError}</p>
            </div>
          </div>
        )}
      </div>

      {/* JSON Payload viewer panel */}
      <div className="lg:col-span-3 flex flex-col justify-between bg-[#0F1623] border border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
        
        {/* Header toolbar */}
        <div className="p-5 bg-[#080C14]/50 border-b border-slate-800 flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400 font-bold flex items-center gap-2 uppercase tracking-wider">
            <FileJson className="w-4.5 h-4.5 text-emerald-400" />
            Veredicted JSON Structured Geodata payload
          </span>
          {generatedResult && (
            <button
              id="btn-copy-json"
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 rounded border border-slate-700 font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Schema'}</span>
            </button>
          )}
        </div>

        {/* Outer content container */}
        <div className="flex-1 p-6 h-full overflow-y-auto max-h-[500px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-5 py-16"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#00C2FF]/10 blur-2xl animate-pulse" />
                  <Loader2 className="w-12 h-12 text-[#00C2FF] animate-spin relative" />
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <p className="text-white font-bold tracking-widest uppercase">Contacting Gemini 2.5 Pro Model</p>
                  <p className="text-slate-400">Verifying geographical coordinates...</p>
                  <p className="text-slate-500 text-[11px] uppercase tracking-widest">Compiling incremental progressive clues and trivia questions...</p>
                </div>
              </motion.div>
            ) : generatedResult ? (
              <motion.div
                key="result-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-5 text-sm font-mono text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wider">Structure successfully synchronized!</span>
                    <span className="text-emerald-400/80 text-xs mt-1 block">Place and trivia questions successfully stored in Supabase database tables:</span>
                  </div>
                </div>

                <pre className="bg-[#080C14] border border-slate-800 rounded-lg p-5 text-xs font-mono leading-relaxed text-[#00C2FF] overflow-x-auto shadow-inner">
                  {JSON.stringify(generatedResult, null, 2)}
                </pre>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center text-slate-500 font-mono py-16"
              >
                <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mb-5">
                  <Database className="w-10 h-10 text-slate-600" />
                </div>
                <span className="font-bold text-sm tracking-wider uppercase text-white">Awaiting Sandbox Queries</span>
                <p className="text-[11px] text-slate-400 max-w-sm mt-2 leading-relaxed">
                  Specify parameter targets, trigger active generation, and monitor structured payload formatting outputs live.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
