import { useState } from 'react';
import * as contractService from '../services/contractService';

const getReadableWalletError = (err) => {
    const message =
        err?.data?.message ||
        err?.error?.data?.message ||
        err?.error?.message ||
        err?.reason ||
        err?.message ||
        'Transaction failed';

    if (message.includes('Internal JSON-RPC error') && err?.data) {
        return JSON.stringify(err.data);
    }

    return message;
};

export const useContract = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const executeTransaction = async (action, ...args) => {
        setLoading(true);
        setError(null);
        try {
            // Network Guard: Ensure we are on the correct network from .env
            if (window.ethereum) {
                const targetChainId = import.meta.env.VITE_CHAIN_ID || '0x7a69';
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                
                if (chainId !== targetChainId) {
                    const networkName = import.meta.env.VITE_NETWORK_NAME || 'the correct network';
                    throw new Error(`Wrong Network Detected! Please switch MetaMask to ${networkName} (Chain ID: ${targetChainId}).`);
                }
            }

            const result = await contractService[action](...args);
            setLoading(false);
            return result;
        } catch (err) {
            const readableError = new Error(getReadableWalletError(err));
            readableError.code = err?.code;
            setError(readableError);
            setLoading(false);
            throw readableError;
        }
    };

    return {
        createCampaignOnChain: (...args) => executeTransaction('createCampaignOnChain', ...args),
        deployCrowdfundingContract: (...args) => executeTransaction('deployCrowdfundingContract', ...args),
        contributeToCampaign: (...args) => executeTransaction('contributeToCampaign', ...args),
        withdrawFunds: (...args) => executeTransaction('withdrawFunds', ...args),
        refundContribution: (...args) => executeTransaction('refundContribution', ...args),
        getCampaignDetails: (...args) => executeTransaction('getCampaignDetails', ...args),
        getCampaignContributionEvents: (...args) => executeTransaction('getCampaignContributionEvents', ...args),
        loading,
        error
    };
};
