'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-card-border bg-background py-12 relative overflow-hidden mt-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-neon-cyan">
              <span className="text-black font-black text-xl tracking-tighter">A</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              ABABIL<span className="text-secondary">.</span>SHOP
            </span>
          </Link>
          <p className="mt-4 text-xs text-gray-400 max-w-sm leading-relaxed font-sans">
            A production-grade Web3 gamified multi-vendor e-commerce marketplace powered by AbabilPay and Base network. Pay securely in USDC and level up your shopping XP.
          </p>
        </div>

        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary mb-4">[ EXPLORE ]</h4>
          <ul className="space-y-2 text-xs font-mono text-gray-400">
            <li>
              <Link href="/shop" className="hover:text-primary transition-colors">
                Marketplace
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="hover:text-primary transition-colors">
                Leaderboards
              </Link>
            </li>
            <li>
              <Link href="/vendor/onboard" className="hover:text-primary transition-colors">
                Become a Vendor
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-secondary mb-4">[ DOCUMENTATION ]</h4>
          <ul className="space-y-2 text-xs font-mono text-gray-400">
            <li>
              <Link href="https://docs.ababilpay.xyz" target="_blank" className="hover:text-primary transition-colors">
                AbabilPay Docs
              </Link>
            </li>
            <li>
              <Link href="https://base.org" target="_blank" className="hover:text-primary transition-colors">
                Base Network
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-primary transition-colors">
                Terms & Security
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-card-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-gray-500">
        <span>© 2026 ABABIL.SHOP. ALL RIGHTS RESERVED.</span>
        <span className="mt-2 sm:mt-0 text-primary/70">SECURED BY ABABILPAY HYBRID SETTLEMENT protocol</span>
      </div>
    </footer>
  );
}
