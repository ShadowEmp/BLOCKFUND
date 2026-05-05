import React, { useState } from 'react';
import { ArrowLeft, Lock, Unlock, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Staking = () => {
  const navigate = useNavigate();
  const [stakeAmount, setStakeAmount] = useState('');

  const mockChartData = Array.from({length: 30}).map((_, i) => ({
      day: `Day ${i + 1}`,
      apy: 12.5 + Math.sin(i/2) + (Math.random() * 0.5)
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 relative animate-fade-in">
      <button onClick={() => navigate('/dashboard')} className="flex items-center text-textMuted hover:text-primary mb-8 transition-colors gap-2 font-mono text-sm">
        <ArrowLeft size={16} /> RETURN TO DASHBOARD
      </button>

      <div className="flex justify-between items-end mb-12 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Node Staking</h1>
          <p className="text-slate-400 font-mono text-sm tracking-wide">SECURE THE NETWORK & EARN PROTOCOL FEES</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-400 mb-2 font-mono text-xs"><TrendingUp size={14}/> CURRENT APY</div>
          <div className="text-3xl font-bold text-green-400">12.8%</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-400 mb-2 font-mono text-xs"><Lock size={14}/> TOTAL VALUE LOCKED</div>
          <div className="text-3xl font-bold">14.2M <span className="text-slate-500 text-lg">MATIC</span></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-400 mb-2 font-mono text-xs"><Zap size={14}/> PROTOCOL REVENUE</div>
          <div className="text-3xl font-bold text-primary">$84,290 <span className="text-slate-500 text-lg">/ mo</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="text-primary"/> Lock MATIC Tokens</h3>
          
          <div className="mb-6">
            <label className="block text-xs font-mono text-slate-500 mb-2">AMOUNT TO STAKE</label>
            <div className="relative">
              <input 
                type="number" 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <span className="absolute right-4 top-3.5 text-slate-500 font-mono text-sm">MATIC</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-mono text-slate-500 mb-2">LOCK PERIOD</label>
            <div className="grid grid-cols-3 gap-3">
              <button className="bg-slate-800 border border-slate-700 py-2 rounded text-sm text-slate-400 hover:border-slate-500 transition-colors">30 Days</button>
              <button className="bg-primary/20 border border-primary text-primary py-2 rounded text-sm transition-colors font-bold shadow-[0_0_15px_rgba(59,130,246,0.15)]">90 Days</button>
              <button className="bg-slate-800 border border-slate-700 py-2 rounded text-sm text-slate-400 hover:border-slate-500 transition-colors">1 Year</button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 font-mono text-xs space-y-2">
            <div className="flex justify-between text-slate-400"><span>Estimated Return:</span><span className="text-green-400">+1.4% (90d)</span></div>
            <div className="flex justify-between text-slate-400"><span>Voting Power:</span><span className="text-primary">+14 veMATIC</span></div>
          </div>

          <button className="w-full bg-slate-800 text-slate-500 py-4 rounded-xl font-bold cursor-not-allowed">CONNECT WALLET TO STAKE</button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><TrendingUp className="text-green-400"/> APY Volatility Index</h3>
          <div className="flex-grow min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                    <defs>
                        <linearGradient id="colorApy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}} itemStyle={{color: '#22c55e'}} />
                    <Area type="monotone" dataKey="apy" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorApy)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staking;
