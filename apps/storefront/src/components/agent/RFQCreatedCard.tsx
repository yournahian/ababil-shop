import React from 'react';
import { FileText, Send, Calendar, Users, DollarSign } from 'lucide-react';

interface RFQCreatedCardProps {
  rfq: {
    id: string;
    title: string;
    category: string;
    rfqType: string;
    quantity: number;
    budgetUsdc: number;
    status: string;
    deliveryDeadline?: string | null;
    location?: string | null;
  };
  vendorsNotified: number;
  message?: string;
}

export default function RFQCreatedCard({ rfq, vendorsNotified, message }: RFQCreatedCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 my-2 w-full space-y-4 shadow-neon-cyan">
      {/* Title block */}
      <div className="flex items-start justify-between border-b border-white/[0.04] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[8px] text-primary font-mono tracking-widest uppercase block">[ RFQ RECORDED ]</span>
            <h4 className="text-xs font-bold text-white uppercase mt-0.5">{rfq.title}</h4>
          </div>
        </div>

        <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded text-[8px] font-bold font-mono uppercase">
          {rfq.status}
        </span>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono">
        <div className="space-y-0.5">
          <span className="text-[8px] text-gray-500 uppercase leading-none block">Category</span>
          <span className="text-white font-bold">{rfq.category}</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[8px] text-gray-500 uppercase leading-none block">Quantity</span>
          <span className="text-white font-bold">{rfq.quantity} {rfq.rfqType === 'service' ? 'hours/deliv' : 'units'}</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[8px] text-gray-500 uppercase leading-none block">Max Budget</span>
          <span className="text-white font-bold flex items-center">
            <DollarSign className="w-3.5 h-3.5 text-gray-600 -ml-1" />
            {rfq.budgetUsdc.toFixed(2)} USDC
          </span>
        </div>

        {rfq.location && (
          <div className="space-y-0.5">
            <span className="text-[8px] text-gray-500 uppercase leading-none block">Location Pref</span>
            <span className="text-white font-bold">{rfq.location}</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.04] text-[9px] font-mono text-gray-400">
        {rfq.deliveryDeadline ? (
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>Deadline: {new Date(rfq.deliveryDeadline).toLocaleDateString()}</span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1 text-primary">
          <Users className="w-3.5 h-3.5" />
          <span>{vendorsNotified} matching vendor(s) notified</span>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-black/40 border border-card-border rounded-xl text-[10px] text-gray-400 font-sans leading-relaxed">
          {message}
        </div>
      )}
    </div>
  );
}
