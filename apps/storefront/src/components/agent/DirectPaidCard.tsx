import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronRight, ExternalLink } from 'lucide-react';

interface DirectPaidCardProps {
  orderId: string;
  amount: number;
  txHash?: string;
  message?: string;
}

export default function DirectPaidCard({
  orderId,
  amount,
  txHash,
  message,
}: DirectPaidCardProps) {
  const explorerUrl = txHash 
    ? `https://sepolia.basescan.org/tx/${txHash}`
    : `https://sepolia.basescan.org`;

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-5 my-2 w-full space-y-4 shadow-[0_0_25px_rgba(0,255,255,0.08)] relative overflow-hidden">
      {/* Cybersecurity scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none h-1/2 animate-pulse" />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center text-primary shadow-neon-cyan animate-pulse">
          <ShieldCheck className="w-4.5 h-4.5" />
        </div>

        <div>
          <span className="text-[8px] text-primary font-mono tracking-widest uppercase block">[ DIRECT PROTOCOL SETTLED ]</span>
          <h4 className="text-xs font-bold text-white uppercase mt-0.5">DIRECT PAYMENT CONFIRMED</h4>
        </div>
      </div>

      <div className="bg-black/40 border border-card-border p-4 rounded-xl space-y-2 text-[10px] font-mono">
        <div className="flex justify-between">
          <span className="text-gray-500">PAYMENT STATUS:</span>
          <span className="text-primary font-bold uppercase tracking-wider">✓ PAID</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">AMOUNT PAID TO SELLER:</span>
          <span className="text-white font-extrabold">{amount.toFixed(2)} USDC</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">ORDER REGISTRY ID:</span>
          <span className="text-gray-400">#{orderId.slice(0, 12)}...</span>
        </div>

        {txHash && (
          <div className="flex justify-between break-all">
            <span className="text-gray-500">TX HASH:</span>
            <span className="text-primary-light font-bold truncate max-w-[150px]">{txHash.slice(0, 10)}...</span>
          </div>
        )}
        
        <div className="flex justify-between border-t border-white/[0.04] pt-2 mt-2">
          <span className="text-gray-500">SETTLEMENT ENGINE:</span>
          <span className="text-primary-light font-bold">ABABILPAY (BASE SEPOLIA)</span>
        </div>
      </div>

      {message && (
        <p className="text-[10px] text-gray-300 font-sans leading-relaxed">
          {message}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Link
          href={`/orders/${orderId}`}
          className="flex-grow py-2.5 bg-primary text-black text-[10px] font-black tracking-wider uppercase rounded-xl hover:shadow-neon-cyan transition-all duration-300 flex items-center justify-center gap-1.5"
        >
          TRACK DRONE COURIER
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-card hover:bg-card-hover border border-card-border hover:border-primary/20 text-gray-300 hover:text-white text-[10px] font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5"
        >
          VIEW ON BASESCAN
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
