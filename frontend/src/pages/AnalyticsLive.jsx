import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Box, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts';
import { loadProtocolCampaigns, toMatic } from '../utils/protocolData';

const AnalyticsLive = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [error, setError] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const refreshCampaigns = async ({ initial = false } = {}) => {
    if (initial) setLoading(true);
    setRefreshing(true);
    setError('');

    try {
      const nextCampaigns = await loadProtocolCampaigns();
      setCampaigns(nextCampaigns);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Failed to refresh analytics data', err);
      setError(err.message || 'Failed to refresh analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshCampaigns({ initial: true });

    const handleRefreshSignal = () => refreshCampaigns();
    const handleFocus = () => refreshCampaigns();
    const intervalId = window.setInterval(() => refreshCampaigns(), 15000);

    window.addEventListener('localCampaignsUpdated', handleRefreshSignal);
    window.addEventListener('pendingContributionsUpdated', handleRefreshSignal);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('localCampaignsUpdated', handleRefreshSignal);
      window.removeEventListener('pendingContributionsUpdated', handleRefreshSignal);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const sourceOf = (campaign) => campaign.source || (campaign.local_only ? 'local' : 'backend');
    const sourceCounts = campaigns.reduce((counts, campaign) => {
      const source = sourceOf(campaign);
      counts[source] = (counts[source] || 0) + 1;
      return counts;
    }, {});

    const visibleCampaigns = sourceFilter === 'all'
      ? campaigns
      : campaigns.filter((campaign) => sourceOf(campaign) === sourceFilter);
    const totalRaised = visibleCampaigns.reduce((sum, campaign) => sum + toMatic(campaign.amountRaised), 0);
    const active = visibleCampaigns.filter((campaign) => new Date(campaign.deadline) > now).length;
    const successful = visibleCampaigns.filter((campaign) => toMatic(campaign.amountRaised) >= toMatic(campaign.goal)).length;
    const creators = new Set(visibleCampaigns.map((campaign) => (campaign.creator_wallet || campaign.creator || '').toLowerCase()).filter(Boolean)).size;
    const chart = [...visibleCampaigns]
      .sort((a, b) => Number(a.contract_campaign_id || 0) - Number(b.contract_campaign_id || 0))
      .map((campaign) => ({
      name: `#${campaign.contract_campaign_id || campaign.id}`,
      source: sourceOf(campaign),
      raised: toMatic(campaign.amountRaised),
      goal: toMatic(campaign.goal),
      title: campaign.title,
    }));
    const chartWidth = Math.max(720, chart.length * 64);

    return { totalRaised, active, successful, creators, sourceCounts, visibleCampaigns, chart, chartWidth };
  }, [campaigns, sourceFilter]);

  if (loading) return <div className="flex justify-center items-center py-32"><Loader2 size={48} className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="border-b border-white/5 pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Ecosystem Analytics Live</h1>
            <p className="text-slate-400 font-mono text-sm">BACKEND + LOCAL CACHE + ACTIVE CONTRACT DATA</p>
            {lastSyncedAt && (
              <p className="text-slate-500 font-mono text-xs mt-2">LAST SYNC {lastSyncedAt.toLocaleTimeString()}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => refreshCampaigns()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 border border-slate-700 rounded-lg px-4 py-3 text-sm font-bold"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            REFRESH
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 font-mono text-sm">{error}</div>}

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          ['all', `All (${campaigns.length})`],
          ['chain', `Contract (${stats.sourceCounts.chain || 0})`],
          ['backend', `Backend (${stats.sourceCounts.backend || 0})`],
          ['local', `Local (${stats.sourceCounts.local || 0})`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSourceFilter(value)}
            className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
              sourceFilter === value
                ? 'border-primary bg-primary text-white'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Campaigns', stats.visibleCampaigns.length, <Box key="i" size={14} />],
          ['Total Raised', `${stats.totalRaised.toLocaleString(undefined, { maximumFractionDigits: 4 })} MATIC`, <Activity key="i" size={14} />],
          ['Active', stats.active, <Clock key="i" size={14} />],
          ['Successful', stats.successful, <CheckCircle2 key="i" size={14} />],
        ].map(([label, value, icon]) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-slate-500 font-mono text-xs mb-2 flex items-center gap-2">{icon}{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="font-bold mb-2">Raised MATIC by Campaign</h2>
          <p className="text-slate-500 text-sm mb-5">All selected campaigns are shown. Use the filter above to isolate active contract data from backend/demo data.</p>
          <div className="overflow-x-auto pb-2">
            <BarChart width={stats.chartWidth} height={320} data={stats.chart} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} interval={0} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => Number(value).toFixed(4)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(value, name) => [`${Number(value).toFixed(6)} MATIC`, name]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${label} - ${item.title} (${item.source})` : label;
                  }}
                />
                <Bar dataKey="raised" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="font-bold mb-5">Protocol Health</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Unique creators</span><span className="font-mono">{stats.creators}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Success rate</span><span className="font-mono">{campaigns.length ? Math.round((stats.successful / campaigns.length) * 100) : 0}%</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Avg raised</span><span className="font-mono">{campaigns.length ? (stats.totalRaised / campaigns.length).toFixed(4) : '0'} MATIC</span></div>
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex justify-between"><span className="text-slate-400">From contract</span><span className="font-mono">{stats.sourceCounts.chain || 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">From backend</span><span className="font-mono">{stats.sourceCounts.backend || 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Local fallback</span><span className="font-mono">{stats.sourceCounts.local || 0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsLive;
