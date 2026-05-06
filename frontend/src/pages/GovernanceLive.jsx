import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Vote, XCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';

const PROPOSALS_KEY = 'dao_live_proposals';
const VOTES_KEY = 'dao_live_votes';

const defaultProposals = [
  {
    id: 'genesis-fee',
    title: 'Set platform fee policy for future versions',
    description: 'Signal whether the protocol should add a small platform fee in a future contract release.',
    createdAt: new Date().toISOString(),
  },
];

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (_err) {
    return fallback;
  }
};

const GovernanceLive = () => {
  const { currentAccount } = useWallet();
  const { user } = useAuth();
  const [proposals, setProposals] = useState(() => readJson(PROPOSALS_KEY, defaultProposals));
  const [votes, setVotes] = useState(() => readJson(VOTES_KEY, {}));
  const [form, setForm] = useState({ title: '', description: '' });

  const voter = (currentAccount || user?.wallet_address || '').toLowerCase();
  const proposalRows = useMemo(() => proposals.map((proposal) => {
    const proposalVotes = votes[proposal.id] || {};
    const values = Object.values(proposalVotes);
    const yes = values.filter((vote) => vote === 'yes').length;
    const no = values.filter((vote) => vote === 'no').length;
    const total = yes + no;

    return {
      ...proposal,
      yes,
      no,
      total,
      yesPercent: total ? Math.round((yes / total) * 100) : 0,
      userVote: voter ? proposalVotes[voter] : null,
    };
  }), [proposals, votes, voter]);

  const persistProposals = (next) => {
    setProposals(next);
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(next));
  };

  const persistVotes = (next) => {
    setVotes(next);
    localStorage.setItem(VOTES_KEY, JSON.stringify(next));
  };

  const submitProposal = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    persistProposals([
      {
        id: `${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim() || 'No description provided.',
        createdAt: new Date().toISOString(),
      },
      ...proposals,
    ]);
    setForm({ title: '', description: '' });
  };

  const castVote = (proposalId, choice) => {
    if (!voter) return;
    persistVotes({
      ...votes,
      [proposalId]: {
        ...(votes[proposalId] || {}),
        [voter]: choice,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="border-b border-white/5 pb-8 mb-8">
        <h1 className="text-4xl font-extrabold mb-2">DAO Governance Workbench</h1>
        <p className="text-slate-400 font-mono text-sm">LOCAL SIGNAL VOTING :: DOES NOT MODIFY CAMPAIGN CONTRACTS</p>
      </div>

      <form onSubmit={submitProposal} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300"
          placeholder="Proposal title"
        />
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300"
          placeholder="Proposal description"
        />
        <button className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white rounded-lg px-5 py-3 font-bold">
          <Plus size={16} /> CREATE
        </button>
      </form>

      <div className="space-y-5">
        {proposalRows.map((proposal) => (
          <div key={proposal.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold mb-1">{proposal.title}</h2>
                <p className="text-slate-400 text-sm">{proposal.description}</p>
              </div>
              <div className="text-xs font-mono text-slate-500">{new Date(proposal.createdAt).toLocaleString()}</div>
            </div>
            <div className="h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-green-500" style={{ width: `${proposal.yesPercent}%` }} />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs font-mono text-slate-400 flex gap-4">
                <span className="text-green-400">{proposal.yes} YES</span>
                <span className="text-red-400">{proposal.no} NO</span>
                <span>{proposal.total} TOTAL</span>
                {proposal.userVote && <span className="text-primary">YOUR VOTE: {proposal.userVote.toUpperCase()}</span>}
              </div>
              <div className="flex gap-2">
                <button disabled={!voter} onClick={() => castVote(proposal.id, 'yes')} className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-bold">
                  <CheckCircle2 size={16} /> YES
                </button>
                <button disabled={!voter} onClick={() => castVote(proposal.id, 'no')} className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-bold">
                  <XCircle size={16} /> NO
                </button>
              </div>
            </div>
          </div>
        ))}
        {!voter && <div className="text-slate-500 font-mono text-sm flex items-center gap-2"><Vote size={16} /> Connect or log in with a wallet to vote.</div>}
      </div>
    </div>
  );
};

export default GovernanceLive;
