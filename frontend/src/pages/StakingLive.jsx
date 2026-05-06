import React, { useMemo, useState } from 'react';
import { Lock, Plus, Unlock } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';

const STAKES_KEY = 'node_staking_positions';

const readStakes = () => {
  try {
    return JSON.parse(localStorage.getItem(STAKES_KEY) || '[]');
  } catch (_err) {
    return [];
  }
};

const StakingLive = () => {
  const { currentAccount } = useWallet();
  const { user } = useAuth();
  const [stakes, setStakes] = useState(readStakes);
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState(90);

  const owner = (currentAccount || user?.wallet_address || '').toLowerCase();
  const myStakes = stakes.filter((stake) => stake.owner === owner);
  const totalStaked = myStakes.reduce((sum, stake) => sum + Number(stake.amount || 0), 0);
  const votingPower = myStakes.reduce((sum, stake) => sum + Number(stake.amount || 0) * (Number(stake.days) / 30), 0);

  const protocolStats = useMemo(() => ({
    totalPositions: stakes.length,
    totalLocked: stakes.reduce((sum, stake) => sum + Number(stake.amount || 0), 0),
  }), [stakes]);

  const persist = (next) => {
    setStakes(next);
    localStorage.setItem(STAKES_KEY, JSON.stringify(next));
  };

  const addStake = (e) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!owner || !parsed || parsed <= 0) return;

    persist([
      {
        id: `${Date.now()}`,
        owner,
        amount: parsed,
        days,
        createdAt: new Date().toISOString(),
        unlockAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      },
      ...stakes,
    ]);
    setAmount('');
  };

  const removeStake = (id) => persist(stakes.filter((stake) => stake.id !== id));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="border-b border-white/5 pb-8 mb-8">
        <h1 className="text-4xl font-extrabold mb-2">Node Staking Workbench</h1>
        <p className="text-slate-400 font-mono text-sm">LOCAL STAKING SIMULATION :: NO FUNDS ARE TRANSFERRED</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          ['My Staked', totalStaked, 'MATIC'],
          ['Voting Power', votingPower, 'veMATIC'],
          ['Protocol Locked', protocolStats.totalLocked, 'MATIC'],
          ['Positions', protocolStats.totalPositions, ''],
        ].map(([label, value, suffix]) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-slate-500 font-mono text-xs mb-2">{label}</div>
            <div className="text-2xl font-bold">{Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm text-slate-500">{suffix}</span></div>
          </div>
        ))}
      </div>

      <form onSubmit={addStake} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8 grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.0001" className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300" placeholder="Amount to simulate stake" />
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300">
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
        <button disabled={!owner} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover disabled:opacity-40 text-white rounded-lg px-5 py-3 font-bold">
          <Plus size={16} /> ADD POSITION
        </button>
      </form>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 font-bold flex items-center gap-2"><Lock size={16} /> My Positions</div>
        {myStakes.length ? myStakes.map((stake) => (
          <div key={stake.id} className="p-4 border-b border-slate-800 last:border-b-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-bold">{stake.amount} MATIC</div>
              <div className="text-xs font-mono text-slate-500">Unlocks {new Date(stake.unlockAt).toLocaleString()}</div>
            </div>
            <button onClick={() => removeStake(stake.id)} className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-400 rounded-lg px-4 py-2 font-mono text-xs">
              <Unlock size={14} /> REMOVE
            </button>
          </div>
        )) : (
          <div className="p-10 text-center text-slate-500 font-mono text-sm">{owner ? 'No simulated stake positions yet.' : 'Connect or log in with a wallet to create positions.'}</div>
        )}
      </div>
    </div>
  );
};

export default StakingLive;
