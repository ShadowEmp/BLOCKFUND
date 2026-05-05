import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Download, Loader2, RefreshCw, Search } from 'lucide-react';
import api from '../services/api';
import * as contractService from '../services/contractService';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';
import { useContract } from '../hooks/useContract';
import { getLocalCampaigns, saveLocalCampaign } from '../utils/campaignPersistence';

const mergeCampaigns = (...groups) => {
  const map = new Map();

  groups.flat().forEach((campaign) => {
    if (!campaign) return;
    const key = campaign.contract_campaign_id !== null && campaign.contract_campaign_id !== undefined
      ? `chain-${campaign.contract_campaign_id}`
      : `db-${campaign.id}`;
    map.set(key, { ...map.get(key), ...campaign });
  });

  return Array.from(map.values()).sort((a, b) => Number(b.contract_campaign_id || 0) - Number(a.contract_campaign_id || 0));
};

const normalizeChainCampaign = (campaign) => ({
  ...campaign,
  id: campaign.id,
  contract_campaign_id: campaign.contract_campaign_id || campaign.id,
  creator_wallet: campaign.creator_wallet || campaign.creator,
  deadline: typeof campaign.deadline === 'number'
    ? new Date(campaign.deadline * 1000).toISOString()
    : campaign.deadline,
  amountRaised: campaign.amountRaised || '0',
});

const toMatic = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMatic = (value) => toMatic(value).toLocaleString(undefined, {
  maximumFractionDigits: 6,
});

const MyIncome = () => {
  const { currentAccount } = useWallet();
  const { user } = useAuth();
  const { withdrawFunds } = useContract();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [error, setError] = useState('');
  const [importContractAddress, setImportContractAddress] = useState(contractService.getActiveContractAddress() || '');
  const [importCampaignId, setImportCampaignId] = useState('');

  const identityAddresses = useMemo(() => (
    [currentAccount, user?.wallet_address].filter(Boolean).map((address) => address.toLowerCase())
  ), [currentAccount, user?.wallet_address]);

  const loadCampaigns = async () => {
    setLoading(true);
    setError('');

    try {
      const localCampaigns = getLocalCampaigns();
      let backendCampaigns = [];
      let chainCampaigns = [];

      try {
        const res = await api.get('/campaigns');
        backendCampaigns = res.data;
      } catch (err) {
        console.warn('Income: backend campaigns unavailable', err);
      }

      try {
        const chainCount = await contractService.getOnChainCampaignCount();
        if (chainCount > 0) {
          chainCampaigns = (await contractService.getLatestCampaignsFromChain(1, chainCount)).map(normalizeChainCampaign);
        }
      } catch (err) {
        console.warn('Income: chain campaigns unavailable', err);
      }

      const merged = mergeCampaigns(localCampaigns, backendCampaigns, chainCampaigns);
      const hydrated = await Promise.all(merged.map(async (campaign) => {
        if (campaign.contract_campaign_id === null || campaign.contract_campaign_id === undefined) return campaign;
        try {
          const chainData = await contractService.getCampaignDetails(campaign.contract_campaign_id);
          return { ...campaign, ...normalizeChainCampaign(chainData) };
        } catch (_err) {
          return campaign;
        }
      }));

      setCampaigns(hydrated);
    } catch (err) {
      setError(err.message || 'Could not load income data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const myCampaigns = campaigns.filter((campaign) => {
    const creator = (campaign.creator_wallet || campaign.creator || '').toLowerCase();
    return campaign.imported_by_user || (creator && identityAddresses.includes(creator));
  });

  const rows = myCampaigns.map((campaign) => {
    const raised = toMatic(campaign.amountRaised);
    const goal = toMatic(campaign.goal);
    const deadlinePassed = new Date() > new Date(campaign.deadline);
    const goalMet = raised >= goal;
    const withdrawn = Boolean(campaign.withdrawn);
    const withdrawable = deadlinePassed && goalMet && !withdrawn;

    return {
      ...campaign,
      raised,
      goal,
      deadlinePassed,
      goalMet,
      withdrawn,
      withdrawable,
    };
  });

  const totalRaised = rows.reduce((sum, campaign) => sum + campaign.raised, 0);
  const withdrawableTotal = rows.reduce((sum, campaign) => sum + (campaign.withdrawable ? campaign.raised : 0), 0);
  const lockedTotal = rows.reduce((sum, campaign) => sum + (!campaign.withdrawn && !campaign.withdrawable ? campaign.raised : 0), 0);
  const withdrawnTotal = rows.reduce((sum, campaign) => sum + (campaign.withdrawn ? campaign.raised : 0), 0);

  const handleWithdraw = async (campaign) => {
    setWithdrawingId(campaign.contract_campaign_id);
    setError('');

    try {
      await withdrawFunds(campaign.contract_campaign_id);
      await loadCampaigns();
    } catch (err) {
      setError(err.message || 'Withdraw failed.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!importCampaignId) throw new Error('Campaign ID is required.');
      if (importContractAddress) contractService.saveActiveContractAddress(importContractAddress);

      const chainCampaign = normalizeChainCampaign(await contractService.getCampaignDetails(Number(importCampaignId)));
      const contractAddress = contractService.getActiveContractAddress();
      const importedCampaign = {
        ...chainCampaign,
        id: `income-import-${contractAddress || 'unknown'}-${chainCampaign.contract_campaign_id}`,
        contract_address: contractAddress,
        imported_by_user: true,
        local_only: true,
        created_at: new Date().toISOString(),
      };

      saveLocalCampaign(importedCampaign);
      setCampaigns((prev) => mergeCampaigns([importedCampaign], prev));
      setImportCampaignId('');
    } catch (err) {
      setError(err.message || 'Could not import campaign.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
            My Income
          </h1>
          <p className="text-slate-400 font-mono text-sm">CREATOR REVENUE :: POLYGON AMOY ESCROW</p>
        </div>
        <button
          type="button"
          onClick={loadCampaigns}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:border-primary text-slate-300 rounded-lg px-4 py-3 font-mono text-xs font-bold"
        >
          <RefreshCw size={16} /> REFRESH
        </button>
      </div>

      {error && <div className="mb-6 bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg p-4 font-mono text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Total Raised', totalRaised],
          ['Withdrawable', withdrawableTotal],
          ['Locked', lockedTotal],
          ['Withdrawn', withdrawnTotal],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs mb-3">
              <DollarSign size={14} /> {label}
            </div>
            <div className="text-2xl font-bold text-white">{formatMatic(value)} <span className="text-sm text-slate-500">MATIC</span></div>
          </div>
        ))}
      </div>

      <form onSubmit={handleImport} className="mb-8 grid grid-cols-1 lg:grid-cols-[1fr_160px_auto] gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <input
          type="text"
          value={importContractAddress}
          onChange={(e) => setImportContractAddress(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="Contract address"
        />
        <input
          type="number"
          min="1"
          value={importCampaignId}
          onChange={(e) => setImportCampaignId(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="Campaign ID"
        />
        <button type="submit" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white rounded-lg px-5 py-3 font-mono text-xs font-bold">
          <Search size={15} /> IMPORT
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center py-32"><Loader2 size={48} className="animate-spin text-primary" /></div>
      ) : rows.length > 0 ? (
        <div className="overflow-x-auto bg-slate-900/50 border border-slate-800 rounded-xl">
          <table className="w-full text-left">
            <thead className="text-xs font-mono text-slate-500 border-b border-slate-800">
              <tr>
                <th className="p-4">Project</th>
                <th className="p-4">Raised</th>
                <th className="p-4">Goal</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((campaign) => (
                <tr key={campaign.id} className="border-b border-slate-800/60 last:border-b-0">
                  <td className="p-4">
                    <div className="font-bold text-white">{campaign.title}</div>
                    <div className="text-xs font-mono text-slate-500">ID #{campaign.contract_campaign_id}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-300">{formatMatic(campaign.raised)} MATIC</td>
                  <td className="p-4 font-mono text-slate-300">{formatMatic(campaign.goal)} MATIC</td>
                  <td className="p-4 text-sm text-slate-400">{new Date(campaign.deadline).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded border ${
                      campaign.withdrawn
                        ? 'text-slate-400 border-slate-700 bg-slate-800/50'
                        : campaign.withdrawable
                          ? 'text-green-400 border-green-500/30 bg-green-500/10'
                          : 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'
                    }`}>
                      {campaign.withdrawn ? 'WITHDRAWN' : campaign.withdrawable ? 'READY' : campaign.deadlinePassed ? 'GOAL NOT MET' : 'LOCKED'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      disabled={!campaign.withdrawable || withdrawingId === campaign.contract_campaign_id}
                      onClick={() => handleWithdraw(campaign)}
                      className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondaryHover disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg px-4 py-2 font-mono text-xs font-bold"
                    >
                      {withdrawingId === campaign.contract_campaign_id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      WITHDRAW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl">
          <h3 className="text-lg font-bold text-slate-500 mb-2 font-mono">NO INCOME FOUND</h3>
          <p className="text-slate-600 text-sm">Create or import a campaign to see revenue here.</p>
        </div>
      )}
    </div>
  );
};

export default MyIncome;
