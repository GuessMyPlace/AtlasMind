import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { InfoBox } from '../components/ui/InfoBox';
import { Settings as SettingsIcon, Server, Database, Activity, Code, ExternalLink } from 'lucide-react';
import client from '../api/client';
import { useAppStore } from '../stores/appStore';

export const Settings: React.FC = () => {
  const { quota } = useAppStore();
  
  const [health, setHealth] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const start = Date.now();
        const hRes = await client.get('/health');
        if (mounted) {
          setHealth(hRes.data);
          setPing(Date.now() - start);
        }
        
        const sRes = await client.get('/stats');
        if (mounted) setStats(sRes.data);

      } catch (err) {
        console.error("Failed to load settings data", err);
      }
    };
    fetchSettings();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-end mb-8 border-b border-atlasmind-border pb-4">
        <div>
          <h2 className="text-3xl font-bold font-mono uppercase tracking-wider text-white">System Settings</h2>
          <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest">Configuration & Platform Status</p>
        </div>
      </div>

      {/* Backend Status */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Server className="w-4 h-4 text-atlasmind-cyan" />
             Backend Status
           </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
             <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Status</div>
             <div className="font-mono font-bold text-slate-200 flex items-center gap-2">
               {health ? (
                 <><span className="w-2 h-2 rounded-full bg-atlasmind-green"></span> Live</>
               ) : (
                 <><span className="w-2 h-2 rounded-full bg-slate-600"></span> Unknown</>
               )}
             </div>
          </div>
          <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
             <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Version</div>
             <div className="font-mono font-bold text-slate-200">{health?.version || '---'}</div>
          </div>
          <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
             <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">API URL</div>
             <div className="font-mono font-bold text-slate-200 truncate" title={(import.meta as any).env.VITE_API_BASE_URL || window.location.origin}>
               {(import.meta as any).env.VITE_API_BASE_URL || 'Local'}
             </div>
          </div>
          <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
             <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Response Time</div>
             <div className="font-mono font-bold text-slate-200">{ping !== null ? `${ping}ms` : '---'}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quota Configuration */}
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Activity className="w-4 h-4 text-atlasmind-amber" />
               Quota Configuration
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg mb-4">
               <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Current Daily Limit</div>
               <div className="font-mono font-bold text-2xl text-slate-200">
                 {quota?.requests_limit != null ? quota.requests_limit.toLocaleString() : '---'}
               </div>
            </div>
            <InfoBox variant="info" title="Configuration Managed Centrally">
              Change GEMINI_DAILY_LIMIT in backend environment to update quotas.
            </InfoBox>
          </CardContent>
        </Card>

        {/* Database Connection */}
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Database className="w-4 h-4 text-atlasmind-cyan" />
               Supabase Connection
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg space-y-4">
               <div>
                 <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Status</div>
                 <div className="font-mono font-bold text-slate-200 flex items-center gap-2">
                   {health?.db_connected ? (
                     <><span className="w-2 h-2 rounded-full bg-atlasmind-green"></span> Connected</>
                   ) : (
                     <><span className="w-2 h-2 rounded-full bg-atlasmind-red"></span> Error</>
                   )}
                 </div>
               </div>
               <div>
                 <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Target Database</div>
                 <div className="font-mono font-bold text-slate-200">GuessMyPlace shared DB</div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Statistics */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Activity className="w-4 h-4 text-atlasmind-cyan" />
             Data Statistics
           </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
               <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Total Places</div>
               <div className="font-mono font-bold text-2xl text-slate-200">{stats?.total_places || '0'}</div>
            </div>
            <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
               <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Total Questions</div>
               <div className="font-mono font-bold text-2xl text-slate-200">{stats?.total_questions || '0'}</div>
            </div>
            <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
               <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Unknown Queue Size</div>
               <div className="font-mono font-bold text-2xl text-slate-200">{stats?.queue_size || '0'}</div>
            </div>
          </div>
          
          <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg">
             <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-3">Places by Type Breakdown</div>
             {stats?.places_by_type ? (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {Object.entries(stats.places_by_type).map(([type, count]) => (
                   <div key={type} className="flex justify-between items-center bg-slate-800/30 px-3 py-2 rounded">
                     <span className="text-xs font-mono text-slate-400 capitalize">{type}</span>
                     <span className="text-sm font-mono text-white font-bold">{count as number}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-xs font-mono text-slate-500 italic">No type data available</div>
             )}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Code className="w-4 h-4 text-atlasmind-cyan" />
             About
           </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-4 bg-[#080C14] border border-slate-800 rounded-lg space-y-2">
            <div className="font-mono font-bold text-slate-200">AtlasMind Studio <span className="text-atlasmind-cyan text-xs ml-2">v{health?.version || '1.0.0'}</span></div>
            <div className="text-xs font-mono text-slate-400 leading-relaxed max-w-2xl">
              An offline-capable AI-powered generation tool built exclusively for creating rigorous, structured trivia data for GuessMyPlace.
            </div>
            <div className="pt-2">
              <a 
                href="https://guessmyplace.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono font-bold text-atlasmind-cyan hover:text-white transition-colors flex items-center gap-1 inline-flex"
              >
                GuessMyPlace Web App <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
};
