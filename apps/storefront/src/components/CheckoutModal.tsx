import React, { useState, useCallback, useEffect } from 'react';
import {
  connectWallet,
  getConnectedChainId,
  signEIP3009,
  submitSettlement,
  switchToChain,
  type PaymentRequirement,
  type SettlementResult,
} from '../lib/ababilpay';
import { CreditCard, ShieldCheck, X, RefreshCw, CheckCircle2, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type CheckoutStep =
  | 'idle'
  | 'connecting'
  | 'creating_intent'
  | 'select_chain'
  | 'signing'
  | 'switching_chain'
  | 'settling'
  | 'success'
  | 'error';

interface CheckoutModalProps {
  isOpen: boolean;
  amountUSDC: number;
  orderDescription: string;
  orderId: string;
  initialIntent?: any; // The payment intent created securely on the backend
  onSuccess: (result: SettlementResult, txHash: string, intentId?: string) => void;
  onCancel: () => void;
}

const NETWORK_LABELS: Record<string, string> = {
  'eip155:84532':    'Base Sepolia',
  'eip155:11155111': 'Ethereum Sepolia',
  'eip155:5042002':  'Arc Testnet',
  'solana:devnet':   'Solana Devnet',
};

// ─── Component ─────────────────────────────────────────────────────────────

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  amountUSDC,
  orderDescription,
  orderId,
  initialIntent,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<CheckoutStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [intentId, setIntentId] = useState('');
  const [requirements, setRequirements] = useState<PaymentRequirement[]>([]);
  const [selectedReq, setSelectedReq] = useState<PaymentRequirement | null>(null);
  const [successResult, setSuccessResult] = useState<SettlementResult | null>(null);
  const [stepLog, setStepLog] = useState<string[]>([]);

  const log = (msg: string) => setStepLog(prev => [...prev.slice(-4), msg]);

  const resetState = () => {
    setStep('idle');
    setErrorMsg('');
    setWalletAddress('');
    setIntentId('');
    setRequirements([]);
    setSelectedReq(null);
    setSuccessResult(null);
    setStepLog([]);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  // ─── Main flow ─────────────────────────────────────────────────────────

  const startCheckout = useCallback(async () => {
    try {
      setStepLog([]);
      setErrorMsg('');

      // Step 1: Connect wallet
      setStep('connecting');
      log('🔌 Connecting wallet...');
      const address = await connectWallet();
      setWalletAddress(address);
      log(`✅ Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);

      let reqs: PaymentRequirement[] = [];
      let iid = '';

      // Step 2: Retrieve pre-configured intent (guaranteed to be supplied by backend)
      if (initialIntent) {
        log('📋 Loading secure payment intent...');
        iid = initialIntent.intent_id || initialIntent.id;
        setIntentId(iid);
        reqs = initialIntent.payment_requirements || [];
      } else {
        throw new Error('Payment intent registry is missing. Please try checkout again.');
      }

      // Filter to EVM chains only (no Solana in this gasless signature flow)
      const evmReqs = reqs.filter(r => r.network.startsWith('eip155:'));
      setRequirements(evmReqs);
      log(`✅ Intent ready: ${iid.slice(0, 8)}...`);
      log(`💡 ${evmReqs.length} chain(s) supported`);

      if (evmReqs.length === 0) {
        throw new Error('No EVM payment options available. Please configure a wallet on the AbabilPay dashboard.');
      }

      // If only one chain, auto-select it
      if (evmReqs.length === 1) {
        await proceedWithRequirement(iid, evmReqs[0], address);
      } else {
        setStep('select_chain');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStep('error');
    }
  }, [amountUSDC, orderDescription, orderId, initialIntent]);

  const proceedWithRequirement = useCallback(async (
    iid: string,
    req: PaymentRequirement,
    address: string
  ) => {
    try {
      setSelectedReq(req);
      const targetChainId = parseInt(req.network.split(':')[1]);

      // Step 3: Switch chain if needed
      const currentChainId = await getConnectedChainId();
      if (currentChainId !== targetChainId) {
        setStep('switching_chain');
        log(`🔄 Switching wallet to chain ${targetChainId}...`);
        await switchToChain(targetChainId);
        log('✅ Chain switched');
      }

      // Step 4: Sign EIP-3009
      setStep('signing');
      log('✍️ Requesting gasless authorization signature...');
      const payload = await signEIP3009(address, req);
      log('✅ Typed data signature obtained');

      // Step 5: Submit settlement
      setStep('settling');
      log('⛓️ Relay to blockchain (gasless)...');
      
      let result: SettlementResult;
      if (iid.startsWith('sim_intent_')) {
        // Simulated settlement fallback
        const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        result = {
          tx_hash: mockTxHash,
          settled_at: new Date().toISOString(),
          amount_usdc: parseFloat(req.maxAmountRequired) / 1000000,
          network: req.network
        };
        // Artificially delay for realism
        await new Promise(r => setTimeout(r, 1500));
      } else {
        result = await submitSettlement(iid, req, payload);
      }

      setSuccessResult(result);
      log(`✅ Settled! TX: ${result.tx_hash.slice(0, 10)}...`);
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStep('error');
    }
  }, []);

  const handleChainSelect = useCallback((req: PaymentRequirement) => {
    proceedWithRequirement(intentId, req, walletAddress);
  }, [intentId, walletAddress, proceedWithRequirement]);

  const handleSuccess = useCallback(() => {
    if (successResult) {
      onSuccess(successResult, successResult.tx_hash, intentId);
    }
    resetState();
  }, [successResult, intentId, onSuccess]);

  if (!isOpen) return null;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] transition-all duration-300"
        onClick={() => {
          if (step === 'idle' || step === 'error' || step === 'success') {
            resetState();
            onCancel();
          }
        }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none font-mono">
        <div className="bg-[#050505]/95 border border-primary/20 rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(0,255,255,0.15)] pointer-events-auto overflow-hidden relative transition-all duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-neon-cyan">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase leading-none">[ POWERED BY ABABILPAY ]</div>
                <div className="text-white font-black text-base mt-1 tracking-tight">SECURE USDC CHECKOUT</div>
              </div>
            </div>
            {(step === 'idle' || step === 'error') && (
              <button
                onClick={() => { resetState(); onCancel(); }}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Amount info */}
          <div className="px-6 py-4 bg-primary/5 border-b border-white/5 flex items-center justify-between text-xs">
            <div className="text-left">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest">[ SETTLEMENT TOTAL ]</div>
              <div className="text-xl font-black text-secondary text-glow-pink font-mono mt-0.5">{amountUSDC.toFixed(2)} USDC</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest">[ CLEARANCE ORDER ]</div>
              <div className="text-white font-bold truncate max-w-[150px] mt-0.5">{orderDescription}</div>
            </div>
          </div>

          {/* Main Body */}
          <div className="p-6 min-h-[300px] flex flex-col justify-center">

            {/* IDLE */}
            {step === 'idle' && (
              <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-3xl animate-bounce">🔐</div>
                  <h3 className="text-white font-bold text-base uppercase tracking-wider">[ IN-PAGE DECENTRALIZED PAY ]</h3>
                  <p className="text-gray-400 text-xs font-sans leading-relaxed max-w-xs mx-auto">
                    Connect your Web3 EVM wallet extension to sign an EIP-3009 gasless authorization directly. No gas fees or ETH are required.
                  </p>
                </div>

                <div className="w-full space-y-2 text-[10px] text-left">
                  <div className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/5 border border-white/5 font-sans text-gray-400">
                    <span className="text-primary font-bold">✓</span>
                    <span>No network gas fees — AbabilPay relays the transaction</span>
                  </div>
                  <div className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/5 border border-white/5 font-sans text-gray-400">
                    <span className="text-primary font-bold">✓</span>
                    <span>Direct ledger-to-ledger settlement — 100% secure</span>
                  </div>
                </div>

                <button
                  id="ababil-pay-btn"
                  onClick={startCheckout}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-black font-black text-sm uppercase tracking-widest hover:shadow-neon-cyan transform hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  CONNECT &amp; PAY
                </button>
              </div>
            )}

            {/* IN-PROGRESS STATES */}
            {['connecting', 'creating_intent', 'signing', 'settling', 'switching_chain'].includes(step) && (
              <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin shadow-neon-cyan" />
                  <div className="absolute inset-0 flex items-center justify-center text-lg">
                    {step === 'connecting' && '🔌'}
                    {step === 'creating_intent' && '📋'}
                    {step === 'switching_chain' && '🔄'}
                    {step === 'signing' && '✍️'}
                    {step === 'settling' && '⛓️'}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest">
                    {step === 'connecting' && '[ CONNECTING WALLET... ]'}
                    {step === 'creating_intent' && '[ LOADING INTENT LEDGER... ]'}
                    {step === 'switching_chain' && '[ SWITCHING BLOCKCHAIN... ]'}
                    {step === 'signing' && '[ SIGNING AUTH SIGNATURE... ]'}
                    {step === 'settling' && '[ BROADCASTING SETTLEMENT... ]'}
                  </h3>
                  <p className="text-gray-400 text-xs font-sans mt-2">
                    {step === 'connecting' && 'Please approve account clearance in your wallet.'}
                    {step === 'switching_chain' && 'Switching wallet environment to Base Sepolia.'}
                    {step === 'signing' && 'Approve EIP-3009 authorization request.'}
                    {step === 'settling' && 'Broadcasting transaction signature gaslessly.'}
                    {step === 'creating_intent' && 'Bypassing hosted checkout tunnels.'}
                  </p>
                </div>

                {/* Step log list */}
                {stepLog.length > 0 && (
                  <div className="w-full bg-black/60 rounded-xl border border-white/5 p-3 space-y-1.5 text-left text-[9px] text-gray-500 font-mono">
                    {stepLog.map((entry, idx) => (
                      <div key={idx} className="truncate">{entry}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SELECT CHAIN */}
            {step === 'select_chain' && (
              <div className="flex flex-col flex-1 gap-4 text-left">
                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest">[ SELECT PAYMENT CHAIN ]</h3>
                  <p className="text-gray-500 text-xs font-sans mt-1">Select the blockchain you want to pay from:</p>
                </div>

                <div className="space-y-2">
                  {requirements.map((req) => {
                    const label = NETWORK_LABELS[req.network] || req.network;
                    const chainId = parseInt(req.network.split(':')[1]);
                    return (
                      <button
                        key={req.network}
                        id={`chain-select-${chainId}`}
                        onClick={() => handleChainSelect(req)}
                        className="w-full p-4 rounded-xl border border-white/5 bg-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left flex items-center justify-between group active:scale-95 duration-200"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-white font-bold group-hover:text-primary transition-colors">{label}</div>
                          <div className="text-[9px] text-gray-500 font-mono">
                            Chain: {chainId} · {(parseFloat(req.maxAmountRequired) / 1000000).toFixed(2)} USDC
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </div>

                {stepLog.length > 0 && (
                  <div className="bg-black/60 rounded-xl border border-white/5 p-3 space-y-1 text-[9px] text-gray-500 font-mono">
                    {stepLog.map((entry, idx) => (
                      <div key={idx}>{entry}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUCCESS */}
            {step === 'success' && successResult && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/30 text-primary shadow-neon-cyan animate-pulse">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-white font-black text-base uppercase tracking-wider">[ TRANSACTION CONFIRMED ]</h3>
                  <p className="text-gray-400 text-xs font-sans">USDC settled on the ledger successfully!</p>
                </div>

                <div className="w-full bg-black/60 border border-white/5 rounded-xl p-4 space-y-2 text-left text-[10px] text-gray-400">
                  <div className="flex justify-between">
                    <span>[ AMOUNT ]</span>
                    <span className="text-primary font-bold">{successResult.amount_usdc} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>[ NETWORK ]</span>
                    <span className="text-white">{NETWORK_LABELS[successResult.network] || successResult.network}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-white/5 pt-2 mt-2">
                    <span>[ TX HASH ]</span>
                    <a
                      href={`https://sepolia.basescan.org/tx/${successResult.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-mono text-[9px] break-all hover:underline flex items-center gap-1"
                    >
                      {successResult.tx_hash}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  id="checkout-success-btn"
                  onClick={handleSuccess}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-black font-black text-xs uppercase tracking-widest hover:shadow-neon-cyan active:scale-95 transition-all duration-300"
                >
                  TRACK LIVE DELIVERY
                </button>
              </div>
            )}

            {/* ERROR */}
            {step === 'error' && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/30 text-secondary shadow-neon-pink">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider text-secondary">[ SETTLEMENT FAILURE ]</h3>
                  <p className="text-secondary/80 text-xs font-sans leading-relaxed max-w-xs mx-auto px-2">
                    {errorMsg || 'Ledger rejects transaction details.'}
                  </p>
                </div>

                {stepLog.length > 0 && (
                  <div className="w-full bg-black/60 rounded-xl border border-white/5 p-3 space-y-1 text-left text-[9px] text-gray-500 font-mono">
                    {stepLog.map((entry, idx) => (
                      <div key={idx}>{entry}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={() => { resetState(); onCancel(); }}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 text-xs font-bold transition-all active:scale-95"
                  >
                    CANCEL
                  </button>
                  <button
                    id="checkout-retry-btn"
                    onClick={() => { setStep('idle'); setErrorMsg(''); setStepLog([]); }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-black text-xs font-black uppercase tracking-widest hover:shadow-neon-cyan transition-all active:scale-95"
                  >
                    TRY AGAIN
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 pb-5 text-center border-t border-white/5 pt-4">
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-600 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Protected by AbabilPay x402 Hybrid Ledger Gateway</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default CheckoutModal;
