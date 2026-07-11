'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, ShieldAlert, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import {
  getArcWalletAddress,
  isConnectedToArc,
  switchToArcNetwork,
  getArcTokenBalance,
  ARC_USDC,
  ARC_EURC
} from '../../lib/arc-contracts';

export default function ArcConnectionStatus() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [onArcNetwork, setOnArcNetwork] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [eurcBalance, setEurcBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [hasProvider, setHasProvider] = useState(true);

  const checkConnection = async () => {
    if (typeof window === 'undefined') return;
    if (!window.ethereum) {
      setHasProvider(false);
      return;
    }
    setHasProvider(true);

    const address = await getArcWalletAddress();
    setWalletAddress(address);

    const onArc = await isConnectedToArc();
    setOnArcNetwork(onArc);

    if (address && onArc) {
      const usdc = await getArcTokenBalance(ARC_USDC, address);
      const eurc = await getArcTokenBalance(ARC_EURC, address);
      setUsdcBalance(usdc);
      setEurcBalance(eurc);
    }
  };

  useEffect(() => {
    checkConnection();

    // Listen for chain/account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = () => checkConnection();
      const handleAccountsChanged = () => checkConnection();

      window.ethereum.on?.('chainChanged', handleChainChanged);
      window.ethereum.on?.('accountsChanged', handleAccountsChanged);

      return () => {
        // Safe cleanup
        try {
          // If using standard EventEmitter cleanup
        } catch {}
      };
    }
  }, []);

  const handleConnect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    setLoading(true);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await checkConnection();
    } catch (err) {
      console.error('Connection rejected:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setLoading(true);
    try {
      await switchToArcNetwork();
      await checkConnection();
    } catch (err) {
      console.error('Network switch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!hasProvider) {
    return (
      <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-3.5 flex items-center gap-3 text-secondary font-mono text-[10px] w-full">
        <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
        <div>
          <span>[ METAMASK NOT DETECTED ]</span>
          <span className="block font-sans text-gray-400 mt-0.5">Please install MetaMask to unlock Arc on-chain features.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 space-y-3 font-mono text-xs w-full shadow-neon-cyan">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <span className="font-bold tracking-wider text-white">ARC TESTNET PORTAL</span>
        </div>

        {walletAddress ? (
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 text-[10px]">
            <CheckCircle className={`w-3.5 h-3.5 ${onArcNetwork ? 'text-primary' : 'text-yellow-500'}`} />
            <span className="text-gray-300 font-bold uppercase">
              {onArcNetwork ? 'ARC ACTIVE' : 'WRONG NETWORK'}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-500 font-bold">[ OFFLINE ]</span>
        )}
      </div>

      {walletAddress ? (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-white/5 pt-2">
            <span>WALLET ADDRESS:</span>
            <span className="text-white font-bold">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>

          {!onArcNetwork ? (
            <button
              onClick={handleSwitchNetwork}
              disabled={loading}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 text-[10px]"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
              SWITCH TO ARC TESTNET (5042002)
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px]">
              <div className="bg-black/30 border border-white/5 p-2 rounded-lg text-center">
                <span className="block text-gray-500 text-[8px] mb-0.5">USDC BALANCE</span>
                <span className="text-primary font-black text-xs">{usdcBalance} USDC</span>
              </div>
              <div className="bg-black/30 border border-white/5 p-2 rounded-lg text-center">
                <span className="block text-gray-500 text-[8px] mb-0.5">EURC BALANCE</span>
                <span className="text-secondary font-black text-xs">{eurcBalance} EURC</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-2 bg-primary hover:bg-primary-light text-black font-bold tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 text-[10px]"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
          CONNECT METAMASK WALLET
        </button>
      )}
    </div>
  );
}
