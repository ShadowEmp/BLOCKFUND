import React, { createContext, useState, useEffect, useCallback } from 'react';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [chainId, setChainId] = useState("");
  
  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      if (!window.ethereum) return console.log("Please install MetaMask.");

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(currentChain);

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("No accounts found.");
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
    }
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        } else {
          setCurrentAccount("");
        }
      });
      window.ethereum.on('chainChanged', (chain) => {
        setChainId(chain);
        // Reload page on network change as recommended by MetaMask
        window.location.reload();
      });
    }
  }, [checkIfWalletIsConnected]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");

      // Network Guard: Use Chain ID from .env (defaults to Localhost 0x7a69)
      const targetChainId = import.meta.env.VITE_CHAIN_ID || '0x7a69';
      const targetNetworkName = import.meta.env.VITE_NETWORK_NAME || 'Hardhat Local';
      const rpcUrl = import.meta.env.VITE_POLYGON_AMOY_RPC || 'http://127.0.0.1:8545';
      
      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      
      if (currentChain !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError) {
          // If the network is not added to MetaMask (Code 4902)
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainId,
                    chainName: targetNetworkName,
                    rpcUrls: [rpcUrl],
                    nativeCurrency: {
                      name: 'MATIC',
                      symbol: 'MATIC',
                      decimals: 18,
                    },
                    blockExplorerUrls: targetChainId === '0x13882' ? ['https://amoy.polygonscan.com/'] : [],
                  },
                ],
              });
            } catch (addError) {
              console.error(addError);
              throw new Error(`Failed to add ${targetNetworkName} to MetaMask`);
            }
          } else {
            console.error("Switch error details:", switchError);
            throw new Error(`Failed to switch to ${targetNetworkName}. Please switch manually in MetaMask.`);
          }
        }
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
      return accounts[0];
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider value={{ currentAccount, chainId, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
