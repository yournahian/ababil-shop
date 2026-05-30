'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, X } from 'lucide-react';
import { useAuthStore } from '../lib/store';

export default function AuthModal() {
  const router = useRouter();
  const { authModalOpen, redirectUrl, closeAuthModal } = useAuthStore();

  if (!authModalOpen) return null;

  const handleLoginRedirect = () => {
    closeAuthModal();
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={closeAuthModal} 
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Modal Container */}
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] max-w-md w-full p-8 space-y-6 relative overflow-hidden font-mono shadow-[0_20px_50px_rgba(0,255,255,0.15)] animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />
        
        {/* Close button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-500 hover:text-white rounded-lg p-1.5 hover:bg-white/5 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon Block */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,255,255,0.2)] mx-auto">
          <Lock className="w-6 h-6 animate-pulse" />
        </div>

        <div className="text-center space-y-2">
          <span className="text-[10px] text-primary tracking-widest uppercase block font-bold">
            [ SECURE LINK REQUIRED ]
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight leading-relaxed">
            CONNECTION TIMEOUT
          </h2>
          <p className="text-[11px] text-gray-400 font-sans leading-relaxed pt-1">
            To load assets into your shopping ledger and proceed to Base Sepolia clearance, please establish a secure profile signature connection.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleLoginRedirect}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary-dark text-black font-extrabold text-xs tracking-wider uppercase rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            ESTABLISH SECURE LINK
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={closeAuthModal}
            className="w-full h-12 bg-card border border-card-border hover:border-white/20 text-gray-400 hover:text-white font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all"
          >
            [ ABORT ACCESS PROTOCOL ]
          </button>
        </div>
      </div>
    </div>
  );
}
