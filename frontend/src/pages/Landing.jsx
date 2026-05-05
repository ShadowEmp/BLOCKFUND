import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CampaignCard from '../components/CampaignCard';
import api from '../services/api';
import { ArrowRight, Zap, Shield, Globe, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import heroGraphic from '../assets/hero_graphic.png';

import * as contractService from '../services/contractService';

const Landing = () => {
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
        setLoading(true);
        let campaigns = [];
        
        // 1. Try Backend
        try {
            const res = await api.get('/campaigns');
            campaigns = res.data.slice(0, 3);
            setRecentCampaigns(campaigns);
        } catch (err) {
            console.error("Landing: Backend fetch failed", err);
        }

        // 2. Try Blockchain Fallback if backend returned nothing or failed
        if (campaigns.length === 0) {
            try {
                const chainCount = await contractService.getOnChainCampaignCount();
                if (chainCount > 0) {
                    const start = Math.max(1, chainCount - 2);
                    const chainData = await contractService.getLatestCampaignsFromChain(start, chainCount);
                    setRecentCampaigns(chainData.reverse());
                }
            } catch (err) {
                console.error("Landing: Blockchain fallback failed", err);
            }
        }
        setLoading(false);
    };

    loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Asymmetrical Hero Section */}
      <section className="relative px-6 py-24 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPjwvc3ZnPg==')] opacity-50 z-0 mix-blend-screen pointer-events-none"></div>
        <div className="container mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-surface border border-white/10 text-primary text-sm font-bold font-mono mb-6 backdrop-blur-md shadow-lg shadow-primary/20">
              V2 PROTOCOL NOW LIVE
            </div>
            <h1 className="text-5xl lg:text-7xl font-heading font-black tracking-tighter mb-6 leading-[1.1]">
              Fund the Future on the <br className="hidden md:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-[#a855f7] to-secondary drop-shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                Blockchain.
              </span>
            </h1>
            <p className="text-lg text-textMuted mb-10 max-w-xl leading-relaxed text-balance">
              Decentralized crowdfunding powered by Polygon. Total transparency, zero middleman fees, and fully automated smart contract block payouts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to="/dashboard" className="bg-primary hover:bg-primaryHover text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 group ring-1 ring-white/20">
                Explore Core
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/create-campaign" className="bg-surface/50 backdrop-blur border border-white/10 hover:border-white/30 hover:bg-surface text-textMain px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center">
                Launch Protocol
              </Link>
            </div>
          </motion.div>

          {/* Right floating graphic area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative hidden lg:flex items-center justify-center"
          >
             <div className="w-full aspect-[4/3] bg-gradient-to-br from-surface/80 to-background/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                
                {/* Generated Background Image */}
                <div className="absolute inset-0 w-full h-full -z-0">
                  <img src={heroGraphic} alt="Hero Background" className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#0f1322]/80 to-transparent mix-blend-multiply border-b border-background"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full p-6">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap size={24} className="text-primary"/>
                  </div>
                  <div className="font-mono text-xs text-secondary text-right">
                    <span className="block animate-pulse">● NETWORK SYNCED</span>
                    <span>TVL: $4.2M</span>
                  </div>
                </div>

                <div className="space-y-4 w-full z-10">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-gradient-to-r from-primary to-secondary"></motion.div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.5, delay: 0.7 }} className="h-full bg-gradient-to-r from-secondary to-purple-500"></motion.div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1.5, delay: 0.9 }} className="h-full bg-gradient-to-r from-primary to-primaryHover"></motion.div>
                  </div>
                </div>
                
                {/* Abstract Glass shapes inside the hero card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/30 rounded-full blur-[80px] -z-10 mix-blend-screen pointer-events-none"></div>
                </div>
             </div>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative border-y border-white/5 bg-background">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Shield size={32} />, title: "Trustless Smart Contracts", desc: "Funds held in escrow. Automatic refunds on failure." },
            { icon: <Zap size={32} />, title: "Zero Gas Architecture", desc: "Polygon-powered. Maximum throughput, zero middleman." },
            { icon: <Globe size={32} />, title: "Global Sync", desc: "Contribute permissionlessly from any node worldwide." }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="flex flex-col items-start text-left p-8 rounded-3xl bg-surface/30 border border-white/5 backdrop-blur-md"
            >
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/30">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">{feat.title}</h3>
              <p className="text-textMuted text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Campaigns Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-2">Featured Campaigns</h2>
            <p className="text-textMuted">Discover the latest innovative projects</p>
          </div>
          <Link to="/dashboard" className="text-primary hover:text-primaryHover font-medium flex items-center gap-1 group">
            View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentCampaigns.length > 0 ? (
            recentCampaigns.map(camp => (
              <CampaignCard key={camp.id} campaign={camp} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-textMuted bg-surface rounded-xl border border-borderLight border-dashed">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-xs font-mono animate-pulse">SYNCING WITH POLYGON...</p>
                </div>
              ) : (
                "Loading campaigns or no campaigns available yet."
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
