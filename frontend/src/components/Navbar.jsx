import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';
import { BarChart3, DollarSign, LayoutGrid, Scale, ShieldCheck, Wallet, LogOut } from 'lucide-react';

const Navbar = () => {
  const { currentAccount, chainId, connectWallet } = useWallet();
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-surface/50 backdrop-blur-2xl border-b border-borderLight text-textMain sticky top-0 z-50 transition-all shadow-xl shadow-black/40">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-2xl font-heading font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]">
          BlockFund
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link to="/dashboard" className="text-textMuted hover:text-primary transition-colors flex items-center gap-1">
            <LayoutGrid size={18} /> Dashboard
          </Link>
          <Link to="/my-income" className="text-textMuted hover:text-primary transition-colors flex items-center gap-1">
            <DollarSign size={18} /> My Income
          </Link>
          <Link to="/governance-live" className="text-textMuted hover:text-primary transition-colors flex items-center gap-1">
            <Scale size={18} /> Governance
          </Link>
          <Link to="/staking-live" className="text-textMuted hover:text-primary transition-colors flex items-center gap-1">
            <ShieldCheck size={18} /> Staking
          </Link>
          <Link to="/analytics-live" className="text-textMuted hover:text-primary transition-colors flex items-center gap-1">
            <BarChart3 size={18} /> Analytics
          </Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Network Status Indicator */}
        {currentAccount && (
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold border transition-all ${
            chainId === (import.meta.env.VITE_CHAIN_ID || '0x7a69')
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              chainId === (import.meta.env.VITE_CHAIN_ID || '0x7a69') ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
            }`} />
            {chainId === (import.meta.env.VITE_CHAIN_ID || '0x7a69') 
              ? (import.meta.env.VITE_NETWORK_NAME || 'Hardhat') 
              : 'WRONG NETWORK'}
            
            {chainId !== (import.meta.env.VITE_CHAIN_ID || '0x7a69') && (
              <button 
                onClick={connectWallet}
                className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors uppercase"
              >
                Switch
              </button>
            )}
          </div>
        )}

        {user ? (
          <div className="flex items-center space-x-4">
             <span className="text-sm font-mono text-textMuted bg-surface px-2 py-1 rounded border border-borderLight">
                 {currentAccount ? `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}` : 'Wallet disconnected'}
             </span>
             <Link to="/create-campaign" className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 scale-100 hover:scale-105 active:scale-95">
               + Create Project
             </Link>
             <button onClick={logout} className="text-textMuted hover:text-red-400 transition-colors p-2 group relative">
               <LogOut size={20} />
               <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-surface border border-borderLight text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Logout</span>
             </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <button 
              onClick={connectWallet}
              className="flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary/10 active:scale-95"
            >
              <Wallet size={18} />
              {currentAccount ? 'Sync Wallet' : 'Connect Wallet'}
            </button>
            <Link to="/login" className="text-textMuted hover:text-textMain font-medium px-2 underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all">Log In</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
