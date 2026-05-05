const STORAGE_KEY = 'created_campaigns';

const getStoredCampaigns = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_err) {
        return [];
    }
};

export const getLocalCampaigns = () => getStoredCampaigns();

export const saveLocalCampaign = (campaign) => {
    const campaigns = getStoredCampaigns();
    const key = `${campaign.contract_address || 'unknown'}:${campaign.contract_campaign_id}`;
    const next = [
        {
            ...campaign,
            id: campaign.id || `local-${key}`,
            local_only: true,
            created_at: campaign.created_at || new Date().toISOString(),
        },
        ...campaigns.filter((item) => `${item.contract_address || 'unknown'}:${item.contract_campaign_id}` !== key),
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 50)));
    window.dispatchEvent(new Event('localCampaignsUpdated'));
};

export const removeLocalCampaign = (contractCampaignId, contractAddress) => {
    const campaigns = getStoredCampaigns();
    const next = campaigns.filter((item) => (
        Number(item.contract_campaign_id) !== Number(contractCampaignId) ||
        (contractAddress && item.contract_address !== contractAddress)
    ));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('localCampaignsUpdated'));
};
