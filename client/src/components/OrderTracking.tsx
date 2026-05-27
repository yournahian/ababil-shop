import React from 'react';
import { CheckCircle, Clock, Package, Truck, ShieldCheck, Flag } from 'lucide-react';

const steps = [
  { id: 1, label: 'Order Placed', date: 'Oct 24, 2026, 10:23 AM', status: 'completed', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 2, label: 'Smart Contract Escrow Locked', date: 'Oct 24, 2026, 10:25 AM', status: 'completed', icon: <ShieldCheck className="w-5 h-5" />, tx: '0x3a4...8f9c' },
  { id: 3, label: 'Shipped', date: 'Oct 25, 2026, 08:14 AM', status: 'completed', icon: <Package className="w-5 h-5" /> },
  { id: 4, label: 'Customs Cleared', date: 'Oct 27, 2026, 02:45 PM', status: 'completed', icon: <Flag className="w-5 h-5" /> },
  { id: 5, label: 'Out for Delivery', date: 'Expected today', status: 'active', icon: <Truck className="w-5 h-5" /> },
  { id: 6, label: 'Funds Released', date: 'Pending delivery confirmation', status: 'upcoming', icon: <Clock className="w-5 h-5" /> },
];

export const OrderTracking: React.FC = () => {
  return (
    <div className="bg-card/30 rounded-2xl border border-white/5 p-8 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Order #AB-99214</h3>
          <p className="text-sm text-gray-400 mt-1">Neon Synchronizer (2 units)</p>
        </div>
        <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-primary text-xs font-semibold">
          In Transit
        </div>
      </div>

      <div className="relative border-l border-white/10 ml-4 space-y-8">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          
          return (
            <div key={step.id} className="relative pl-8">
              {/* Timeline dot */}
              <div 
                className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#0a0a0a] ${
                  isCompleted ? 'bg-primary text-black' : 
                  isActive ? 'bg-blue-500 text-white animate-pulse' : 
                  'bg-gray-800 text-gray-500'
                }`}
              >
                {step.icon}
              </div>

              <div>
                <h4 className={`text-base font-bold ${isActive ? 'text-blue-400' : isCompleted ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                </h4>
                <p className="text-sm text-gray-400 mt-1">{step.date}</p>
                {step.tx && (
                  <p className="text-xs font-mono text-primary mt-1 opacity-80">
                    Tx Hash: {step.tx}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
        <button className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors text-sm">
          View Receipt
        </button>
        <button className="flex-1 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-medium hover:bg-primary/20 transition-colors text-sm">
          Confirm Delivery
        </button>
      </div>
    </div>
  );
};
