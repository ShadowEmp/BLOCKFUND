/**
 * Utility to manage optimistic (unconfirmed) contributions in local storage.
 * This ensures that when a user contributes MATIC, the UI updates immediately
 * and persists that update across page navigation until the blockchain confirms the transaction.
 */

const STORAGE_KEY = 'pending_contributions';

/**
 * Adds a pending contribution to local storage.
 */
export const addPendingContribution = (campaignId, amount, confirmedAmount = 0) => {
    const pending = getPendingContributions();
    const parsedAmount = parseFloat(amount);
    const newEntry = {
        campaignId: Number(campaignId),
        amount: parsedAmount,
        expectedOnChainAmount: Number(confirmedAmount || 0) + parsedAmount,
        timestamp: Date.now()
    };
    pending.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    
    // Dispatch a custom event to notify other components (like Dashboard)
    window.dispatchEvent(new Event('pendingContributionsUpdated'));
    return newEntry;
};

/**
 * Retrieves all pending contributions from local storage.
 */
export const getPendingContributions = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return parsed;
    } catch (_err) {
        return [];
    }
};

/**
 * Calculates the total optimistic amount for a specific campaign.
 */
export const getOptimisticAmountForCampaign = (campaignId) => {
    const pending = getPendingContributions();
    return pending
        .filter(item => item.campaignId === Number(campaignId))
        .reduce((sum, item) => sum + item.amount, 0);
};

export const getPendingContributionsForCampaign = (campaignId) => (
    getPendingContributions().filter(item => item.campaignId === Number(campaignId))
);

/**
 * Clears or updates pending contributions once a real update is received.
 * This is usually called after fetchData() successfully retrieves new on-chain data.
 */
export const reconcilePendingContributions = (campaignId, onChainAmount) => {
    const campaignKey = Number(campaignId);
    const pending = getPendingContributions();
    const campaignPending = pending.filter(item => item.campaignId === campaignKey);
    const chainTotal = Number(onChainAmount || 0);
    const expectedTotal = campaignPending.reduce((max, item) => (
        Math.max(max, Number(item.expectedOnChainAmount || item.amount || 0))
    ), 0);

    if (!campaignPending.length) return;

    // Keep pending amounts visible while the RPC endpoint is still returning stale state.
    if (chainTotal + Number.EPSILON < expectedTotal) {
        window.dispatchEvent(new Event('pendingContributionsUpdated'));
        return;
    }

    const filtered = pending.filter(item => item.campaignId !== campaignKey);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('pendingContributionsUpdated'));
};
