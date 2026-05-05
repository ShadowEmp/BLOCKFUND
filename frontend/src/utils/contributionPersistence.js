/**
 * Utility to manage optimistic (unconfirmed) contributions in local storage.
 * This ensures that when a user contributes MATIC, the UI updates immediately
 * and persists that update across page navigation until the blockchain confirms the transaction.
 */

const STORAGE_KEY = 'pending_contributions';

/**
 * Adds a pending contribution to local storage.
 */
export const addPendingContribution = (campaignId, amount) => {
    const pending = getPendingContributions();
    const newEntry = {
        campaignId: Number(campaignId),
        amount: parseFloat(amount),
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

/**
 * Clears or updates pending contributions once a real update is received.
 * This is usually called after fetchData() successfully retrieves new on-chain data.
 */
export const reconcilePendingContributions = (campaignId, _onChainAmount) => {
    // For simplicity in this dev version, we just clear everything older than the current reconcile call
    // or we can just leave them to expire after 5 mins.
    // A better way: clear all pending items for this campaignId if onChainAmount has increased.
    const pending = getPendingContributions();
    const filtered = pending.filter(item => item.campaignId !== Number(campaignId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('pendingContributionsUpdated'));
};
