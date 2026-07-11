'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/store';
import { supabase } from '../../../lib/supabase';
import { Shield, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function TelegramAuthContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const { profile, setProfile, openAuthModal } = useAuthStore();
  const [status, setStatus] = useState<'idle' | 'linking' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId || !profile) return;

    const linkAccount = async () => {
      setStatus('linking');
      setErrorMsg(null);

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ telegram_chat_id: String(chatId) })
          .eq('id', profile.id);

        if (error) {
          throw error;
        }

        // Update local auth store state
        setProfile({
          ...profile,
          telegram_chat_id: String(chatId),
        });

        setStatus('success');
      } catch (err: any) {
        console.error('Failed to link Telegram account:', err);
        setErrorMsg(err.message || 'Database write rejected.');
        setStatus('error');
      }
    };

    linkAccount();
  }, [chatId, profile, setProfile]);

  if (!chatId) {
    return (
      <div className="p-8 bg-card border border-secondary/30 text-secondary font-mono rounded-3xl text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 mx-auto animate-pulse text-secondary" />
        <h2 className="text-sm font-extrabold uppercase">[ LINKING EXCEPTION ]</h2>
        <p className="text-xs text-gray-400 font-sans leading-relaxed">
          The routing query is missing the required <code>chatId</code> parameter. Please relaunch the linking flow from the Telegram bot.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 bg-card border border-white/[0.08] rounded-3xl text-center space-y-6 max-w-md mx-auto font-mono">
        <Shield className="w-12 h-12 text-primary mx-auto animate-pulse" />
        <div className="space-y-2">
          <h2 className="text-sm font-extrabold text-white uppercase">[ AUTHENTICATION REQUIRED ]</h2>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Please log in or register your Ababil Shop account to complete the Telegram linkage for Chat ID: <code className="text-primary">{chatId}</code>.
          </p>
        </div>
        <button
          onClick={() => openAuthModal(`/auth/telegram?chatId=${chatId}`)}
          className="w-full py-3 bg-primary text-black font-black tracking-wider uppercase text-[10px] rounded-xl hover:shadow-neon-cyan active:scale-95 transform transition-all duration-300"
        >
          LOG IN / REGISTER
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto font-mono text-xs">
      {status === 'linking' && (
        <div className="p-8 bg-card border border-white/[0.08] rounded-3xl text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
          <h2 className="text-sm font-extrabold text-white uppercase">[ ESTABLISHING LINK ]</h2>
          <p className="text-xs text-gray-400 font-sans">
            Securing cryptographic link with Telegram Chat ID <code>{chatId}</code>...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="p-8 bg-card border border-primary/30 rounded-3xl text-center space-y-6 shadow-neon-cyan animate-in fade-in duration-300">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
          <div className="space-y-2">
            <h2 className="text-sm font-extrabold text-primary uppercase text-glow-cyan">[ LINK ESTABLISHED ]</h2>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Your Ababil Shop profile has been successfully mapped to Telegram. You may now return to Telegram to prompt the AI Copilot.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/agent"
              className="w-full py-3 bg-primary text-black font-black tracking-wider uppercase text-[10px] rounded-xl text-center hover:shadow-neon-cyan transition-all"
            >
              GO TO WEB CO-PILOT
            </Link>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 border border-white/10 text-gray-400 hover:text-white font-black tracking-wider uppercase text-[10px] rounded-xl text-center hover:bg-white/[0.03] transition-all"
            >
              OPEN TELEGRAM
            </a>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-8 bg-card border border-secondary/30 rounded-3xl text-center space-y-6">
          <AlertTriangle className="w-12 h-12 text-secondary mx-auto animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-sm font-extrabold text-secondary uppercase">[ LINKING FAILED ]</h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              An error occurred during the DB mapping phase: <code>{errorMsg}</code>
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-secondary text-black font-black tracking-wider uppercase text-[10px] rounded-xl hover:shadow-neon-pink transition-all"
          >
            RETRY LINKING
          </button>
        </div>
      )}
    </div>
  );
}

export default function TelegramAuthPage() {
  return (
    <div className="py-20 px-4">
      <Suspense fallback={
        <div className="text-center font-mono text-xs text-gray-500 animate-pulse">
          [ ACCESSING SEED AUTHENTICATION PARAMS... ]
        </div>
      }>
        <TelegramAuthContent />
      </Suspense>
    </div>
  );
}
