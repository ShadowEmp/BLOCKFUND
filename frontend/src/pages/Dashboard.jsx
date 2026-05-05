import React, { useEffect, useState } from 'react';
import CampaignCard from '../components/CampaignCard';
import api from '../services/api';
import { Search, Loader2, Activity, Globe, Database, Cpu, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import * as contractService from '../services/contractService';
import { getLocalCampaigns } from '../utils/campaignPersistence';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';
import { saveLocalCampaign } from '../utils/campaignPersistence';

const mergeCampaigns = (...groups) => {
  const map = new Map();

  groups.flat().forEach((campaign) => {
    if (!campaign) return;
    const key = campaign.contract_campaign_id !== null && campaign.contract_campaign_id !== undefined
      ? `chain-${campaign.contract_campaign_id}`
      : `db-${campaign.id}`;
    const existing = map.get(key);
    map.set(key, { ...existing, ...campaign });
  });

  return Array.from(map.values()).sort((a, b) => {
    const aId = Number(a.contract_campaign_id || 0);
    const bId = Number(b.contract_campaign_id || 0);
    if (aId !== bId) return bId - aId;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentAccount } = useWallet();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setSyncStatus] = useState("idle"); // idle, syncing, complete
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [importCampaignId, setImportCampaignId] = useState("");
  const [importContractAddress, setImportContractAddress] = useState(contractService.getActiveContractAddress() || "");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [feedEvents, setFeedEvents] = useState([]);

  useEffect(() => {
    const fetchEverything = async () => {
        setLoading(true);
        let backendData = [];
        let localData = getLocalCampaigns();
        setCampaigns(mergeCampaigns(localData));
        
        // 1. Fetch from Backend (Fast)
        try {
            const res = await api.get('/campaigns');
            backendData = res.data;
            setCampaigns(mergeCampaigns(localData, backendData));
        } catch (err) {
            console.error("Dashboard: Backend fetch failed, falling back to blockchain-only mode", err);
        }

        // 2. Cross-reference with Blockchain
        try {
            setSyncStatus("syncing");
            const chainCount = await contractService.getOnChainCampaignCount();
            
            if (chainCount > 0) {
                const fallbackData = await contractService.getLatestCampaignsFromChain(1, chainCount);
                
                setCampaigns(prev => {
                   return mergeCampaigns(prev, fallbackData);
                });
            }
            setSyncStatus("complete");
        } catch (err) {
            console.error("Dashboard: Blockchain sync failed", err);
            setSyncStatus("idle");
        } finally {
            setLoading(false);
        }
    };

    fetchEverything();

    const handleLocalCampaignsUpdated = () => {
      setCampaigns(prev => mergeCampaigns(getLocalCampaigns(), prev));
    };
    window.addEventListener('localCampaignsUpdated', handleLocalCampaignsUpdated);

    // Simulate Live Global Network Activity
    const interval = setInterval(() => {
      const actions = ["minted 3.5 MATIC onto", "executed payload on", "indexed block data for", "signed transaction hash regarding"];
      const projects = ["Quantum Randomness Oracle", "Orbital Storage Protocol", "Neon Horizon - Game Engine", "Alpha Finance Pool", "Cybernetics NFT"];
      const event = {
        id: Date.now(),
        wallet: "0x" + Math.floor(Math.random()*16777215).toString(16) + "...",
        action: actions[Math.floor(Math.random() * actions.length)],
        project: projects[Math.floor(Math.random() * projects.length)],
        time: new Date().toLocaleTimeString([], { hour12: false })
      };
      setFeedEvents(prev => [event, ...prev].slice(0, 8)); // keep last 8
    }, 4500);

    return () => {
      window.removeEventListener('localCampaignsUpdated', handleLocalCampaignsUpdated);
      clearInterval(interval);
    };
  }, []);

  const handleImportCampaign = async (e) => {
    e.preventDefault();
    setImportError("");
    setImporting(true);

    try {
      if (!importCampaignId) throw new Error("Campaign ID is required.");
      if (importContractAddress) {
        contractService.saveActiveContractAddress(importContractAddress);
      }

      const chainCampaign = await contractService.getCampaignDetails(Number(importCampaignId));
      const contractAddress = contractService.getActiveContractAddress();
      const localCampaign = {
        ...chainCampaign,
        id: `imported-${contractAddress || 'unknown'}-${chainCampaign.id}`,
        contract_campaign_id: chainCampaign.id,
        contract_address: contractAddress,
        creator_wallet: chainCampaign.creator_wallet,
        ipfs_hash: chainCampaign.ipfs_hash,
        deadline: new Date(chainCampaign.deadline * 1000).toISOString(),
        local_only: true,
        imported_by_user: true,
        created_at: new Date().toISOString(),
      };

      saveLocalCampaign(localCampaign);
      setCampaigns(prev => mergeCampaigns([localCampaign], prev));
      setViewMode("mine");
      setImportCampaignId("");
    } catch (err) {
      setImportError(err.message || "Could not import campaign.");
    } finally {
      setImporting(false);
    }
  };

  const identityAddresses = [currentAccount, user?.wallet_address]
    .filter(Boolean)
    .map((address) => address.toLowerCase());
  const myCampaigns = campaigns.filter(c => {
    const creator = (c.creator_wallet || c.creator || '').toLowerCase();
    return c.imported_by_user || (creator && identityAddresses.includes(creator));
  });
  const visibleCampaigns = viewMode === 'mine' ? myCampaigns : campaigns;
  const filteredCampaigns = visibleCampaigns.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-transparent border-t border-white/5">
      
      {/* Complex DAO Sidebar */}
      <aside className="hidden xl:flex w-64 bg-surface/20 backdrop-blur-2xl border-r border-white/5 p-6 flex-col">
        <div className="flex items-center gap-3 mb-8 text-slate-300">
          <Database size={20} className="text-primary"/>
          <span className="font-mono text-sm tracking-widest font-bold text-white">DAO SYSTEM</span>
        </div>
        
        <nav className="space-y-4 flex-grow">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-sm text-primary font-mono tracking-wider w-full bg-primary/10 rounded-xl p-3 border-l-2 border-primary transition-all shadow-inner">
            <Globe size={16} /> CORE LIQUIDITY
          </button>
          <button onClick={() => navigate('/governance')} className="flex items-center justify-between gap-3 text-sm text-slate-500 font-mono tracking-wider w-full hover:bg-surface rounded-xl p-3 transition-all group border border-transparent hover:border-white/5">
            <div className="flex items-center gap-3"><Command size={16} /> GOVERNANCE</div>
            <span className="opacity-1 text-[10px] text-[#a855f7] border border-[#a855f7]/30 bg-[#a855f7]/10 px-1 py-0.5 rounded transition-opacity">V2</span>
          </button>
          <button onClick={() => navigate('/staking')} className="flex items-center justify-between gap-3 text-sm text-slate-500 font-mono tracking-wider w-full hover:bg-surface rounded-xl p-3 transition-all group border border-transparent hover:border-white/5">
            <div className="flex items-center gap-3"><Cpu size={16} /> STAKING NODES</div>
            <span className="text-[10px] text-slate-600 border border-slate-700 bg-surface/50 px-1 py-0.5 rounded">LOCK</span>
          </button>
          <button onClick={() => navigate('/analytics')} className="flex items-center gap-3 text-sm text-slate-500 font-mono tracking-wider w-full hover:bg-surface rounded-xl p-3 transition-all border border-transparent hover:border-white/5">
            <Activity size={16} /> ANALYTICS SYNC
          </button>
        </nav>

        <div className="pt-6 border-t border-white/5">
          <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
            SYSTEM_UPTIME: 99.98%<br/>
            BASE_FEE: 1.2 GWEI<br/>
            EVM_VERSION: SHANGHAI<br/>
            LOCAL_PING: 14MS
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 lg:p-12 relative overflow-hidden">
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPjwvc3ZnPg==')] opacity-50 point-events-none z-0 mix-blend-screen"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col xl:flex-row gap-12">
            
            {/* Left Side: Campaigns list */}
            <div className="flex-1">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-white/5 pb-8"
              >
                <div>
                  <h1 className="text-4xl font-heading font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {viewMode === 'mine' ? 'My Created Projects' : 'Active Smart Contracts'}
                  </h1>
                  <p className="text-slate-400 font-mono text-sm tracking-wide">
                    {viewMode === 'mine'
                      ? `WALLET FILTER :: ${myCampaigns.length} PROJECTS CREATED`
                      : `INDEXING POLYGON AMOY STATE :: ${campaigns.length} PROTOCOLS FOUND`}
                  </p>
                </div>
                
                <div className="w-full md:w-auto flex flex-col gap-3">
                  <div className="flex rounded-lg border border-slate-700/50 bg-slate-900/50 p-1 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('all')}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${viewMode === 'all' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      ALL PROJECTS
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('mine')}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${viewMode === 'mine' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      MY PROJECTS
                    </button>
                  </div>
                  <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by TxHash, Title..."
                      className="w-full bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-lg py-3 pl-11 pr-4 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm transition-all shadow-inner"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>

              {loading ? (
                <div className="flex justify-center items-center py-32"><Loader2 size={48} className="animate-spin text-primary" /></div>
              ) : filteredCampaigns.length > 0 ? (
                <>
                  {viewMode === 'mine' && (
                    <form onSubmit={handleImportCampaign} className="mb-6 grid grid-cols-1 lg:grid-cols-[1fr_160px_auto] gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
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
                      <button type="submit" disabled={importing} className="bg-primary hover:bg-primaryHover disabled:opacity-50 text-white rounded-lg px-5 py-3 font-mono text-xs font-bold">
                        IMPORT
                      </button>
                      {importError && <div className="lg:col-span-3 text-red-400 text-sm font-mono">{importError}</div>}
                    </form>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[minmax(380px,auto)]">
                    {filteredCampaigns.map((camp, idx) => (
                      <div key={camp.id} className={`h-full transition-all ${idx % 5 === 0 ? 'md:col-span-2 xl:col-span-2' : 'col-span-1'}`}>
                        <CampaignCard campaign={camp} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {viewMode === 'mine' && (
                    <form onSubmit={handleImportCampaign} className="mb-6 grid grid-cols-1 lg:grid-cols-[1fr_160px_auto] gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
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
                      <button type="submit" disabled={importing} className="bg-primary hover:bg-primaryHover disabled:opacity-50 text-white rounded-lg px-5 py-3 font-mono text-xs font-bold">
                        IMPORT
                      </button>
                      {importError && <div className="lg:col-span-3 text-red-400 text-sm font-mono">{importError}</div>}
                    </form>
                  )}
                  <div className="text-center py-20 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 border-dashed">
                    <h3 className="text-lg font-bold text-slate-500 mb-2 font-mono">
                      {viewMode === 'mine' ? 'NO CREATED PROJECTS FOUND' : 'NULL SET RETURNED'}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {viewMode === 'mine'
                        ? (identityAddresses.length ? 'No indexed campaign currently matches your wallet. Import by contract address and campaign ID if the sync missed it.' : 'Connect or log in with the wallet you used to create projects.')
                        : 'No contract configurations matched the input vector.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Right Side: Live Global Feed */}
            <div className="hidden xl:block w-80 shrink-0">
              <div className="bg-surface/30 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl sticky top-28 ring-1 ring-white/5">
                <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-300 tracking-wider">LIVE MEMPOOL FEED</span>
                </div>
                
                <div className="p-4 space-y-4 max-h-[600px] overflow-hidden">
                  <AnimatePresence>
                    {feedEvents.map((ev) => (
                      <motion.div 
                        key={ev.id}
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        className="bg-background/40 border border-white/5 p-3 rounded-xl text-xs font-mono backdrop-blur"
                      >
                        <div className="flex justify-between items-center text-slate-500 mb-1">
                          <span>{ev.time}</span>
                          <Activity size={10} className="text-primary" />
                        </div>
                        <p className="leading-relaxed text-slate-400">
                          <span className="text-primary font-bold">{ev.wallet}</span> {ev.action} <span className="text-white bg-white/10 px-1 rounded">{ev.project}</span>
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {feedEvents.length === 0 && (
                    <div className="text-center text-slate-600 py-10 font-mono text-xs animate-pulse">Awaiting cross-chain sync...</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
