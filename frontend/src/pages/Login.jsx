import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { connectWallet, currentAccount } = useWallet();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!currentAccount) {
      setError("Please connect your wallet first.");
      return;
    }
    try {
      await login(email, password, currentAccount);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl border border-borderLight shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        
        {!currentAccount ? (
          <div className="text-center">
            <p className="text-textMuted mb-6">Connect your wallet to sign in to your blockchain account.</p>
            <button 
              onClick={connectWallet}
              className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-lg font-bold transition-all"
            >
              Connect MetaMask
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Connected Wallet</label>
              <input 
                type="text" 
                disabled 
                value={`${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`}
                className="w-full bg-background border border-borderLight rounded-lg px-4 py-2 text-textMuted opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-background border border-borderLight rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-background border border-borderLight rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-lg font-bold transition-all mt-4"
            >
              Sign In
            </button>
          </form>
        )}
        
        <p className="text-center text-textMuted mt-6">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
