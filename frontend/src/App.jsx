import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';

import cashBg from './assets/floating_cash_bg.png';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import Governance from './pages/Governance';
import Staking from './pages/Staking';
import Analytics from './pages/Analytics';
import MyIncome from './pages/MyIncome';
import GovernanceLive from './pages/GovernanceLive';
import StakingLive from './pages/StakingLive';
import AnalyticsLive from './pages/AnalyticsLive';

import { useAuth } from './hooks/useAuth';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a loading spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <Router>
      <WalletProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-background text-textMain selection:bg-primary/30 selection:text-white">
            {/* Global Mesh Gradient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#030712]">
               <div 
                 className="absolute inset-0 opacity-[0.25] mix-blend-screen" 
                 style={{ backgroundImage: `url(${cashBg})`, backgroundSize: '500px', backgroundRepeat: 'repeat' }}
               />
               <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-primary/10 blur-[150px] mix-blend-screen animate-pulse duration-[10000ms]" />
               <div className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-secondary/10 blur-[120px] mix-blend-screen" />
               <div className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-purple-900/10 blur-[150px] mix-blend-screen" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow w-full mx-auto">
                <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/campaign/:id" element={<CampaignDetail />} />
                <Route 
                  path="/create-campaign" 
                  element={
                    <ProtectedRoute>
                      <CreateCampaign />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/governance" element={<Governance />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/governance-live" element={<GovernanceLive />} />
                <Route path="/staking-live" element={<StakingLive />} />
                <Route path="/analytics-live" element={<AnalyticsLive />} />
                <Route 
                  path="/my-income" 
                  element={
                    <ProtectedRoute>
                      <MyIncome />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
            </div>
          </div>
        </AuthProvider>
      </WalletProvider>
    </Router>
  );
};

export default App;
