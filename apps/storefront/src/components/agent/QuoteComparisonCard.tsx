import React, { useState } from 'react';
import { DollarSign, ShieldAlert, Check, RefreshCw, Star, ShieldCheck } from 'lucide-react';
import DirectPaidCard from './DirectPaidCard';

interface QuoteComparisonCardProps {
  rfq: {
    id: string;
    title: string;
    budgetUsdc: number;
    status: string;
  };
  quotes: any[];
  quoteCount: number;
  recommendation?: string | null;
  message?: string;
  onAccept?: (quoteId: string) => Promise<{ success: boolean; orderId: string; intent?: any; simulated?: boolean } | null>;
}

export default function QuoteComparisonCard({
  rfq,
  quotes,
  quoteCount,
  recommendation,
  message,
  onAccept,
}: QuoteComparisonCardProps) {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (quoteCount === 0) {
    return (
      <div className="bg-card border border-card-border p-5 rounded-2xl my-2 w-full space-y-2 text-center text-xs text-gray-400 font-mono">
        <ShieldAlert className="w-5 h-5 text-yellow-500 mx-auto animate-pulse" />
        <p className="font-bold uppercase">NO QUOTES ARRIVED YET</p>
        <p className="text-[10px] text-gray-500 font-sans">
          Vendors are compiling offers. I will notify you as soon as they submit.
        </p>
      </div>
    );
  }

  const handleAccept = async (quoteId: string) => {
    if (!onAccept) return;
    setAcceptingId(quoteId);
    setErrorMsg(null);
    try {
      const res = await onAccept(quoteId);
      if (res && res.success && res.orderId) {
        setOrderId(res.orderId);
        setAcceptedId(quoteId);
      }
    } catch (err: any) {
      console.error('Failed to accept quote:', err);
      setErrorMsg(err.message || 'Direct payment setup failed.');
    } finally {
      setAcceptingId(null);
    }
  };

  const acceptedQuote = quotes.find(q => q.id === acceptedId || q.status === 'accepted');

  if ((orderId || acceptedQuote?.orderId || acceptedQuote?.order_id) && acceptedQuote) {
    const finalOrderId = orderId || acceptedQuote.orderId || acceptedQuote.order_id;
    return (
      <DirectPaidCard 
        orderId={finalOrderId} 
        amount={acceptedQuote.totalPriceUsdc}
        txHash={txHash || acceptedQuote.paymentTxHash || acceptedQuote.payment_tx_hash || undefined}
        message="Direct payment successfully settled to vendor's wallet."
      />
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 my-2 w-full space-y-4 shadow-neon-pink">
      {/* Title */}
      <div className="border-b border-white/[0.04] pb-3">
        <span className="text-[8px] text-secondary font-mono tracking-widest uppercase block">[ QUOTE COMPARISON LEDGER ]</span>
        <h4 className="text-xs font-bold text-white uppercase mt-0.5">
          {rfq.title} — {quoteCount} Vendor Offer(s)
        </h4>
      </div>

      {/* Recommendation alerts */}
      {recommendation && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-[10px] text-primary font-mono leading-relaxed">
          {recommendation}
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="p-3 bg-secondary/15 border border-secondary/30 rounded-xl text-[10px] text-secondary font-mono leading-normal uppercase">
          [ TRANSACTION FAILED: {errorMsg} ]
        </div>
      )}

      {/* Comparison listing */}
      <div className="space-y-3">
        {quotes.map((q) => {
          const isOverBudget = q.totalPriceUsdc > rfq.budgetUsdc;
          const isAccepted = acceptedId === q.id || q.status === 'accepted';
          const isRfqClosed = rfq.status === 'accepted' || rfq.status === 'fulfilled';

          return (
            <div
              key={q.id}
              className={`border rounded-xl p-4 transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isAccepted
                  ? 'border-primary bg-primary/5 shadow-neon-cyan'
                  : 'border-card-border bg-black/30 hover:border-white/10'
              }`}
            >
              {/* Rank indicator for cheapest */}
              {q.rank === 1 && !isAccepted && (
                <div className="absolute top-0 right-0 bg-secondary text-black font-black font-mono text-[7px] px-2 py-0.5 rounded-bl uppercase tracking-wider">
                  Cheapest
                </div>
              )}

              {/* Vendor & Quote metrics */}
              <div className="space-y-1.5 flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase">
                    {q.vendorName}
                  </span>
                  {q.vendorVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  )}
                  {q.autoGenerated && (
                    <span className="bg-secondary/15 border border-secondary/30 text-secondary text-[6.5px] font-bold px-1 py-0.5 rounded font-mono uppercase tracking-wider">
                      AUTO-QUOTE
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-mono text-gray-400">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current text-secondary" />
                    <span className="text-white">{q.vendorRating.toFixed(1)}</span>
                  </div>
                  <div>
                    DELIVERY: <span className="text-white font-bold">{q.deliveryDays} DAYS</span>
                  </div>
                  <div>
                    UNIT PRICE: <span className="text-white font-bold">{q.unitPriceUsdc.toFixed(2)} USDC</span>
                  </div>
                </div>

                {q.notes && (
                  <p className="text-[9px] text-gray-500 font-sans italic leading-relaxed max-w-md">
                    &ldquo;{q.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Pricing & Accept trigger */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-4 w-full sm:w-auto border-t sm:border-t-0 border-white/[0.04] pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="block text-[7px] text-gray-500 uppercase leading-none">TOTAL AMOUNT</span>
                  <span className={`text-sm font-extrabold font-mono ${isOverBudget ? 'text-secondary' : 'text-primary-light'}`}>
                    {q.totalPriceUsdc.toFixed(2)} USDC
                  </span>
                  {isOverBudget && (
                    <span className="block text-[7px] text-secondary font-mono leading-none mt-1">EXCEEDS BUDGET</span>
                  )}
                </div>

                {onAccept && (
                  <button
                    onClick={() => handleAccept(q.id)}
                    disabled={isRfqClosed || acceptingId !== null}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 transition-all duration-300 select-none ${
                      isAccepted
                        ? 'bg-primary/20 border border-primary/40 text-primary'
                        : isRfqClosed
                        ? 'bg-card-border border border-white/[0.04] text-gray-600 cursor-not-allowed'
                        : 'bg-primary text-black hover:shadow-neon-cyan hover:-translate-y-0.5 active:scale-95'
                    }`}
                  >
                    {acceptingId === q.id ? (
                      <>
                         <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                         SECURING ESCROW
                      </>
                    ) : isAccepted ? (
                      <>
                         <Check className="w-3.5 h-3.5" />
                         ESCROW LOCKED
                      </>
                    ) : (
                      'ACCEPT QUOTE'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
