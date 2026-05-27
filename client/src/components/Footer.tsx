import React, { useState } from 'react';
import { Globe, MessageCircle, Users, MonitorPlay, Link2, ArrowRight, CreditCard, Wallet, Banknote, Landmark, CircleDollarSign, Bitcoin, Smartphone, Coins, Gem, Apple } from 'lucide-react';

const Footer: React.FC = () => {
  const [showCredits, setShowCredits] = useState<boolean>(false);

  const paymentMethods = [
    {
      element: (
        <div className="flex items-center font-sans">
          <span className="text-blue-500 font-bold text-3xl">G</span>
          <span className="text-white font-semibold text-3xl">Pay</span>
        </div>
      )
    },
    {
      element: (
        <div className="flex items-center gap-1">
          <Apple className="w-8 h-8 text-white fill-white mb-1" />
          <span className="text-white font-bold text-3xl">Pay</span>
        </div>
      )
    },
    {
      element: (
        <span className="text-primary font-black tracking-widest text-3xl uppercase">ABABIL PAY</span>
      )
    },
    {
      element: (
        <span className="text-blue-500 font-black italic text-4xl tracking-tighter uppercase">VISA</span>
      )
    },
    {
      element: (
        <div className="flex items-center relative w-16 h-10">
          <div className="absolute left-0 w-10 h-10 bg-[#eb001b] rounded-full mix-blend-screen opacity-90"></div>
          <div className="absolute right-0 w-10 h-10 bg-[#f79e1b] rounded-full mix-blend-screen opacity-90"></div>
        </div>
      )
    },
    {
      element: (
        <div className="border-2 border-blue-400 rounded-sm px-2 py-0.5">
          <span className="text-blue-400 font-bold text-2xl tracking-wider">AMEX</span>
        </div>
      )
    },
    {
      element: (
        <div className="flex items-center font-bold text-3xl">
          <span className="text-red-500">Union</span>
          <span className="text-blue-500">Pay</span>
        </div>
      )
    },
    {
      element: (
        <div className="flex items-center gap-2">
          <Wallet className="w-8 h-8 text-purple-400" />
          <span className="text-white font-bold text-2xl tracking-tight">Web3 Wallet</span>
        </div>
      )
    }
  ];

  // Duplicate for seamless marquee
  const marqueeItems = [...paymentMethods, ...paymentMethods, ...paymentMethods, ...paymentMethods];

  return (
    <footer className="bg-black mt-auto relative overflow-hidden flex flex-col">

      {/* CSS for Marquee */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Top Marquee Tape (Slanted) */}
      <div className="relative h-20 bg-black overflow-hidden flex items-center justify-center mt-8 z-20">
        <div className="absolute w-[110%] bg-[#0a0a0a] border-y border-white/10 py-3 -rotate-2 transform-gpu origin-center shadow-2xl flex overflow-hidden">
          <div className="flex animate-scroll whitespace-nowrap w-max">
            {marqueeItems.map((item, i) => (
              <div key={i} className="flex items-center">
                <div className="mx-12 drop-shadow-lg opacity-90 hover:opacity-100 transition-opacity">
                  {item.element}
                </div>
                <span className="text-gray-700 text-2xl mx-2">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Links Grid */}
      <div className="max-w-[1400px] mx-auto w-full pt-20 pb-16 px-6 relative z-10">

        {/* We use 5 columns like before, but stylized cleaner */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">

          {/* Column 1 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase text-primary mb-2">Get support</h3>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Help Center <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Live chat <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Check order status <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Refunds <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Report abuse <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase text-primary mb-2">Protections</h3>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Safe crypto payments <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Smart contract Escrow <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Money-back guarantee <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              After-sales support <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase text-primary mb-2">Source</h3>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Request Quotation <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Membership <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Wholesale <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Ababil Reads <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
          </div>

          {/* Column 4 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase text-primary mb-2">Sell</h3>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Start selling <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Seller Central <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Verified Supplier <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Partnerships <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
          </div>

          {/* Column 5 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase text-primary mb-2">Company</h3>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              About Us <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Responsibility <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              News center <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
              Careers <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </a>
          </div>

          {/* Column 6: Social & Brand (Aligned to the right like the screenshot) */}
          <div className="flex flex-col items-center lg:items-end gap-6 col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex flex-col items-center lg:items-end">
              <h4 className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Stay Social</h4>
              <div className="flex items-center gap-2">
                <a href="#" className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-primary transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-primary transition-colors">
                  <MonitorPlay className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-primary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end mt-4">
              <h4 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Proudly Founded By</h4>
              <div className="flex items-center gap-2 text-white">
                {/* Abstract Logo icon */}
                <svg viewBox="0 0 50 20" className="w-8 h-4 fill-white">
                  <path d="M0,20 Q10,0 20,20 Z M25,20 Q35,0 45,20 Z" />
                </svg>
                <span className="text-2xl font-black tracking-tight">ABABIL<span className="text-primary text-xs ml-1 relative -top-3">DEV</span></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Torn Paper Separator (White jagged edge) */}
      <div className="relative h-8 w-full z-20">
        <svg viewBox="0 0 1200 30" preserveAspectRatio="none" className="absolute bottom-0 w-full h-8 block fill-[#111]">
          {/* Generates a jagged torn paper effect */}
          <path d="M0,30 L1200,30 L1200,15 C1180,5 1160,25 1140,15 C1120,5 1100,20 1080,10 C1060,25 1040,5 1020,15 C1000,5 980,20 960,10 C940,25 920,5 900,15 C880,5 860,25 840,10 C820,20 800,5 780,15 C760,25 740,5 720,15 C700,5 680,25 660,10 C640,20 620,5 600,15 C580,25 560,5 540,15 C520,5 500,25 480,10 C460,20 440,5 420,15 C400,25 380,5 360,15 C340,5 320,25 300,10 C280,20 260,5 240,15 C220,25 200,5 180,15 C160,5 140,25 120,10 C100,20 80,5 60,15 C40,25 20,5 0,15 Z" />
        </svg>
        {/* Adds a slight white outline stroke to emphasize the tear like the screenshot */}
        <svg viewBox="0 0 1200 30" preserveAspectRatio="none" className="absolute bottom-0 w-full h-8 block fill-transparent stroke-white stroke-[2px] opacity-20 pointer-events-none">
          <path d="M0,30 L1200,30 L1200,15 C1180,5 1160,25 1140,15 C1120,5 1100,20 1080,10 C1060,25 1040,5 1020,15 C1000,5 980,20 960,10 C940,25 920,5 900,15 C880,5 860,25 840,10 C820,20 800,5 780,15 C760,25 740,5 720,15 C700,5 680,25 660,10 C640,20 620,5 600,15 C580,25 560,5 540,15 C520,5 500,25 480,10 C460,20 440,5 420,15 C400,25 380,5 360,15 C340,5 320,25 300,10 C280,20 260,5 240,15 C220,25 200,5 180,15 C160,5 140,25 120,10 C100,20 80,5 60,15 C40,25 20,5 0,15 Z" />
        </svg>
      </div>

      {/* Bottom Bar (Darker Gray background like screenshot) */}
      <div className="bg-[#111] py-8 px-6 relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo / Brand Name */}
          <div className="text-3xl font-black text-white tracking-widest" >
            ABABIL<span className="text-primary">.</span>
          </div>

          {/* Legal Links & Credits */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
            <span>© 2026 Ababil.</span>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms & Conditions</a>

            {/* Toggle & Credits */}
            <div className="flex items-center gap-3 ml-4 border-l border-white/20 pl-4">
              <div className="relative flex items-center">
                <button
                  onClick={() => setShowCredits(!showCredits)}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none ${showCredits ? 'bg-primary shadow-[0_0_10px_#00ffff]' : 'bg-white/20'}`}
                  aria-label="Toggle Credits"
                >
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black transition-transform duration-300 ${showCredits ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span
                  className={`ml-3 text-sm font-medium transition-all duration-300 ${showCredits
                    ? 'opacity-100 text-primary translate-x-0'
                    : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}
                >
                  Designed by Nahian Nahin
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
