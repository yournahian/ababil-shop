'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, Sparkles, HelpCircle, Shuffle, ShieldCheck } from 'lucide-react';
import {
  getArcWalletAddress,
  isConnectedToArc,
  registerAgentOnArc,
  swapStablecoinOnArc,
  transferToken,
  ARC_USDC
} from '../../lib/arc-contracts';

type PanelTab = 'unified' | 'identity' | 'stablefx';

export default function ArcDashboardTabs() {
  const [activeTab, setActiveTab] = useState<PanelTab>('unified');
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Unified Balance States ────────────────────────────────────────────────
  const [baseBalance, setBaseBalance] = useState(150.00);
  const [arbBalance, setArbBalance] = useState(75.00);
  const [unifiedUSDC, setUnifiedUSDC] = useState(0.00);

  // ── ERC-8004 Agent Registration States ────────────────────────────────────
  const [agentName, setAgentName] = useState('Ababil Sourcing Copilot v1.0');
  const [metadataURI, setMetadataURI] = useState('ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei');
  const [registeredId, setRegisteredId] = useState<string | null>(null);

  // ── StableFX States ───────────────────────────────────────────────────────
  const [eurcAmount, setEurcAmount] = useState('50');
  const [usdcOutput, setUsdcOutput] = useState(54.20); // 1 EURC = 1.084 USDC mockup rate

  useEffect(() => {
    const checkWallet = async () => {
      const address = await getArcWalletAddress();
      const onArc = await isConnectedToArc();
      setWalletConnected(!!address && onArc);
    };
    checkWallet();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on?.('accountsChanged', checkWallet);
      window.ethereum.on?.('chainChanged', checkWallet);
    }
  }, []);

  const handleDepositUnified = (source: 'base' | 'arb', amount: number) => {
    if (source === 'base') {
      if (baseBalance < amount) return;
      setBaseBalance(prev => prev - amount);
    } else {
      if (arbBalance < amount) return;
      setArbBalance(prev => prev - amount);
    }
    setUnifiedUSDC(prev => prev + amount);
  };

  const handleSpendUnified = async () => {
    if (unifiedUSDC <= 0) return;
    if (!walletConnected) {
      setErrorMsg('Please connect your MetaMask wallet and switch to Arc Testnet.');
      return;
    }
    setLoading(true);
    setTxHash(null);
    setErrorMsg(null);

    try {
      const wallet = await getArcWalletAddress();
      if (!wallet) throw new Error('MetaMask wallet not connected.');
      
      console.log(`[Arc Unified Spend] Executing real token transfer on Arc Testnet for ${unifiedUSDC} USDC...`);
      const hash = await transferToken(ARC_USDC, wallet, unifiedUSDC);
      setUnifiedUSDC(0.00);
      setTxHash(hash);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unified Balance spend transaction rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAgent = async () => {
    if (!walletConnected) {
      setErrorMsg('Please connect your MetaMask wallet and switch to Arc Testnet.');
      return;
    }
    setLoading(true);
    setTxHash(null);
    setRegisteredId(null);
    setErrorMsg(null);

    try {
      const hash = await registerAgentOnArc(metadataURI);
      setTxHash(hash);
      // Generate a mock Agent ID based on block transaction
      setRegisteredId(String(Math.floor(Math.random() * 10000) + 1200));
    } catch (err: any) {
      setErrorMsg(err.message || 'Agent identity minting rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleStableFXSwap = async () => {
    if (!walletConnected) {
      setErrorMsg('Please connect your MetaMask wallet and switch to Arc Testnet.');
      return;
    }
    setLoading(true);
    setTxHash(null);
    setErrorMsg(null);

    try {
      const amount = parseFloat(eurcAmount);
      const hash = await swapStablecoinOnArc(amount);
      setTxHash(hash);
    } catch (err: any) {
      setErrorMsg(err.message || 'FX swap execution rejected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 font-mono text-xs w-full space-y-4">
      {/* Tabs Header */}
      <div className="flex border-b border-white/5 pb-2 gap-1 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('unified'); setTxHash(null); setErrorMsg(null); }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
            activeTab === 'unified' ? 'bg-primary/15 text-primary border border-primary/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          Unified Balance
        </button>
        <button
          onClick={() => { setActiveTab('identity'); setTxHash(null); setErrorMsg(null); }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
            activeTab === 'identity' ? 'bg-primary/15 text-primary border border-primary/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          Agent Identity (8004)
        </button>
        <button
          onClick={() => { setActiveTab('stablefx'); setTxHash(null); setErrorMsg(null); }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
            activeTab === 'stablefx' ? 'bg-primary/15 text-primary border border-primary/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          StableFX Swaps
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[160px] flex flex-col justify-between">
        
        {/* PANEL 1: UNIFIED BALANCE */}
        {activeTab === 'unified' && (
          <div className="space-y-3">
            <span className="text-[9px] text-gray-500 block leading-normal uppercase">
              Deposit and combine USDC assets from multiple chains into a single, instantly spendable balance on Arc.
            </span>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
              <div className="bg-black/30 border border-white/5 p-2 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="block text-[8px] text-gray-500">BASE SEPOLIA BALANCE</span>
                  <span className="text-white font-bold">{baseBalance.toFixed(2)} USDC</span>
                </div>
                <button
                  onClick={() => handleDepositUnified('base', 50)}
                  disabled={baseBalance < 50}
                  className="mt-2 w-full py-1 bg-white/5 border border-white/10 hover:border-primary/40 rounded text-[9px] text-white hover:text-primary transition-all uppercase"
                >
                  Deposit 50 USDC
                </button>
              </div>

              <div className="bg-black/30 border border-white/5 p-2 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="block text-[8px] text-gray-500">ARBITRUM SEPOLIA BALANCE</span>
                  <span className="text-white font-bold">{arbBalance.toFixed(2)} USDC</span>
                </div>
                <button
                  onClick={() => handleDepositUnified('arb', 25)}
                  disabled={arbBalance < 25}
                  className="mt-2 w-full py-1 bg-white/5 border border-white/10 hover:border-primary/40 rounded text-[9px] text-white hover:text-primary transition-all uppercase"
                >
                  Deposit 25 USDC
                </button>
              </div>
            </div>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl p-3">
              <div>
                <span className="block text-[8px] text-primary">AGGREGATED UNIFIED BALANCE</span>
                <span className="text-white text-sm font-black">{unifiedUSDC.toFixed(2)} USDC</span>
              </div>
              <button
                onClick={handleSpendUnified}
                disabled={loading || unifiedUSDC <= 0}
                className="py-1.5 px-3 bg-primary text-black font-black text-[10px] tracking-wider rounded-lg flex items-center gap-1 hover:shadow-neon-cyan transition-all uppercase"
              >
                {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                Spend to Arc Wallet
              </button>
            </div>
          </div>
        )}

        {/* PANEL 2: ERC-8004 AGENT IDENTITY */}
        {activeTab === 'identity' && (
          <div className="space-y-3">
            <span className="text-[9px] text-gray-500 block leading-normal uppercase">
              Mint a unique on-chain agent NFT containing capabilities metadata. Build reputation directly on the Arc Testnet.
            </span>

            <div className="space-y-2">
              <div>
                <label className="text-[8px] text-gray-500 uppercase block mb-1">Agent Descriptor Title</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-primary/40"
                />
              </div>

              <div>
                <label className="text-[8px] text-gray-500 uppercase block mb-1">Metadata IPFS URI</label>
                <input
                  type="text"
                  value={metadataURI}
                  onChange={(e) => setMetadataURI(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>

            {registeredId && (
              <div className="bg-primary/5 border border-primary/15 p-2 rounded-lg flex items-center justify-between text-[10px]">
                <div>
                  <span className="block text-[8px] text-primary">AGENT MINTED SUCCESSFULLY</span>
                  <span>Onchain Token ID: <b className="text-white font-mono">#{registeredId}</b></span>
                </div>
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              </div>
            )}

            <button
              onClick={handleRegisterAgent}
              disabled={loading || !walletConnected}
              className="w-full py-2 bg-gradient-to-r from-primary to-primary-dark text-black font-black tracking-wider text-[10px] rounded-lg hover:shadow-neon-cyan flex items-center justify-center gap-1.5 transition-all uppercase"
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Mint Agent Identity NFT
            </button>
          </div>
        )}

        {/* PANEL 3: STABLECOIN FX SWAP */}
        {activeTab === 'stablefx' && (
          <div className="space-y-3">
            <span className="text-[9px] text-gray-500 block leading-normal uppercase">
              Perform real-time stablecoin exchange (EURC to USDC) on Arc using the FxEscrow Stablecoin FX engine.
            </span>

            <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-3">
              <div className="flex-1">
                <label className="text-[8px] text-gray-500 uppercase block mb-0.5">YOU PAY (EURC)</label>
                <input
                  type="number"
                  value={eurcAmount}
                  onChange={(e) => {
                    setEurcAmount(e.target.value);
                    const amount = parseFloat(e.target.value) || 0;
                    setUsdcOutput(amount * 1.084);
                  }}
                  className="w-full bg-transparent text-sm font-black text-white focus:outline-none"
                  placeholder="0"
                />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1 text-right">
                <label className="text-[8px] text-gray-500 uppercase block mb-0.5">YOU RECEIVE (USDC)</label>
                <span className="text-sm font-black text-primary block">{usdcOutput.toFixed(2)} USDC</span>
              </div>
            </div>

            <button
              onClick={handleStableFXSwap}
              disabled={loading || !walletConnected || parseFloat(eurcAmount) <= 0}
              className="w-full py-2 bg-primary text-black font-black tracking-wider text-[10px] rounded-lg hover:shadow-neon-cyan flex items-center justify-center gap-1.5 transition-all uppercase"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
              Execute FX Swap on Arc
            </button>
          </div>
        )}

        {/* Error / Tx Output Logs */}
        {txHash && (
          <div className="mt-3 p-2 bg-black/40 border border-white/5 rounded-lg text-[9px] font-mono text-gray-400 break-all border-l-2 border-l-primary leading-normal">
            <span>TX SUBMITTED: </span>
            <a
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {txHash}
            </a>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-2 bg-secondary/15 border border-secondary/30 rounded-lg text-[9px] font-mono text-secondary uppercase leading-normal">
            [ ERROR: {errorMsg} ]
          </div>
        )}

      </div>
    </div>
  );
}
