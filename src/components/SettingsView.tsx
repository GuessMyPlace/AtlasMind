import React, { useState } from 'react';
import { QuotaConfig } from '../types.js';
import { Settings, Shield, AlertTriangle, Cpu, Save, Loader2, RefreshCcw, Hand, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  config: QuotaConfig;
  onSaveConfig: (config: QuotaConfig) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  loading: boolean;
}

export default function SettingsView({ config, onSaveConfig, onResetDatabase, loading }: SettingsViewProps) {
  const [maxDailyTokens, setMaxDailyTokens] = useState(config.maxDailyTokens);
  const [maxTokensPerMinute, setMaxTokensPerMinute] = useState(config.maxTokensPerMinute);
  const [simulateQuotaLimit, setSimulateQuotaLimit] = useState(config.simulateQuotaLimit);
  const [artificialErrorRate, setArtificialErrorRate] = useState(config.artificialErrorRate);
  const [monthlyBudgetUSD, setMonthlyBudgetUSD] = useState(config.monthlyBudgetUSD);
  const [saving, setSaving] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wiping, setWiping] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveConfig({
        maxDailyTokens: Number(maxDailyTokens),
        maxTokensPerMinute: Number(maxTokensPerMinute),
        simulateQuotaLimit,
        artificialErrorRate: Number(artificialErrorRate),
        monthlyBudgetUSD: Number(monthlyBudgetUSD)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (wipeConfirmText !== 'RESET') {
      alert('Please type RESET in the confirmation input block to proceed.');
      return;
    }
    
    setWiping(true);
    try {
      await onResetDatabase();
      setWipeConfirmText('');
      alert('Database successfully restored to original factory geodata seed coordinates.');
    } catch (err: any) {
      alert(`Wipe/Reset failed: ${err.message}`);
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Settings inputs panel */}
      <div className="lg:col-span-2 bg-[#0F1623] border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Cpu className="w-4.5 h-4.5 text-[#00C2FF]" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Quota Simulation & Budget parameters</h4>
          </div>

          {/* Simulate quota toggling */}
          <div className="flex items-center justify-between p-4 bg-[#080C14] rounded-lg border border-slate-800">
            <div className="space-y-1">
              <span className="text-sm text-white font-bold font-mono uppercase tracking-wider block">Enforce Mock API Quota Rate Limits</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Stress-test client progressive retry cycles during operations</span>
            </div>
            <input
              id="checkbox-simulate-quota"
              type="checkbox"
              disabled={loading}
              checked={simulateQuotaLimit}
              onChange={(e) => setSimulateQuotaLimit(e.target.checked)}
              className="w-5 h-5 accent-[#00C2FF] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5 tracking-widest">Simulated Max Tokens Threshold / Min</label>
              <input
                id="input-tokens-minute"
                type="number"
                disabled={!simulateQuotaLimit || loading}
                value={maxTokensPerMinute}
                onChange={(e) => setMaxTokensPerMinute(Number(e.target.value))}
                className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-[#00C2FF] outline-none disabled:opacity-40 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5 tracking-widest">Simulated Max Daily Tokens</label>
              <input
                id="input-tokens-daily"
                type="number"
                disabled={!simulateQuotaLimit || loading}
                value={maxDailyTokens}
                onChange={(e) => setMaxDailyTokens(Number(e.target.value))}
                className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-[#00C2FF] outline-none disabled:opacity-40 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5 tracking-widest">Artificial API Failure Rate (0% - 100%)</label>
              <div className="flex items-center gap-4 bg-[#080C14] border border-slate-800 rounded px-4 py-2">
                <input
                  id="range-failure-rate"
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.1}
                  disabled={!simulateQuotaLimit || loading}
                  value={artificialErrorRate}
                  onChange={(e) => setArtificialErrorRate(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer disabled:opacity-40 h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
                <span className="text-sm font-mono font-bold text-red-400 shrink-0 select-none">
                  {(artificialErrorRate * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1.5 tracking-widest">Monthly Simulation Alert Budget ($ USD)</label>
              <input
                id="input-monthly-budget"
                type="number"
                disabled={loading}
                value={monthlyBudgetUSD}
                onChange={(e) => setMonthlyBudgetUSD(Number(e.target.value))}
                className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-[#00C2FF] outline-none transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800 items-center gap-4 mt-2">
            {saveSuccess && (
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">Config synchronized!</span>
            )}
            <button
              id="btn-save-settings"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 disabled:opacity-50 text-[#080C14] font-bold text-xs uppercase tracking-wider font-mono rounded transition cursor-pointer"
            >
              {saving ? 'Synchronizing...' : 'Save Configuration'}
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* Database operations wipe panel */}
      <div className="bg-[#0F1623] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-red-500">
            <Shield className="w-4.5 h-4.5 shrink-0" />
            <h4 className="text-sm font-bold font-mono uppercase tracking-wider">Destructive Database Operations</h4>
          </div>

          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-mono leading-relaxed text-red-300">
            <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
            <p>
              Reinitializing the databases will wipe all custom generated places, connected question modules, campaigns histories, and reported player queues. It restores pristine geographic seed records.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold tracking-widest">Confirm by typing "RESET" below</label>
            <input
              id="input-reset-confirm"
              type="text"
              value={wipeConfirmText}
              onChange={(e) => setWipeConfirmText(e.target.value)}
              placeholder="Type RESET"
              className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-red-500 outline-none transition"
            />
          </div>
        </div>

        <button
          id="btn-wipe-database"
          disabled={wiping || wipeConfirmText !== 'RESET'}
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 mt-6 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 disabled:border-slate-800 disabled:bg-slate-800/50 text-red-400 disabled:text-slate-500 font-bold uppercase tracking-wider text-xs font-mono rounded transition cursor-pointer"
        >
          {wiping ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              <span>Wiping Data Stores...</span>
            </>
          ) : (
            <>
              <RefreshCcw className="w-4 h-4" />
              <span>Factory Reset db</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
