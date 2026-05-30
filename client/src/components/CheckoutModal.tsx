import React, { useState, useCallback } from 'react';
import {
  createPaymentIntent,
  connectWallet,
  getConnectedChainId,
  signEIP3009,
  submitSettlement,
  switchToChain,
  type PaymentRequirement,
  type SettlementResult,
} from '../lib/ababilpay';

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
  onSuccess: (result: SettlementResult, txHash: string) => void;
  onCancel: () => void;
}

const NETWORK_LABELS: Record<string, string> = {
  'eip155:84532':    '🔵 Base Sepolia',
  'eip155:11155111': '🔷 Ethereum Sepolia',
  'eip155:5042002':  '⚡ Arc Testnet',
  'solana:devnet':   '🟣 Solana Devnet',
};

// ─── Component ─────────────────────────────────────────────────────────────

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  amountUSDC,
  orderDescription,
  orderId,
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

      // Step 2: Create payment intent
      setStep('creating_intent');
      log('📋 Creating payment intent...');
      const intent = await createPaymentIntent({
        amount_usdc: amountUSDC,
        description: orderDescription,
        order_id: orderId,
      });
      setIntentId(intent.intent_id);

      // Filter to EVM chains only (no Solana in this flow)
      const evmReqs = intent.payment_requirements.filter(r =>
        r.network.startsWith('eip155:')
      );
      setRequirements(evmReqs);
      log(`✅ Intent created: ${intent.intent_id.slice(0, 8)}...`);
      log(`💡 ${evmReqs.length} chain(s) available`);

      if (evmReqs.length === 0) {
        throw new Error('No EVM payment options available. Please configure a wallet on the Ababilpay dashboard.');
      }

      // If only one chain, auto-select it
      if (evmReqs.length === 1) {
        await proceedWithRequirement(intent.intent_id, evmReqs[0], address);
      } else {
        setStep('select_chain');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStep('error');
    }
  }, [amountUSDC, orderDescription, orderId]);

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
        log(`🔄 Switching to chain ${targetChainId}...`);
        await switchToChain(targetChainId);
        log('✅ Chain switched');
      }

      // Step 4: Sign EIP-3009
      setStep('signing');
      log('✍️ Requesting signature...');
      const payload = await signEIP3009(address, req);
      log('✅ Signed successfully');

      // Step 5: Submit settlement
      setStep('settling');
      log('⛓️ Submitting to blockchain...');
      const result = await submitSettlement(iid, req, payload);
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
      onSuccess(successResult, successResult.tx_hash);
    }
    resetState();
  }, [successResult, onSuccess]);

  if (!isOpen) return null;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
        onClick={() => {
          if (step === 'idle' || step === 'error' || step === 'success') {
            resetState();
            onCancel();
          }
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[#050505] border border-white/10 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(0,255,255,0.15)] pointer-events-auto overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500 font-medium">Powered by AbabilPay</div>
                <div className="text-white font-bold text-lg leading-tight">Secure USDC Checkout</div>
              </div>
            </div>
            {(step === 'idle' || step === 'error') && (
              <button
                onClick={() => { resetState(); onCancel(); }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Amount strip */}
          <div className="px-6 py-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Total</div>
              <div className="text-2xl font-black text-primary font-mono">{amountUSDC.toFixed(2)} USDC</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Order</div>
              <div className="text-sm text-white font-medium truncate max-w-[140px]">{orderDescription}</div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 min-h-[280px] flex flex-col">

            {/* IDLE */}
            {step === 'idle' && (
              <div className="flex flex-col items-center justify-center flex-1 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">🔐</div>
                  <div className="text-white font-bold text-lg mb-2">Pay with USDC</div>
                  <div className="text-gray-500 text-sm max-w-xs">
                    Connect your MetaMask wallet to sign an EIP-3009 gasless transfer. USDC goes directly on-chain.
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 py-2 px-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-green-400">✓</span>
                    <span>No gas fees for you — Ababil relays the transaction</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 py-2 px-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-green-400">✓</span>
                    <span>EIP-3009 gasless authorization — no ETH needed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 py-2 px-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-green-400">✓</span>
                    <span>Funds settle directly on-chain — Ababil never holds them</span>
                  </div>
                </div>

                <button
                  id="ababil-pay-btn"
                  onClick={startCheckout}
                  className="w-full py-4 rounded-2xl bg-primary text-black font-black text-lg uppercase tracking-wider hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect &amp; Pay
                </button>
              </div>
            )}

            {/* IN-PROGRESS (connecting / creating / signing / settling / switching) */}
            {['connecting', 'creating_intent', 'signing', 'settling', 'switching_chain'].includes(step) && (
              <div className="flex flex-col items-center justify-center flex-1 gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      {step === 'connecting' && <span className="text-sm">🔌</span>}
                      {step === 'creating_intent' && <span className="text-sm">📋</span>}
                      {step === 'signing' && <span className="text-sm">✍️</span>}
                      {step === 'settling' && <span className="text-sm">⛓️</span>}
                      {step === 'switching_chain' && <span className="text-sm">🔄</span>}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-white font-bold text-lg mb-1">
                    {step === 'connecting' && 'Connecting Wallet...'}
                    {step === 'creating_intent' && 'Creating Payment Intent...'}
                    {step === 'signing' && 'Waiting for Signature...'}
                    {step === 'settling' && 'Settling On-Chain...'}
                    {step === 'switching_chain' && 'Switching Network...'}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {step === 'signing' && 'Please approve in your wallet'}
                    {step === 'settling' && 'Do not close this window'}
                    {step === 'switching_chain' && 'Please approve in your wallet'}
                    {(step === 'connecting' || step === 'creating_intent') && 'Please wait...'}
                  </div>
                </div>

                {/* Step log */}
                {stepLog.length > 0 && (
                  <div className="w-full bg-black/50 rounded-xl border border-white/5 p-3 space-y-1">
                    {stepLog.map((entry, i) => (
                      <div key={i} className="text-xs font-mono text-gray-400">{entry}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SELECT CHAIN */}
            {step === 'select_chain' && (
              <div className="flex flex-col flex-1 gap-4">
                <div>
                  <div className="text-white font-bold text-base mb-1">Select a Network</div>
                  <div className="text-gray-500 text-sm">Choose which chain you'll pay from:</div>
                </div>

                <div className="space-y-3">
                  {requirements.map((req) => {
                    const label = NETWORK_LABELS[req.network] || req.network;
                    const chainId = parseInt(req.network.split(':')[1]);
                    return (
                      <button
                        key={req.network}
                        id={`chain-select-${chainId}`}
                        onClick={() => handleChainSelect(req)}
                        className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left flex items-center justify-between"
                      >
                        <div>
                          <div className="text-white font-semibold group-hover:text-primary transition-colors">{label}</div>
                          <div className="text-gray-500 text-xs font-mono mt-0.5">
                            Chain ID: {chainId} · {(parseFloat(req.maxAmountRequired) / 1_000_000).toFixed(2)} USDC
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>

                {/* Step log */}
                {stepLog.length > 0 && (
                  <div className="mt-auto bg-black/50 rounded-xl border border-white/5 p-3 space-y-1">
                    {stepLog.map((entry, i) => (
                      <div key={i} className="text-xs font-mono text-gray-400">{entry}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUCCESS */}
            {step === 'success' && successResult && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-black text-white mb-1">Payment Confirmed!</div>
                  <div className="text-gray-400 text-sm">
                    {successResult.amount_usdc} USDC settled on-chain
                  </div>
                </div>

                <div className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="text-primary font-mono font-bold">{successResult.amount_usdc} USDC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Network</span>
                    <span className="text-white">{NETWORK_LABELS[successResult.network] || successResult.network}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-gray-500">Transaction Hash</span>
                    <a
                      href={`https://sepolia.basescan.org/tx/${successResult.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-mono text-xs break-all hover:underline"
                    >
                      {successResult.tx_hash}
                    </a>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Settled At</span>
                    <span className="text-white text-xs">{new Date(successResult.settled_at).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  id="checkout-success-btn"
                  onClick={handleSuccess}
                  className="w-full py-4 rounded-2xl bg-green-500 text-black font-black text-base uppercase tracking-wider hover:bg-green-400 transition-colors active:scale-95"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}

            {/* ERROR */}
            {step === 'error' && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-white mb-2">Payment Failed</div>
                  <div className="text-red-400 text-sm text-center max-w-xs leading-relaxed">
                    {errorMsg}
                  </div>
                </div>

                {stepLog.length > 0 && (
                  <div className="w-full bg-black/50 rounded-xl border border-white/5 p-3 space-y-1">
                    {stepLog.map((entry, i) => (
                      <div key={i} className="text-xs font-mono text-gray-400">{entry}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => { resetState(); onCancel(); }}
                    className="flex-1 py-3 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="checkout-retry-btn"
                    onClick={() => { setStep('idle'); setErrorMsg(''); setStepLog([]); }}
                    className="flex-1 py-3 rounded-2xl bg-primary text-black font-bold hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer branding */}
          <div className="px-6 pb-5 text-center">
            <div className="text-xs text-gray-700">
              Protected by{' '}
              <span className="text-gray-600 font-semibold">AbabilPay x402</span>
              {' '}· EIP-3009 gasless transfer
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;
