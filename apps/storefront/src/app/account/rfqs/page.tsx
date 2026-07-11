'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, ChevronDown, ChevronUp, DollarSign, Calendar, Users, 
  Lock, RefreshCw, CheckCircle2, AlertTriangle, Play 
} from 'lucide-react';
import { RFQ, VendorQuote } from '@ababil/types';
import { supabase } from '../../../lib/supabase';

export default function BuyerRfqsPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);
  const [rfqDetails, setRfqDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch all RFQs for the logged-in buyer
  const fetchRfqs = async () => {
    try {
      const res = await fetch('/api/agent/rfq');
      const data = await res.json();
      if (data.success && data.rfqs) {
        setRfqs(data.rfqs);
      }
    } catch (err) {
      console.error('Failed to load RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  // Fetch detailed RFQ (including quotes) on expand
  const handleToggleExpand = async (rfqId: string) => {
    if (expandedRfqId === rfqId) {
      setExpandedRfqId(null);
      return;
    }

    setExpandedRfqId(rfqId);

    // If detail is already cached, don't refetch unless needed
    if (rfqDetails[rfqId]) return;

    setLoadingDetailId(rfqId);
    try {
      const res = await fetch(`/api/agent/rfq/${rfqId}`);
      const data = await res.json();
      if (data.success && data.rfq) {
        setRfqDetails((prev) => ({ ...prev, [rfqId]: data.rfq }));
      }
    } catch (err) {
      console.error('Failed to load RFQ detail:', err);
    } finally {
      setLoadingDetailId(null);
    }
  };

  // Quote Acceptance handler
  const handleAcceptQuote = async (rfqId: string, quoteId: string) => {
    setAcceptingQuoteId(quoteId);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/agent/rfq/${rfqId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Quote accepted! Escrow locked for order #${data.orderId.slice(0, 8)}. Drone dispatch simulation active.`);
        // Refetch listing to get updated statuses
        await fetchRfqs();
        
        // Force refetch detailed RFQ to show updated quote status
        const detailRes = await fetch(`/api/agent/rfq/${rfqId}`);
        const detailData = await detailRes.json();
        if (detailData.success) {
          setRfqDetails((prev) => ({ ...prev, [rfqId]: detailData.rfq }));
        }
      } else {
        alert(data.error || 'Failed to accept quote.');
      }
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert('Network error during quote acceptance.');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 border border-blue-500/30 text-blue-400';
      case 'quoted':
        return 'bg-purple-500/10 border border-purple-500/30 text-purple-400';
      case 'accepted':
        return 'bg-primary/10 border border-primary/30 text-primary shadow-neon-cyan';
      case 'fulfilled':
        return 'bg-green-500/10 border border-green-500/30 text-green-400';
      default:
        return 'bg-gray-500/10 border border-white/10 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ SEARCHING PROCUREMENT LEDGER INDEX... ]
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8 max-w-5xl mx-auto font-mono text-xs text-white">
      {/* Title */}
      <div className="space-y-2">
        <span className="text-[10px] text-primary tracking-widest uppercase block">[ PROCUREMENT DIRECTORY ]</span>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">MY RFQS</h1>
      </div>

      {successMsg && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl text-primary flex items-start gap-2 shadow-neon-cyan animate-in fade-in duration-300">
          <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* RFQ List */}
      {rfqs.length === 0 ? (
        <div className="bg-card/20 border border-dashed border-card-border rounded-3xl p-16 text-center space-y-6">
          <FileText className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
          <p className="text-gray-400">NO RFQS DETECTED ON THIS ACCOUNT LEDGER.</p>
          <Link
            href="/agent"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-black tracking-wider rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300"
          >
            CREATE RFQ WITH AI COPILOT
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rfqs.map((rfq) => {
            const isExpanded = expandedRfqId === rfq.id;
            const details = rfqDetails[rfq.id];

            return (
              <div
                key={rfq.id}
                className="bg-card border border-card-border rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Header Row */}
                <div
                  onClick={() => handleToggleExpand(rfq.id)}
                  className="p-5 hover:bg-card-hover cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white uppercase">{rfq.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusStyle(rfq.status)}`}>
                        {rfq.status}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase">({rfq.rfqType})</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-sans">
                      Created on {new Date(rfq.createdAt).toLocaleDateString()} • Category: {rfq.category}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-[10px] font-mono">
                    <div>
                      <span className="block text-[8px] text-gray-500 uppercase leading-none">BUDGET</span>
                      <span className="text-white font-bold">{rfq.budgetUsdc.toFixed(2)} USDC</span>
                    </div>

                    <div>
                      <span className="block text-[8px] text-gray-500 uppercase leading-none">OFFERS</span>
                      <span className="text-primary font-bold">{rfq.quoteCount} RECEIVED</span>
                    </div>

                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] bg-black/30 p-6 space-y-6">
                    {/* Description block */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">[ DESCRIPTION ]</h4>
                      <p className="text-xs text-gray-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {rfq.description}
                      </p>
                    </div>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px] bg-card/40 border border-card-border p-4 rounded-xl">
                      <div>
                        <span className="text-gray-500 uppercase block">Preferred Location:</span>
                        <span className="text-white font-bold">{rfq.location || 'Anywhere'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase block">Procurement Category:</span>
                        <span className="text-white font-bold">{rfq.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase block">Delivery Deadline:</span>
                        <span className="text-white font-bold">
                          {rfq.deliveryDeadline ? new Date(rfq.deliveryDeadline).toLocaleDateString() : 'Flexible'}
                        </span>
                      </div>
                    </div>

                    {/* Quotes section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">[ RECEIVED PROPOSAL METRIC ]</h4>

                      {loadingDetailId === rfq.id ? (
                        <div className="py-6 text-center text-gray-500 animate-pulse">
                          [ LOADING INCOMING PROPOSALS... ]
                        </div>
                      ) : !details || details.quotes.length === 0 ? (
                        <div className="p-4 bg-card/20 border border-dashed border-card-border rounded-xl text-center text-gray-500">
                          Awaiting quotes from suppliers.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {details.quotes.map((quote: any) => {
                            const isQuoteAccepted = quote.status === 'accepted';
                            const isRfqClosed = rfq.status === 'accepted' || rfq.status === 'fulfilled';

                            return (
                              <div
                                key={quote.id}
                                className={`border rounded-xl p-4 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                  isQuoteAccepted
                                    ? 'border-primary bg-primary/5 shadow-neon-cyan'
                                    : 'border-card-border bg-black/40'
                                }`}
                              >
                                <div className="space-y-1.5 flex-grow">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white uppercase">{quote.vendorName}</span>
                                    {quote.autoGenerated && (
                                      <span className="bg-secondary/10 border border-secondary/20 text-secondary text-[7px] font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                                        AUTO
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-gray-500">
                                    <div>
                                      RATING: <span className="text-white font-bold">{quote.vendorRating.toFixed(1)}/5</span>
                                    </div>
                                    <div>
                                      LEAD TIME: <span className="text-white font-bold">{quote.deliveryDays} DAYS</span>
                                    </div>
                                    <div>
                                      UNIT PRICE: <span className="text-white font-bold">{quote.unitPriceUsdc.toFixed(2)} USDC</span>
                                    </div>
                                  </div>

                                  {quote.notes && (
                                    <p className="text-[10px] text-gray-400 font-sans italic">
                                      &ldquo;{quote.notes}&rdquo;
                                    </p>
                                  )}
                                </div>

                                <div className="flex md:flex-col items-end justify-between md:justify-center gap-4 w-full md:w-auto border-t md:border-t-0 border-white/[0.04] pt-3 md:pt-0">
                                  <div className="text-left md:text-right">
                                    <span className="block text-[7px] text-gray-500 uppercase leading-none">TOTAL AMOUNT</span>
                                    <span className="text-sm font-extrabold text-glow-cyan text-primary">
                                      {quote.totalPriceUsdc.toFixed(2)} USDC
                                    </span>
                                  </div>

                                  {isQuoteAccepted && quote.orderId ? (
                                    <div className="flex flex-wrap gap-2">
                                      <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black rounded-lg uppercase flex items-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        ESCROW LOCKED
                                      </span>
                                      <Link
                                        href={`/orders/${quote.orderId}`}
                                        className="px-3 py-1 bg-secondary text-black text-[8px] font-black rounded-lg uppercase flex items-center gap-1 hover:shadow-neon-pink transition-all"
                                      >
                                        TRACK DRONE
                                      </Link>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAcceptQuote(rfq.id, quote.id)}
                                      disabled={isRfqClosed || acceptingQuoteId !== null}
                                      className={`px-4 py-2 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all duration-300 ${
                                        isRfqClosed
                                          ? 'bg-card-border border border-white/[0.04] text-gray-600 cursor-not-allowed'
                                          : 'bg-primary text-black hover:shadow-neon-cyan active:scale-95'
                                      }`}
                                    >
                                      {acceptingQuoteId === quote.id ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        'ACCEPT PROPOSAL'
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
