import { ethers } from 'ethers';
import CrowdfundingArtifact from '../contracts/Crowdfunding.json';

const CONTRACT_ADDRESS_STORAGE_KEY = 'crowdfunding_contract_address';
const CONFIGURED_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS?.trim();

class ContractNotDeployedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ContractNotDeployedError';
        this.code = 'CONTRACT_NOT_DEPLOYED';
    }
}

const getStoredContractAddress = () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(CONTRACT_ADDRESS_STORAGE_KEY)?.trim() || null;
};

export const getActiveContractAddress = () => {
    const storedAddress = getStoredContractAddress();
    if (storedAddress && ethers.utils.isAddress(storedAddress)) return storedAddress;
    return CONFIGURED_CONTRACT_ADDRESS || null;
};

export const saveActiveContractAddress = (address) => {
    if (typeof window !== 'undefined' && ethers.utils.isAddress(address)) {
        window.localStorage.setItem(CONTRACT_ADDRESS_STORAGE_KEY, address);
    }
};

const toNumber = (value) => value?.toNumber ? value.toNumber() : Number(value);

const sameAddress = (a, b) => a?.toLowerCase?.() === b?.toLowerCase?.();

const sameWei = (a, b) => a?.toString?.() === b?.toString?.();

const withGasBuffer = (gasEstimate) => gasEstimate.mul(12).div(10);

const MIN_AMOY_PRIORITY_FEE = ethers.utils.parseUnits('25', 'gwei');
const MIN_AMOY_MAX_FEE = ethers.utils.parseUnits('30', 'gwei');

const maxBigNumber = (...values) => values.reduce((max, value) => (
    value && value.gt(max) ? value : max
), ethers.constants.Zero);

const getFeeOverrides = async (provider) => {
    const feeData = await provider.getFeeData();

    if (feeData.maxFeePerGas) {
        const bufferedMaxFee = feeData.maxFeePerGas.mul(12).div(10);
        const bufferedPriorityFee = feeData.maxPriorityFeePerGas?.mul(12).div(10);
        const maxPriorityFeePerGas = maxBigNumber(bufferedPriorityFee, MIN_AMOY_PRIORITY_FEE);
        const maxFeePerGas = maxBigNumber(bufferedMaxFee, MIN_AMOY_MAX_FEE, maxPriorityFeePerGas);

        return {
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
    }

    if (feeData.gasPrice) {
        return { gasPrice: maxBigNumber(feeData.gasPrice.mul(12).div(10), MIN_AMOY_MAX_FEE) };
    }

    return {};
};

const estimateTransactionCost = (gasLimit, feeOverrides) => {
    const price = feeOverrides.maxFeePerGas || feeOverrides.gasPrice;
    return price ? gasLimit.mul(price) : ethers.constants.Zero;
};

const readAndVerifyCreatedCampaign = async (contract, campaignId, expected) => {
    try {
        const details = await contract.getCampaign(campaignId);
        const creator = details.creator;
        const title = details.title;
        const goal = details.goal;
        const deadline = toNumber(details.deadline);
        const ipfsHash = details.ipfsHash;

        if (
            sameAddress(creator, expected.creator) &&
            title === expected.title &&
            sameWei(goal, expected.goalWei) &&
            deadline === expected.deadlineTimestamp &&
            ipfsHash === expected.ipfsHash
        ) {
            return toNumber(details.id);
        }
    } catch (_err) {
        // Campaign id does not exist or provider read failed. Keep trying other fallbacks.
    }

    return null;
};

const findCreatedCampaignId = async ({ contract, receipt, expected }) => {
    const contractAddress = getActiveContractAddress();
    const eventFromReceipt = receipt.events?.find(
        (event) => event.event === 'CampaignCreated' && sameAddress(event.address, contractAddress)
    );
    if (eventFromReceipt?.args?.campaignId) {
        return toNumber(eventFromReceipt.args.campaignId);
    }

    for (const log of receipt.logs || []) {
        if (!sameAddress(log.address, contractAddress)) continue;
        try {
            const parsed = contract.interface.parseLog(log);
            if (parsed.name === 'CampaignCreated') {
                return toNumber(parsed.args.campaignId);
            }
        } catch (_err) {
            // Log belongs to another ABI event.
        }
    }

    try {
        const events = await contract.queryFilter(
            contract.filters.CampaignCreated(null, expected.creator),
            receipt.blockNumber,
            receipt.blockNumber
        );
        const matchingEvent = events.find((event) => event.transactionHash === receipt.transactionHash);
        if (matchingEvent?.args?.campaignId) {
            return toNumber(matchingEvent.args.campaignId);
        }
    } catch (_err) {
        // Some injected providers are flaky with eth_getLogs. State verification below still works.
    }

    if (expected.preflightId) {
        const verifiedId = await readAndVerifyCreatedCampaign(contract, expected.preflightId, expected);
        if (verifiedId) return verifiedId;
    }

    const campaignCount = toNumber(await contract.campaignCount());
    const start = Math.max(1, campaignCount - 20);
    for (let id = campaignCount; id >= start; id--) {
        const verifiedId = await readAndVerifyCreatedCampaign(contract, id, expected);
        if (verifiedId) return verifiedId;
    }

    return null;
};

export const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
        return new ethers.providers.Web3Provider(window.ethereum);
    }
    return null;
};

const getNetworkLabel = (network) => {
    const configuredName = import.meta.env.VITE_NETWORK_NAME;
    if (configuredName) return configuredName;
    return network?.name === 'unknown' ? `chain ${network.chainId}` : network?.name;
};

const assertContractDeployed = async (providerOrSigner) => {
    const contractAddress = getActiveContractAddress();
    if (!contractAddress || !ethers.utils.isAddress(contractAddress)) {
        throw new Error("VITE_CONTRACT_ADDRESS is missing or invalid. Deploy the Crowdfunding contract and update your .env file.");
    }

    const provider = typeof providerOrSigner.getCode === 'function'
        ? providerOrSigner
        : providerOrSigner.provider;

    if (!provider || typeof provider.getCode !== 'function') {
        throw new Error("Could not access an ethers provider for contract lookup. Reconnect MetaMask and try again.");
    }

    const code = await provider.getCode(contractAddress);

    if (!code || code === '0x') {
        const network = await provider.getNetwork();
        throw new ContractNotDeployedError(
            `No Crowdfunding contract is deployed at ${contractAddress} on ${getNetworkLabel(network)}.`
        );
    }

    return contractAddress;
};

export const getContract = (providerOrSigner) => {
    const contractAddress = getActiveContractAddress();
    if (!contractAddress) {
        console.error("Contract address is not defined in environment variables");
        return null;
    }
    return new ethers.Contract(contractAddress, CrowdfundingArtifact.abi, providerOrSigner);
};

export const deployCrowdfundingContract = async () => {
    const provider = getProvider();
    if (!provider) throw new Error("No ethereum provider found");

    const signer = provider.getSigner();
    const factory = new ethers.ContractFactory(CrowdfundingArtifact.abi, CrowdfundingArtifact.bytecode, signer);
    const feeOverrides = await getFeeOverrides(provider);
    const deployTransaction = factory.getDeployTransaction();
    const gasLimit = withGasBuffer(await signer.estimateGas(deployTransaction));
    const deployCost = estimateTransactionCost(gasLimit, feeOverrides);
    const balance = await signer.getBalance();

    if (deployCost.gt(ethers.constants.Zero) && balance.lt(deployCost)) {
        throw new Error(
            `Not enough Amoy MATIC to deploy the contract. Estimated maximum cost is ` +
            `${ethers.utils.formatEther(deployCost)} MATIC, but your wallet has ` +
            `${ethers.utils.formatEther(balance)} MATIC.`
        );
    }

    const contract = await factory.deploy({ gasLimit, ...feeOverrides });

    console.log("Deploying Crowdfunding contract from browser:", contract.deployTransaction.hash);
    await contract.deployed();

    saveActiveContractAddress(contract.address);
    console.log("Crowdfunding contract deployed at:", contract.address);
    return contract.address;
};

export const createCampaignOnChain = async (title, description, goalInMatic, deadlineTimestamp, ipfsHash) => {
    const provider = getProvider();
    if (!provider) throw new Error("No ethereum provider found");
    const signer = provider.getSigner();
    await assertContractDeployed(signer);
    const contract = getContract(signer);

    const goalWei = ethers.utils.parseUnits(goalInMatic.toString(), "ether");

    const feeOverrides = await getFeeOverrides(provider);
    const gasOverrides = {
        gasLimit: 800000,
        ...feeOverrides,
    };
    
    try {
        const creator = await signer.getAddress();
        let preflightId = null;
        try {
            preflightId = toNumber(await contract.callStatic.createCampaign(title, description, goalWei, deadlineTimestamp, ipfsHash, gasOverrides));
        } catch (_err) {
            // The real transaction will surface validation or wallet errors below.
        }

        const tx = await contract.createCampaign(title, description, goalWei, deadlineTimestamp, ipfsHash, gasOverrides);
        console.log("Transaction sent! Hash:", tx.hash);
        const receipt = await tx.wait();
        if (receipt.status === 0) {
            throw new Error("Campaign creation transaction reverted.");
        }
        console.log("Transaction confirmed in block:", receipt.blockNumber);

        const campaignId = await findCreatedCampaignId({
            contract,
            receipt,
            expected: {
                creator,
                title,
                goalWei,
                deadlineTimestamp,
                ipfsHash,
                preflightId,
            }
        });

        if (campaignId) {
            return campaignId;
        }

        throw new Error("Campaign was created, but the new campaign ID could not be verified from receipt logs or contract state.");
    } catch (error) {
        console.error("Error creating campaign on-chain:", error);
        throw error;
    }
};

export const contributeToCampaign = async (campaignId, amountInMatic) => {
    const provider = getProvider();
    if (!provider) throw new Error("No ethereum provider found");
    const signer = provider.getSigner();
    await assertContractDeployed(signer);
    const contract = getContract(signer);

    const amountWei = ethers.utils.parseUnits(amountInMatic.toString(), "ether");

    const feeOverrides = await getFeeOverrides(provider);
    const gasOverrides = {
        gasLimit: 200000,
        ...feeOverrides,
    };

    try {
        const tx = await contract.contribute(campaignId, { value: amountWei, ...gasOverrides });
        await tx.wait();
        return tx.hash;
    } catch (error) {
        console.error("Error contributing to campaign on-chain:", error);
        throw error;
    }
};

export const withdrawFunds = async (campaignId) => {
    const provider = getProvider();
    if (!provider) throw new Error("No ethereum provider found");
    const signer = provider.getSigner();
    await assertContractDeployed(signer);
    const contract = getContract(signer);

    try {
        const feeOverrides = await getFeeOverrides(provider);
        const gasOverrides = { 
            gasLimit: 200000, 
            ...feeOverrides,
        };
        const tx = await contract.withdrawFunds(campaignId, gasOverrides);
        await tx.wait();
        return tx.hash;
    } catch (error) {
        console.error("Error withdrawing funds:", error);
        throw error;
    }
};

export const refundContribution = async (campaignId) => {
    const provider = getProvider();
    if (!provider) throw new Error("No ethereum provider found");
    const signer = provider.getSigner();
    await assertContractDeployed(signer);
    const contract = getContract(signer);

    try {
        const feeOverrides = await getFeeOverrides(provider);
        const gasOverrides = { 
            gasLimit: 200000, 
            ...feeOverrides,
        };
        const tx = await contract.refund(campaignId, gasOverrides);
        await tx.wait();
        return tx.hash;
    } catch (error) {
        console.error("Error processing refund:", error);
        throw error;
    }
};

export const getCampaignDetails = async (campaignId) => {
    const provider = getProvider();
    if (!provider) throw new Error("No ethereum provider found");
    await assertContractDeployed(provider);
    // Can just connect to provider for read-only
    const contract = getContract(provider);

    try {
        const details = await contract.getCampaign(campaignId);
        return {
            id: details.id.toNumber(),
            contract_campaign_id: details.id.toNumber(), // Alias for backend compatibility
            creator: details.creator,
            creator_wallet: details.creator, // Alias for backend compatibility
            title: details.title,
            description: details.description,
            goal: ethers.utils.formatEther(details.goal),
            deadline: details.deadline.toNumber(),
            amountRaised: ethers.utils.formatEther(details.amountRaised),
            ipfsHash: details.ipfsHash,
            ipfs_hash: details.ipfsHash, // Alias for backend compatibility
            withdrawn: details.withdrawn
        };
    } catch (error) {
        console.error("Error getting campaign details:", error);
        throw error;
    }
};

export const getCampaignContributionEvents = async (campaignId) => {
    const provider = getProvider();
    if (!provider) throw new Error("No ethereum provider found");
    await assertContractDeployed(provider);

    const contract = getContract(provider);
    const filter = contract.filters.FundReceived(Number(campaignId));

    let events = [];
    try {
        events = await contract.queryFilter(filter, 0, 'latest');
    } catch (_err) {
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 50000);
        events = await contract.queryFilter(filter, fromBlock, 'latest');
    }

    const blockCache = new Map();
    const getBlockTimestamp = async (blockNumber) => {
        if (!blockCache.has(blockNumber)) {
            blockCache.set(blockNumber, provider.getBlock(blockNumber));
        }
        const block = await blockCache.get(blockNumber);
        return block?.timestamp || 0;
    };

    return Promise.all(events.map(async (event) => ({
        campaignId: toNumber(event.args.campaignId),
        contributor: event.args.contributor,
        amount: Number(ethers.utils.formatEther(event.args.amount)),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: await getBlockTimestamp(event.blockNumber),
    })));
};

/**
 * Robust Resilience Fetcher:
 * Gets a total count from the chain and fetches and details for missing items.
 */
export const getLatestCampaignsFromChain = async (startId, endId) => {
    const campaigns = [];
    for (let i = startId; i <= endId; i++) {
        try {
            const camp = await getCampaignDetails(i);
            campaigns.push(camp);
        } catch (err) {
            console.warn(`Fallback: Failed to fetch campaign ${i} from chain`, err);
        }
    }
    return campaigns;
};

export const getOnChainCampaignCount = async () => {
    const provider = getProvider();
    if (!provider) return 0;
    try {
        await assertContractDeployed(provider);
    } catch (err) {
        console.warn(err.message);
        return 0;
    }
    const contract = getContract(provider);
    try {
        const count = await contract.campaignCount();
        return count.toNumber();
    } catch (err) {
        console.error("Error fetching campaign count from chain", err);
        return 0;
    }
};
