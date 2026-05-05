import React from 'react';
import { ArrowLeft, Activity, Server, Hash, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const navigate = useNavigate();

  const volumeData = Array.from({length: 14}).map((_, i) => ({
      day: `${i + 1}`,
      volume: Math.floor(Math.random() * 5000) + 1000
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative animate-fade-in">
      <button onClick={() => navigate('/dashboard')} className="flex items-center text-textMuted hover:text-primary mb-8 transition-colors gap-2 font-mono text-sm">
        <ArrowLeft size={16} /> RETURN TO DASHBOARD
      </button>

      <div className="flex justify-between items-end mb-12 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Ecosystem Analytics</h1>
          <p className="text-slate-400 font-mono text-sm tracking-wide">ON-CHAIN METRICS & PROTOCOL HEALTH</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 py-2 px-4 rounded-lg font-mono text-sm text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> NETWORK SYNCED
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-slate-500 font-mono text-xs mb-2 flex items-center gap-2"><Server size={14}/> CONTRACT UPTIME</div>
          <div className="text-2xl font-bold font-mono">100.00%</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-slate-500 font-mono text-xs mb-2 flex items-center gap-2"><Box size={14}/> INDEXED BLOCKS</div>
          <div className="text-2xl font-bold font-mono">14,921,803</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-slate-500 font-mono text-xs mb-2 flex items-center gap-2"><Hash size={14}/> ACTIVE SMART CONTRACTS</div>
          <div className="text-2xl font-bold font-mono text-primary">8</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-slate-500 font-mono text-xs mb-2 flex items-center gap-2"><Activity size={14}/> TVL (MATIC)</div>
          <div className="text-2xl font-bold font-mono">342,881</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h3 className="text-lg font-bold mb-6 font-mono border-b border-slate-800 pb-4">14-DAY LIQUIDITY VOLUME (MATIC)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}} />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h4 className="font-bold mb-4 border-b border-slate-800 pb-2">Recent Contract Calls</h4>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between p-2 hover:bg-slate-800 rounded transition-colors cursor-pointer">
                <span className="text-primary truncate w-24">0x4a9...12f</span>
                <span className="text-slate-400">contribute()</span>
                <span className="text-slate-500">12s ago</span>
              </div>
              <div className="flex justify-between p-2 hover:bg-slate-800 rounded transition-colors cursor-pointer">
                <span className="text-primary truncate w-24">0xb12...49c</span>
                <span className="text-slate-400">createCamp...</span>
                <span className="text-slate-500">4m ago</span>
              </div>
              <div className="flex justify-between p-2 hover:bg-slate-800 rounded transition-colors cursor-pointer">
                <span className="text-primary truncate w-24">0x99f...eaa</span>
                <span className="text-slate-400">contribute()</span>
                <span className="text-slate-500">18m ago</span>
              </div>
              <div className="flex justify-between p-2 hover:bg-slate-800 rounded transition-colors cursor-pointer">
                <span className="text-primary truncate w-24">0x4a9...12f</span>
                <span className="text-slate-400">contribute()</span>
                <span className="text-slate-500">22m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
