import api from '../services/api';
import * as contractService from '../services/contractService';
import { getLocalCampaigns } from './campaignPersistence';

export const mergeCampaigns = (...groups) => {
  const map = new Map();

  groups.flat().forEach((campaign) => {
    if (!campaign) return;
    const activeContractAddress = contractService.getActiveContractAddress();
    const contractAddress = campaign.contract_address || (campaign.source === 'chain' ? activeContractAddress : null);
    const hasChainId = campaign.contract_campaign_id !== null && campaign.contract_campaign_id !== undefined;
    const key = hasChainId && contractAddress
      ? `contract-${contractAddress.toLowerCase()}-${campaign.contract_campaign_id}`
      : `db-${campaign.id}`;
    map.set(key, { ...map.get(key), ...campaign });
  });

  return Array.from(map.values()).sort((a, b) => Number(b.contract_campaign_id || 0) - Number(a.contract_campaign_id || 0));
};

export const normalizeChainCampaign = (campaign) => ({
  ...campaign,
  id: campaign.id,
  contract_campaign_id: campaign.contract_campaign_id || campaign.id,
  contract_address: campaign.contract_address || contractService.getActiveContractAddress(),
  creator_wallet: campaign.creator_wallet || campaign.creator,
  deadline: typeof campaign.deadline === 'number' ? new Date(campaign.deadline * 1000).toISOString() : campaign.deadline,
  amountRaised: campaign.amountRaised || '0',
  source: campaign.source || 'chain',
});

export const normalizeBackendCampaign = (campaign) => ({
  ...campaign,
  amountRaised: campaign.amountRaised || '0',
  source: campaign.source || 'backend',
});

export const normalizeLocalCampaign = (campaign) => ({
  ...campaign,
  amountRaised: campaign.amountRaised || '0',
  source: campaign.source || 'local',
});

export const toMatic = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const loadProtocolCampaigns = async () => {
  const localCampaigns = getLocalCampaigns().map(normalizeLocalCampaign);
  let backendCampaigns = [];
  let chainCampaigns = [];

  try {
    const res = await api.get('/campaigns', {
      params: { _: Date.now() },
      headers: { 'Cache-Control': 'no-cache' },
    });
    backendCampaigns = res.data.map(normalizeBackendCampaign);
  } catch (err) {
    console.warn('Protocol data: backend campaigns unavailable', err);
  }

  try {
    const chainCount = await contractService.getOnChainCampaignCount();
    if (chainCount > 0) {
      chainCampaigns = (await contractService.getLatestCampaignsFromChain(1, chainCount)).map(normalizeChainCampaign);
    }
  } catch (err) {
    console.warn('Protocol data: chain campaigns unavailable', err);
  }

  return mergeCampaigns(localCampaigns, backendCampaigns, chainCampaigns);
};
