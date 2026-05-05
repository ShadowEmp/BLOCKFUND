import React from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Settings, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Governance = () => {
  const navigate = useNavigate();

  const proposals = [
    { id: '1', title: 'AIP-14: Adjust Platform Fee Structure', status: 'ACTIVE', yes: 74, no: 26, end: '2 Days' },
    { id: '2', title: 'AIP-15: Integrate Chainlink Price Feeds', status: 'PASSED', yes: 98, no: 2, end: 'Ended' },
    { id: '3', title: 'AIP-16: Subsidize Gas for Top 10 Creators', status: 'REJECTED', yes: 41, no: 59, end: 'Ended' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 relative animate-fade-in">
      <button onClick={() => navigate('/dashboard')} className="flex items-center text-textMuted hover:text-primary mb-8 transition-colors gap-2 font-mono text-sm">
        <ArrowLeft size={16} /> RETURN TO DASHBOARD
      </button>

      <div className="flex justify-between items-end mb-12 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">DAO Governance</h1>
          <p className="text-slate-400 font-mono text-sm tracking-wide">SHAPING THE FUTURE OF THE DECENTRALIZED PROTOCOL</p>
        </div>
        <div className="bg-primary/10 border border-primary/30 py-2 px-4 rounded-lg font-mono text-sm text-primary">
          <span className="font-bold">YOUR VOTING POWER:</span> 0.00 veMATIC
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {proposals.map((prop, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={prop.id} 
              className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{prop.title}</h3>
                <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${prop.status === 'ACTIVE' ? 'bg-primary/20 text-primary border border-primary/30' : prop.status === 'PASSED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {prop.status}
                </span>
              </div>
              
              <div className="w-full bg-slate-950 rounded-full h-2 mb-2 flex overflow-hidden border border-slate-800">
                <div className="bg-green-500 h-full" style={{ width: `${prop.yes}%` }}></div>
                <div className="bg-red-500 h-full" style={{ width: `${prop.no}%` }}></div>
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span className="text-green-500">{prop.yes}% YES</span>
                <span className="text-red-500">{prop.no}% NO</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h4 className="font-bold mb-4 border-b border-slate-800 pb-2 flex items-center gap-2"><Users size={16}/> Quorum Metrics</h4>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Staked</span>
                <span className="font-mono text-sm">1.2M MATIC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Active Voters</span>
                <span className="font-mono text-sm">4,892</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Quorum Reach</span>
                <span className="font-mono text-sm text-green-400">PASSED (28%)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl border-dashed">
            <div className="text-center py-6">
              <Settings size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm mb-4">You must have locked Staking tokens to generate a new proposal.</p>
              <button disabled className="bg-slate-800 text-slate-500 w-full py-2 rounded-lg font-mono text-xs cursor-not-allowed">NEW PROPOSAL (LOCKED)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Governance;
