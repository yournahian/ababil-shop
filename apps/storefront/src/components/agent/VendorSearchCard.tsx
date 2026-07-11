import React from 'react';
import { Star, ShieldCheck, Clock, Award, Compass } from 'lucide-react';

interface VendorSearchCardProps {
  vendors: any[];
  found: boolean;
  category?: string;
  location?: string | null;
  message?: string;
}

export default function VendorSearchCard({
  vendors,
  found,
  category,
  location,
  message,
}: VendorSearchCardProps) {
  if (!found || vendors.length === 0) {
    return (
      <div className="p-4 bg-card/60 border border-card-border rounded-2xl text-xs text-gray-400 font-mono">
        {message || `No suppliers found in category "${category}"${location ? ` in ${location}` : ''}.`}
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full my-2">
      {message && (
        <p className="text-xs text-gray-300 font-sans">{message}</p>
      )}
      <div className="space-y-3">
        {vendors.map((v) => (
          <div
            key={v.id}
            className="bg-card hover:bg-card-hover border border-card-border hover:border-primary/20 rounded-2xl p-4 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
          >
            {/* Vendor Profile Info */}
            <div className="flex items-center gap-3">
              {v.logoUrl ? (
                <img
                  src={v.logoUrl}
                  alt={v.name}
                  className="w-12 h-12 rounded-xl object-cover border border-card-border group-hover:border-primary/20 transition-all duration-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-black/40 border border-card-border flex items-center justify-center font-mono font-bold text-gray-600 text-sm group-hover:border-primary/20 transition-colors">
                  {v.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white uppercase group-hover:text-primary transition-colors">
                    {v.name}
                  </h4>
                  {v.verified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" title="Verified Vendor" />
                  )}
                </div>
                {v.description && (
                  <p className="text-[10px] text-gray-400 font-sans line-clamp-1 leading-relaxed max-w-sm">
                    {v.description}
                  </p>
                )}
                {v.preferredDeliveryDays && (
                  <span className="inline-block text-[8px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-mono mt-1">
                    EST. {v.preferredDeliveryDays} DAYS DELIVERY
                  </span>
                )}
              </div>
            </div>

            {/* Score & Telemetry Metrics */}
            <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-gray-400 border-t md:border-t-0 border-white/[0.04] pt-3 md:pt-0 w-full md:w-auto">
              {/* Composite Search Score */}
              <div className="bg-black/30 border border-card-border p-2 rounded-xl text-center min-w-[55px]">
                <span className="block text-[7px] text-gray-500 uppercase leading-none">RANK</span>
                <span className="text-xs font-extrabold text-glow-cyan text-primary">
                  {v.searchScore ? v.searchScore.toFixed(0) : '0'}
                </span>
              </div>

              {/* Rating */}
              <div>
                <span className="block text-[7px] text-gray-500 uppercase leading-none">RATING</span>
                <div className="flex items-center gap-0.5 text-white font-bold mt-1">
                  <Star className="w-2.5 h-2.5 fill-current text-secondary" />
                  <span>{v.rating.toFixed(1)}/5</span>
                </div>
              </div>

              {/* Completed orders */}
              <div>
                <span className="block text-[7px] text-gray-500 uppercase leading-none">COMPLETED</span>
                <span className="text-white font-bold mt-1 block">
                  {v.completedOrders} ORDERS
                </span>
              </div>

              {/* Delivery success */}
              <div>
                <span className="block text-[7px] text-gray-500 uppercase leading-none">SUCCESS</span>
                <span className="text-white font-bold mt-1 block">
                  {Math.round(v.deliverySuccessRate * 100)}%
                </span>
              </div>

              {/* Response Time */}
              {v.avgResponseHours !== null && (
                <div>
                  <span className="block text-[7px] text-gray-500 uppercase leading-none">RESPONSE</span>
                  <div className="flex items-center gap-0.5 text-white font-bold mt-1">
                    <Clock className="w-2.5 h-2.5 text-gray-500" />
                    <span>{v.avgResponseHours.toFixed(1)}h</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
