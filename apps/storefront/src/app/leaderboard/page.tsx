import React from 'react';
import Link from 'next/link';
import { Star, Trophy, Award, Medal, ShieldAlert } from 'lucide-react';
import { createAdminClient } from '@ababil/supabase';

export const revalidate = 60; // Refresh leaderboard cache every minute

const MOCK_TOP_USERS = [
  { rank: 1, full_name: 'Ababil Admin', username: 'admin_ababil', level: 8, xp: 5000, role: 'admin' },
  { rank: 2, full_name: 'CyberCore Tech', username: 'cybercore_shop', level: 6, xp: 2500, role: 'vendor' },
  { rank: 3, full_name: 'Neon Threads', username: 'neonthreads_wear', level: 4, xp: 1500, role: 'vendor' },
  { rank: 4, full_name: 'Alex Buyer', username: 'alex_buyer', level: 3, xp: 450, role: 'customer' }
];

const MOCK_TOP_VENDORS = [
  { rank: 1, name: 'CyberCore Tech', slug: 'cybercore-tech', level: 6, xp: 2500, rating: 5.0 },
  { rank: 2, name: 'Neon Threads', slug: 'neon-threads', level: 4, xp: 1500, rating: 4.8 }
];

export default async function LeaderboardPage() {
  let topUsers = MOCK_TOP_USERS;
  let topVendors = MOCK_TOP_VENDORS;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);

      // Fetch top users
      const { data: usersData } = await adminSupabase
        .from('profiles')
        .select('full_name, username, level, xp, role')
        .order('xp', { ascending: false })
        .limit(20);

      if (usersData && usersData.length > 0) {
        topUsers = usersData.map((u, idx) => ({
          rank: idx + 1,
          full_name: u.full_name,
          username: u.username,
          level: u.level,
          xp: u.xp,
          role: u.role
        }));
      }

      // Fetch top vendors
      const { data: vendorsData } = await adminSupabase
        .from('vendors')
        .select('name, slug, level, xp, rating')
        .order('xp', { ascending: false })
        .limit(20);

      if (vendorsData && vendorsData.length > 0) {
        topVendors = vendorsData.map((v, idx) => ({
          rank: idx + 1,
          name: v.name,
          slug: v.slug,
          level: v.level,
          xp: v.xp,
          rating: parseFloat(v.rating)
        }));
      }
    }
  } catch (err) {
    console.error("Failed to query live leaderboard data:", err);
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400 animate-bounce" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-[10px] text-gray-500 font-mono">#{rank}</span>;
  };

  return (
    <div className="py-6 space-y-12">
      {/* Page Title */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <span className="font-mono text-[10px] text-primary tracking-widest uppercase block">[ LEADERBOARD ]</span>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">THE LEADERBOARD XP RANKS</h1>
        <p className="text-xs text-gray-400 leading-relaxed font-sans">
          Top-ranked shoppers and vendors. Buy assets, review listings, fulfill orders, and climb through the prestige ranks of the Ababil economy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* SHOPPERS COLUMN */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono border-b border-card-border pb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> [ TOP LEADERBOARD SHOPPERS ]
          </h2>

          <div className="space-y-3">
            {topUsers.map((user) => (
              <div
                key={user.rank}
                className={`bg-card border border-card-border p-4 rounded-xl flex items-center justify-between hover:border-primary/30 transition-all duration-300 ${
                  user.rank === 1 ? 'border-primary/40 bg-gradient-to-r from-primary/5 to-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getRankBadge(user.rank)}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white uppercase">
                      {user.full_name || 'ANONYMOUS USER'}
                    </span>
                    <span className="block text-[9px] font-mono text-gray-500">
                      @{user.username || 'unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-right">
                  <div>
                    <span className="block text-[8px] text-gray-500 leading-none">LEVEL</span>
                    <span className="text-xs font-bold text-white">LVL {user.level}</span>
                  </div>
                  <div className="min-w-[60px]">
                    <span className="block text-[8px] text-gray-500 leading-none">XP</span>
                    <span className="text-xs font-bold text-primary">{user.xp} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VENDORS COLUMN */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono border-b border-card-border pb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-secondary" /> [ TOP PROTOCOL VENDORS ]
          </h2>

          <div className="space-y-3">
            {topVendors.map((vendor) => (
              <div
                key={vendor.rank}
                className={`bg-card border border-card-border p-4 rounded-xl flex items-center justify-between hover:border-secondary/30 transition-all duration-300 ${
                  vendor.rank === 1 ? 'border-secondary/40 bg-gradient-to-r from-secondary/5 to-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getRankBadge(vendor.rank)}
                  </div>
                  <div>
                    <Link href={`/vendor/${vendor.slug}`} className="block text-xs font-bold text-white uppercase hover:text-secondary">
                      {vendor.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[9px] text-yellow-400 mt-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{vendor.rating.toFixed(1)} RATING</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-right">
                  <div>
                    <span className="block text-[8px] text-gray-500 leading-none">LEVEL</span>
                    <span className="text-xs font-bold text-white">LVL {vendor.level}</span>
                  </div>
                  <div className="min-w-[60px]">
                    <span className="block text-[8px] text-gray-500 leading-none">XP</span>
                    <span className="text-xs font-bold text-secondary">{vendor.xp} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
