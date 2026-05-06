import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';
import { Loader2, AlertCircle, ArrowLeft, Activity, Users, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingTerminal from '../components/LoadingTerminal';
import {
    addPendingContribution,
    getOptimisticAmountForCampaign,
    getPendingContributionsForCampaign,
    reconcilePendingContributions
} from '../utils/contributionPersistence';

const CampaignDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentAccount } = useWallet();
    const { getCampaignDetails, getCampaignContributionEvents, contributeToCampaign, withdrawFunds, refundContribution } = useContract();
    
    const [dbCampaign, setDbCampaign] = useState(null);
    const [onChainData, setOnChainData] = useState(null);
    const [contributionEvents, setContributionEvents] = useState([]);
    const [optimisticBoost, setOptimisticBoost] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [contributionAmount, setContributionAmount] = useState('');
    const [error, setError] = useState('');

    // Terminal State
    const [showTerminal, setShowTerminal] = useState(false);
    const [terminalStep, setTerminalStep] = useState(0);
    const [terminalComplete, setTerminalComplete] = useState(false);

    const terminalStepsConfig = [
        { name: "Initiate MATIC Transfer", detail: "Payload parsed as BigNumber.", activeText: "Converting to Wei..." },
        { name: "Web3 Signature", detail: "Metamask securely signed payload.", activeText: "Awaiting gas estimation and signature..." },
        { name: "Contract Execution", detail: "payable contribute() invoked successfully.", activeText: "Updating blockchain state mappings..." }
    ];

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    useEffect(() => { 
        fetchData();
        // Listener for optimistic updates from other components
        const handleOptimisticUpdate = () => {
            if (id) setOptimisticBoost(getOptimisticAmountForCampaign(id));
        };
        window.addEventListener('pendingContributionsUpdated', handleOptimisticUpdate);
        return () => window.removeEventListener('pendingContributionsUpdated', handleOptimisticUpdate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, searchParams]);

    const normalizeChainCampaign = (chainData) => ({
        id: `chain-${chainData.id}`,
        contract_campaign_id: chainData.id,
        creator_wallet: chainData.creator_wallet,
        title: chainData.title,
        description: chainData.description,
        goal: chainData.goal,
        deadline: new Date(chainData.deadline * 1000).toISOString(),
        amountRaised: chainData.amountRaised,
        ipfs_hash: chainData.ipfs_hash,
    });

    const refreshContributionEvents = async (campaignId) => {
        try {
            const events = await getCampaignContributionEvents(Number(campaignId));
            setContributionEvents(events);
        } catch (err) {
            console.warn('Unable to load contribution events for chart.', err);
            setContributionEvents([]);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (searchParams.get('source') === 'chain') {
                const chainData = await getCampaignDetails(Number(id));
                setDbCampaign(normalizeChainCampaign(chainData));
                setOnChainData(chainData);
                reconcilePendingContributions(chainData.id, chainData.amountRaised);
                setOptimisticBoost(getOptimisticAmountForCampaign(chainData.id));
                await refreshContributionEvents(chainData.id);
            } else {
                const res = await api.get(`/campaigns/${id}`);
                setDbCampaign(res.data);
                if (res.data.contract_campaign_id !== null && res.data.contract_campaign_id !== undefined) {
                    const chainData = await getCampaignDetails(res.data.contract_campaign_id);
                    setOnChainData(chainData);
                    reconcilePendingContributions(res.data.contract_campaign_id, chainData.amountRaised);
                    setOptimisticBoost(getOptimisticAmountForCampaign(res.data.contract_campaign_id));
                    await refreshContributionEvents(res.data.contract_campaign_id);
                } else {
                    setContributionEvents([]);
                }
            }
            setLoading(false);
        } catch (err) {
            if (searchParams.get('source') !== 'chain' && Number.isInteger(Number(id))) {
                try {
                    const chainData = await getCampaignDetails(Number(id));
                    setDbCampaign(normalizeChainCampaign(chainData));
                    setOnChainData(chainData);
                    reconcilePendingContributions(chainData.id, chainData.amountRaised);
                    setOptimisticBoost(getOptimisticAmountForCampaign(chainData.id));
                    await refreshContributionEvents(chainData.id);
                    setLoading(false);
                    return;
                } catch (chainErr) {
                    console.error(chainErr);
                }
            }
            console.error(err);
            setError("Failed to locate target block data.");
            setLoading(false);
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        setError('');

        setShowTerminal(true);
        setTerminalStep(0);
        setTerminalComplete(false);

        try {
            await delay(800); setTerminalStep(1);
            await contributeToCampaign(dbCampaign.contract_campaign_id, contributionAmount);
            addPendingContribution(dbCampaign.contract_campaign_id, contributionAmount, amountRaised);
            setOptimisticBoost(getOptimisticAmountForCampaign(dbCampaign.contract_campaign_id));
            setTerminalStep(2);
            await delay(1000); // Simulate confirming block length
            setTerminalStep(3);
            setTerminalComplete(true);
            await delay(2000);
            
            setShowTerminal(false);
            setContributionAmount('');
            fetchData();
        } catch (err) {
            setError(err.message || 'Transaction rejected or reverted.');
            setShowTerminal(false);
        }
    };

    const handleWithdraw = async () => {
        setActionLoading(true);
        setError('');
        try {
            await withdrawFunds(dbCampaign.contract_campaign_id);
            await fetchData();
        } catch (err) {
            setError(err.message || 'Withdraw failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRefund = async () => {
        setActionLoading(true);
        setError('');
        try {
            await refundContribution(dbCampaign.contract_campaign_id);
            await fetchData();
        } catch (err) {
            setError(err.message || 'Refund failed.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center py-32"><Loader2 size={48} className="animate-spin text-primary" /></div>;
    if (!dbCampaign) return <div className="text-center py-32 text-xl text-textMuted font-mono">ERROR 404: Payload Null</div>;

    const goal = parseFloat(dbCampaign.goal);
    const amountRaised = (onChainData ? parseFloat(onChainData.amountRaised) : 0) + optimisticBoost;
    const percentage = Math.min((amountRaised / goal) * 100, 100);
    const amountPrecision = amountRaised > 0 && amountRaised < 0.001 ? 6 : 4;
    const displayedAmountRaised = Number(amountRaised.toFixed(amountPrecision)).toString();
    const displayedPercentage = percentage > 0 && percentage < 0.1 ? percentage.toFixed(4) : percentage.toFixed(1);
    const isCreator = currentAccount && currentAccount.toLowerCase() === dbCampaign.creator_wallet.toLowerCase();
    const deadlinePassed = new Date() > new Date(dbCampaign.deadline);
    const goalMet = amountRaised >= goal;
    const campaignChainId = dbCampaign.contract_campaign_id ?? onChainData?.id ?? id;
    const pendingChartEvents = getPendingContributionsForCampaign(campaignChainId).map(item => ({
        campaignId: Number(campaignChainId),
        contributor: currentAccount || 'Pending wallet',
        amount: Number(item.amount || 0),
        timestamp: Math.floor(item.timestamp / 1000),
        transactionHash: 'pending',
    }));
    const allChartEvents = [...contributionEvents, ...pendingChartEvents]
        .filter(event => Number(event.amount) > 0)
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const firstEventTimestamp = allChartEvents[0]?.timestamp || Math.floor(Date.now() / 1000);
    const chartByDay = allChartEvents.reduce((acc, event) => {
        const dayNumber = Math.max(1, Math.floor(((event.timestamp || firstEventTimestamp) - firstEventTimestamp) / 86400) + 1);
        const label = `Day ${dayNumber}`;
        const previous = acc.get(label) || 0;
        acc.set(label, previous + Number(event.amount || 0));
        return acc;
    }, new Map());
    let cumulativeRaised = 0;
    const chartData = [{ day: 'Start', raised: 0 }];
    chartByDay.forEach((dailyAmount, day) => {
        cumulativeRaised += dailyAmount;
        chartData.push({ day, raised: cumulativeRaised });
    });
    if (chartData.length === 1) {
        chartData.push({ day: 'Day 1', raised: amountRaised });
    }
    const chartFinalRaised = chartData[chartData.length - 1]?.raised || 0;
    if (amountRaised > chartFinalRaised) {
        chartData.push({ day: chartData.length === 1 ? 'Day 1' : 'Current', raised: amountRaised });
    }
    const uniqueWallets = new Set(allChartEvents.map(event => event.contributor?.toLowerCase?.() || event.contributor)).size;

    return (
        <div className="container mx-auto px-6 py-8 max-w-6xl relative">
            {showTerminal && <LoadingTerminal steps={terminalStepsConfig} currentStep={terminalStep} isComplete={terminalComplete} title="Contribution Node Execution" />}

            <button onClick={() => navigate(-1)} className="flex items-center text-textMuted hover:text-primary mb-6 transition-colors gap-2 font-mono text-sm">
                <ArrowLeft size={16} /> RETURN TO DASHBOARD
            </button>

            {/* Network Analytics Banner */}
            <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 mb-8 flex justify-between items-center text-xs font-mono text-slate-400 overflow-x-auto shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> NETWORK: ALIVE</span>
                <span>CHAIN_ID: <span className="text-secondary">80002 (AMOY)</span></span>
                <span>BLOCK HEIGHT: <span className="text-primary">{Math.floor(Math.random() * 1000) + 12000000}</span></span>
                <span>ESCROW_STATE: <span className="text-yellow-400">{deadlinePassed ? 'FROZEN' : 'ACTIVE'}</span></span>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3 font-mono text-sm"><AlertCircle size={20} className="mt-0.5" /> <span>{error}</span></div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 relative">
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-xs font-mono border border-slate-700/50 flex flex-col z-10 text-slate-300 shadow-xl">
                            <span className="text-[10px] text-slate-500 mb-0.5">IPFS_ANCHOR</span>
                            {dbCampaign.ipfs_hash ? dbCampaign.ipfs_hash.substring(0, 16) + '...' : '0xNULL'}
                        </div>
                        {dbCampaign.ipfs_hash ? (
                            <img src={`https://gateway.pinata.cloud/ipfs/${dbCampaign.ipfs_hash}`} alt={dbCampaign.title} className="w-full h-[400px] object-cover opacity-80" />
                        ) : (
                            <div className="w-full h-[300px] flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                <span className="text-slate-600 font-bold text-4xl uppercase tracking-widest">{dbCampaign.title.substring(0, 3)}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    </div>
                    
                    <div>
                        <h1 className="text-4xl font-bold mb-4">{dbCampaign.title}</h1>
                        <p className="text-slate-400 leading-relaxed font-serif text-lg tracking-wide whitespace-pre-wrap">{dbCampaign.description}</p>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="font-mono text-sm text-slate-400 mb-6 flex items-center gap-2"><Activity size={16}/> LIQUIDITY TRAJECTORY</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRaised" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => Number(v).toFixed(4)} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                                    <Area type="monotone" dataKey="raised" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRaised)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-8 sticky top-24 shadow-2xl">
                        <div className="mb-2 font-mono text-xs text-secondary tracking-widest border border-secondary/20 bg-secondary/10 inline-block px-2 py-1 rounded">LIVE ON-CHAIN</div>
                        <div className="mb-6 mt-4">
                            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-300">
                                {displayedAmountRaised}
                                {optimisticBoost > 0 && (
                                    <span className="text-sm text-primary animate-pulse font-mono ml-2">(Syncing...)</span>
                                )}
                            </span>
                            <span className="text-slate-400 font-mono ml-2">MATIC</span>
                        </div>
                        
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3">
                            <div className="bg-primary h-1.5 rounded-full shadow-[0_0_10px_#3b82f6]" style={{ width: `${percentage}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between text-xs font-mono text-slate-400 mb-8 pb-6 border-b border-slate-800">
                            <span>{displayedPercentage}% / 100%</span>
                            <span>GOAL: {goal}</span>
                        </div>

                        <div className="flex flex-col gap-4 mb-8">
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <Users size={18} className="text-slate-500" />
                                <span><span className="font-bold text-white tracking-widest font-mono">{uniqueWallets}</span> Unique Wallets</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <Clock size={18} className="text-slate-500" />
                                <span><span className="font-bold text-white tracking-widest font-mono">{Math.max(0, Math.ceil((new Date(dbCampaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)))}</span> Days Remaining</span>
                            </div>
                        </div>

                        {!deadlinePassed ? (
                            <form onSubmit={handleContribute} className="space-y-4">
                                <div className="relative">
                                    <input type="number" step="0.0001" min="0.0001" required className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-primary font-mono text-lg transition-colors pr-20" placeholder="0.00" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} />
                                    <span className="absolute right-5 top-5 text-slate-500 font-bold text-sm tracking-widest">MATIC</span>
                                </div>
                                <button type="submit" disabled={!currentAccount} className="w-full relative group overflow-hidden bg-primary hover:bg-primaryHover disabled:opacity-50 text-white py-4 rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                                    <span className="relative z-10 tracking-widest text-sm">{currentAccount ? 'TRANSMIT MATIC' : 'AUTH WALLET REQUIRED'}</span>
                                </button>
                            </form>
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg text-center">
                                <h3 className="font-mono text-xs text-yellow-400 mb-2 font-bold tracking-widest">CONTRACT LOCKED</h3>
                                {isCreator && goalMet && !onChainData?.withdrawn && (
                                    <button onClick={handleWithdraw} disabled={actionLoading} className="w-full bg-secondary hover:bg-secondaryHover disabled:opacity-50 text-white py-3 rounded text-xs font-mono font-bold">WITHDRAW POOL</button>
                                )}
                                {!goalMet && (
                                    <button onClick={handleRefund} disabled={actionLoading} className="w-full border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 py-3 rounded text-xs font-mono font-bold">INITIATE REFUND</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetail;
