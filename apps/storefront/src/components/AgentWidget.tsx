'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { MessageSquare, X, ArrowUpRight, Send, RefreshCw, Bot } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, useCartStore } from '../lib/store';
import MessageBubble from './agent/MessageBubble';

export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const profile = useAuthStore((state) => state.profile);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const cartItems = useCartStore((state) => state.items);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Vercel AI SDK useChat setup
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: '/api/agent/chat',
    body: {
      channel: 'web',
      conversationId,
      cartItems,
    },
    onResponse(response) {
      const headerConvId = response.headers.get('x-conversation-id');
      if (headerConvId) {
        setConversationId(headerConvId);
      }
    },
  });

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handler to accept a quote
  const handleAcceptQuote = async (quoteId: string) => {
    if (!conversationId) return { success: false, orderId: '', escrowStatus: '' };
    try {
      const res = await fetch(`/api/agent/rfq/${conversationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Failed to accept quote:', err);
      return { success: false, orderId: '', escrowStatus: '' };
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-light text-black rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,255,255,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 z-50 animate-bounce"
        style={{ animationDuration: '3s' }}
        id="agent-widget-toggle"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-[360px] h-[500px] bg-black/85 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
      id="agent-widget-panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
          <span className="text-xs font-black font-mono tracking-wider text-white">ABABIL AGENT</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/agent"
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/[0.04] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Open full page chat"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/[0.04] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin"
      >
        {!profile ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 font-mono">
            <MessageSquare className="w-10 h-10 text-gray-700 animate-pulse" />
            <div className="space-y-1">
              <p className="text-xs text-white uppercase font-bold">AUTHENTICATION REQUIRED</p>
              <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                Log in to chat with the procurement agent, query products, and request vendor quotes.
              </p>
            </div>
            <button
              onClick={() => openAuthModal('/agent')}
              className="px-6 py-2 bg-primary text-black text-[10px] font-black tracking-wider uppercase rounded-xl hover:shadow-neon-cyan transition-all duration-300"
            >
              LOG IN
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 font-mono text-gray-500">
            <Bot className="w-8 h-8 text-primary/40 animate-pulse" />
            <div className="space-y-1">
              <p className="text-[10px] text-white uppercase font-bold">ABABIL COPILOT ONLINE</p>
              <p className="text-[9px] font-sans leading-relaxed max-w-[200px] mx-auto">
                Ask me to search products, compare vendors, or setup an RFQ procurement request.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 w-full max-w-[200px] mx-auto text-[8px]">
              <button
                onClick={() => handleInputChange({ target: { value: 'Compare top 3 gaming keyboards' } } as any)}
                className="p-1.5 bg-card hover:bg-card-hover border border-card-border text-left rounded-lg transition-colors truncate"
              >
                &ldquo;Compare gaming keyboards&rdquo;
              </button>
              <button
                onClick={() => handleInputChange({ target: { value: 'I need to create a custom stickers RFQ' } } as any)}
                className="p-1.5 bg-card hover:bg-card-hover border border-card-border text-left rounded-lg transition-colors truncate"
              >
                &ldquo;Create custom stickers RFQ&rdquo;
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m as any}
                onAcceptQuote={handleAcceptQuote}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                <span>[ AGENT COGNITIVE COMPUTE RUNNING... ]</span>
              </div>
            )}
            {error && (
              <div className="p-3 bg-secondary/15 border border-secondary/35 text-secondary text-[10px] font-mono rounded-xl">
                [ ERROR: {error.message || 'Connection lost'} ]
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      {profile && (
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-white/[0.08] bg-card/60 flex gap-2 items-center"
        >
          <input
            value={input}
            onChange={handleInputChange}
            readOnly={isLoading}
            placeholder={isLoading ? 'Agent is responding...' : 'Command Ababil Copilot...'}
            className="flex-grow bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 bg-primary hover:bg-primary-light disabled:bg-card-border text-black disabled:text-gray-600 rounded-xl flex items-center justify-center transition-all duration-300"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
