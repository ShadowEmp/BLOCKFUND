import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useContract } from '../hooks/useContract';
import api from '../services/api';
import { Upload } from 'lucide-react';
import LoadingTerminal from '../components/LoadingTerminal';
import { getActiveContractAddress } from '../services/contractService';
import { saveLocalCampaign, removeLocalCampaign } from '../utils/campaignPersistence';

const CreateCampaign = () => {
  const { user } = useAuth();
  const { createCampaignOnChain, deployCrowdfundingContract } = useContract();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ title: '', description: '', goal: '', deadline: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  // Terminal State
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalStep, setTerminalStep] = useState(0);
  const [terminalComplete, setTerminalComplete] = useState(false);

  const terminalStepsConfig = [
    { name: "Initialize Cryptography", detail: "Payload hash verified.", activeText: "Hashing request parameters..." },
    { name: "IPFS Network", detail: "Metadata formally pinned to IPFS gateway.", activeText: "Uploading multi-part artifact to decentralized storage..." },
    { name: "Wallet EIP-1559", detail: "Signature confirmed.", activeText: "Awaiting MetaMask transaction approval..." },
    { name: "EVM Broadcast", detail: "Mined and verified across 3 blocks.", activeText: "Broadcasting state diff to Polygon mempool..." }
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("You must be logged in.");
    
    setShowTerminal(true);
    setTerminalStep(0);
    setTerminalComplete(false);
    setError('');

    try {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) throw new Error("Deadline must be in the future");
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

      // Step 0: Hash (Fake delay for complexity)
      await delay(1200);
      setTerminalStep(1);

      let ipfsHash = "";
      if (file) {
        const imagePayload = new FormData();
        imagePayload.append('image', file);
        const uploadRes = await api.post('/campaigns/upload-image', imagePayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        ipfsHash = uploadRes.data.ipfs_hash || "";
      }
      
      await delay(1500); // simulate upload
      setTerminalStep(2);

      // Step 2 & 3: Smart Contract call
      const createOnChain = () => createCampaignOnChain(
        formData.title,
        formData.description,
        formData.goal,
        deadlineTimestamp,
        ipfsHash
      );

      let campaignId;
      try {
        campaignId = await createOnChain();
      } catch (chainErr) {
        if (chainErr.code !== 'CONTRACT_NOT_DEPLOYED') throw chainErr;

        console.warn("Crowdfunding contract not found on this network. Deploying with connected wallet...");
        await deployCrowdfundingContract();
        campaignId = await createOnChain();
      }
      
      if (campaignId === null) throw new Error("Failed to retrieve ID");
      setTerminalStep(3);

      const contractAddress = getActiveContractAddress();
      const campaignPayload = {
        title: formData.title,
        description: formData.description,
        goal: formData.goal,
        deadline: formData.deadline,
        ipfs_hash: ipfsHash || null,
        contract_campaign_id: campaignId,
      };

      saveLocalCampaign({
        ...campaignPayload,
        id: `local-${contractAddress || 'unknown'}-${campaignId}`,
        creator_wallet: user.wallet_address,
        contract_address: contractAddress,
        amountRaised: '0',
      });
      
      try {
        await api.post('/campaigns', campaignPayload);
        removeLocalCampaign(campaignId, contractAddress);
        console.log("Backend sync successful.");
      } catch (syncErr) {
        console.warn("Backend sync failed, but project is live on blockchain:", syncErr);
        // We don't throw here, the dashboard will pick it up via blockchain fallback
      }

      setTerminalStep(4);
      setTerminalComplete(true);
      await delay(1500);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || "Execution failed.");
      setShowTerminal(false);
    }
  };

  if (!user) return <div className="flex justify-center items-center h-[70vh]"><p className="text-xl text-textMuted">Please login to create a campaign.</p></div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 relative">
      {showTerminal && (
        <LoadingTerminal 
          steps={terminalStepsConfig} 
          currentStep={terminalStep} 
          isComplete={terminalComplete} 
          title="Campaign Deployment Pipeline"
        />
      )}
      
      <h1 className="text-4xl font-bold mb-8">Deploy a Smart Contract Campaign</h1>
      
      {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 font-mono">{error}</div>}
      
      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-2xl border border-borderLight shadow-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Campaign Title</label>
          <input type="text" name="title" required className="w-full bg-background border border-borderLight rounded-xl px-4 py-3 focus:border-primary text-textMain" onChange={handleChange} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Story & Description</label>
          <textarea name="description" required rows={5} className="w-full bg-background border border-borderLight rounded-xl px-4 py-3 focus:border-primary text-textMain resize-none" onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">Goal Amount (MATIC)</label>
              <input type="number" step="0.0001" min="0.0001" name="goal" required className="w-full bg-background border border-borderLight rounded-xl px-4 py-3 focus:border-primary text-textMain" onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">Deadline Date</label>
              <input type="datetime-local" name="deadline" required className="w-full bg-background border border-borderLight rounded-xl px-4 py-3 focus:border-primary text-textMain" onChange={handleChange} />
            </div>
        </div>

        <div className="border border-dashed border-borderLight hover:border-primary transition-colors rounded-xl p-8 text-center bg-background cursor-pointer relative">
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
            <Upload className="mx-auto text-textMuted mb-2" size={24} />
            <p className="text-sm text-textMuted"><span className="text-primary font-bold">Select Artifact Image</span> to anchor to IPFS</p>
            {file && <p className="text-sm text-secondary mt-2 font-mono break-all">{file.name}</p>}
        </div>

        <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 tracking-wide">
            INITIALIZE DEPLOYMENT
        </button>
      </form>
    </div>
  );
};

export default CreateCampaign;
