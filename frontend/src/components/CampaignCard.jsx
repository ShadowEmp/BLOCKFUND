import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOptimisticAmountForCampaign } from '../utils/contributionPersistence';

const ProgressBar = ({ current, goal }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="w-full bg-borderLight rounded-full h-3 mb-2 overflow-hidden shadow-inner flex">
      <div 
        className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-1000 ease-out" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const CampaignCard = ({ campaign }) => {
    const [optimisticBoost, setOptimisticBoost] = useState(0);
    const isChainOnly = campaign.local_only || (!campaign.created_at && campaign.contract_campaign_id);
    const detailsPath = isChainOnly
      ? `/campaign/${campaign.contract_campaign_id}?source=chain`
      : `/campaign/${campaign.id}`;

    useEffect(() => {
        const updateBoost = () => {
            const id = campaign.contract_campaign_id || campaign.id;
            setOptimisticBoost(getOptimisticAmountForCampaign(id));
        };
        updateBoost();
        window.addEventListener('pendingContributionsUpdated', updateBoost);
        return () => window.removeEventListener('pendingContributionsUpdated', updateBoost);
    }, [campaign.id, campaign.contract_campaign_id]);

    const displayAmount = parseFloat(campaign.amountRaised || 0) + optimisticBoost;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-surface/40 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/5 transition-all duration-300 shadow-2xl hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] group relative flex flex-col h-full ring-1 ring-white/5"
    >
      <div className="h-48 bg-slate-700 relative overflow-hidden">
        {campaign.ipfs_hash ? (
          <img 
            src={`https://gateway.pinata.cloud/ipfs/${campaign.ipfs_hash}`} 
            alt={campaign.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
            <span className="text-slate-500 font-bold text-2xl tracking-widest uppercase opacity-50">{campaign.title.substring(0, 2)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-heading font-bold mb-2 text-textMain line-clamp-1 group-hover:text-primary transition-colors">{campaign.title}</h3>
        <p className="text-textMuted text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
          {campaign.description}
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-textMain flex items-center gap-1">
              {displayAmount.toFixed(displayAmount < 1 ? 4 : 2)} MATIC
              {optimisticBoost > 0 && (
                <span className="text-[10px] text-primary animate-pulse font-mono">(Syncing...)</span>
              )}
            </span>
            <span className="text-textMuted">{campaign.goal} MATIC</span>
          </div>
          <ProgressBar current={displayAmount} goal={campaign.goal} />
          
          <div className="flex justify-between text-xs text-textMuted mt-3">
             <span className="flex items-center gap-1">
               <div className={`w-2 h-2 rounded-full ${new Date(campaign.deadline) > new Date() ? 'bg-secondary' : 'bg-red-500'}`}></div>
               {new Date(campaign.deadline) > new Date() ? 'Active' : 'Ended'}
             </span>
             <span>{Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)))} days left</span>
          </div>
        </div>
        
        <Link 
          to={detailsPath} 
          className="block w-full text-center bg-transparent border border-borderLight hover:border-primary text-textMain hover:text-primary py-2.5 rounded-lg transition-all"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
};

export default CampaignCard;
