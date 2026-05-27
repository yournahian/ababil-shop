import React from 'react';
import { Star, CheckCircle, Image as ImageIcon } from 'lucide-react';

export const ReviewSection: React.FC = () => {
  return (
    <div className="mt-24 border-t border-white/10 pt-16">
      <h2 className="text-3xl font-bold mb-10 text-white tracking-tight">
        Customer <span className="text-primary">Reviews</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Rating Breakdown */}
        <div className="md:col-span-4 bg-black/40 p-8 rounded-2xl border border-white/5 h-fit">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-5xl font-bold text-white">4.8</h3>
            <div>
              <div className="flex text-primary mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-400">Based on 124 reviews</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { stars: 5, pct: 85 },
              { stars: 4, pct: 10 },
              { stars: 3, pct: 3 },
              { stars: 2, pct: 1 },
              { stars: 1, pct: 1 },
            ].map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-sm text-gray-400">
                <span className="w-12 text-right">{row.stars} Stars</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${row.pct}%` }}
                  ></div>
                </div>
                <span className="w-8">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List & Customer Images */}
        <div className="md:col-span-8">
          <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Customer Images
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-32 h-32 rounded-xl bg-gray-800 border border-white/10 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200&sig=${i}`} 
                  alt="Customer upload" 
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="space-y-8">
            {/* Mock Review 1 */}
            <div className="border-b border-white/5 pb-8">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white">0x7F...3B9A</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Ababil Verified Purchase
                    </span>
                  </div>
                  <div className="flex text-primary w-4 h-4">
                    <Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" />
                  </div>
                </div>
                <span className="text-sm text-gray-500">2 days ago</span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-3">
                Absolutely incredible quality. The smart contract executed flawlessly and shipping was tracked on-chain. Highly recommend this seller!
              </p>
              <div className="text-xs text-gray-500 font-mono">
                Tx: 0x9a8f...b21c
              </div>
            </div>

            {/* Mock Review 2 */}
            <div className="border-b border-white/5 pb-8">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white">0x12...F9A1</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Ababil Verified Purchase
                    </span>
                  </div>
                  <div className="flex text-primary w-4 h-4">
                    <Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" />
                  </div>
                </div>
                <span className="text-sm text-gray-500">1 week ago</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Great product, matched the description perfectly. The wholesale pricing tiers saved my business a lot of capital. Will buy again in bulk.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
