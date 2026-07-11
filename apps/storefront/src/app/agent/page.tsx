'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useChat } from 'ai/react';
import { MessageSquare, Plus, Send, RefreshCw, Bot, ShoppingCart, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuthStore, useCartStore } from '../../lib/store';
import MessageBubble from '../../components/agent/MessageBubble';
import CheckoutModal from '../../components/CheckoutModal';
import type { SettlementResult } from '../../lib/ababilpay';

interface ConvItem {
  id: string;
  title: string;
  source: string;
  created_at: string;
}

export default function AgentPage() {
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const cartItems = useCartStore((state) => state.items);

  // AbabilPay checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutIntent, setCheckoutIntent] = useState<any>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Vercel AI SDK useChat
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages, setInput } = useChat({
    api: '/api/agent/chat',
    body: {
      channel: 'web',
      conversationId: activeConvId,
      cartItems,
    },
    onResponse(response) {
      const headerConvId = response.headers.get('x-conversation-id');
      if (headerConvId && headerConvId !== activeConvId) {
        setActiveConvId(headerConvId);
        // Refresh conversations list to show new conversation title
        fetchConversations();
      }
    },
  });

  // Fetch all active conversations for user
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/agent/conversations');
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations list:', err);
    }
  };

  // Fetch messages history when switching active conversation
  const loadConversationHistory = async (convId: string) => {
    setLoadingHistory(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/agent/conversations/${convId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchConversations();
    }
  }, [profile]);

  useEffect(() => {
    if (error) {
      console.error('[AGENT EXCEPTION RECORDED] Detailed Error:', error);
      console.error('[AGENT EXCEPTION RECORDED] Stack Trace:', error.stack);
    }
  }, [error]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    // Scroll only the chat container, never the window
    const frame = requestAnimationFrame(() => scrollToBottom());
    return () => cancelAnimationFrame(frame);
  }, [messages]);

  // Handler to accept a quote
  const handleAcceptQuote = async (quoteId: string) => {
    if (!activeConvId) return null;
    try {
      const res = await fetch(`/api/agent/rfq/${activeConvId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json();
      if (data && data.success && data.intent) {
        setCheckoutOrderId(data.orderId);
        const req = data.intent.payment_requirements?.[0];
        const price = req ? (parseFloat(req.maxAmountRequired) / 1000000) : 0;
        setCheckoutAmount(price);
        setCheckoutIntent(data.intent);
        setIsCheckoutOpen(true);
        return data;
      } else {
        throw new Error(data.error || 'Failed to setup payment intent.');
      }
    } catch (err: any) {
      console.error('Failed to accept quote:', err);
      throw err;
    }
  };

  const handleCheckoutSuccess = async (result: SettlementResult, txHash: string, intentId?: string) => {
    setIsCheckoutOpen(false);
    const successUrl = `/checkout/success?orderId=${checkoutOrderId}&txHash=${txHash}&intentId=${intentId}`;
    window.location.href = successUrl;
  };

  // Start a new fresh chat session
  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    // Focus the input after suggestion click
    setTimeout(() => {
      const inp = document.getElementById('agent-input') as HTMLInputElement | null;
      inp?.focus();
    }, 50);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
      handleSubmit(syntheticEvent);
    }
  };

  if (!profile) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center font-mono space-y-6">
        <Bot className="w-16 h-16 text-primary mx-auto animate-pulse" />
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-glow-cyan text-white uppercase">[ AGENTIC TERMINAL ]</h1>
          <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto leading-relaxed">
            Connect your authenticated session credentials to establish a secure link to the Ababil Procurement AI Copilot.
          </p>
        </div>
        <button
          onClick={() => openAuthModal('/agent')}
          className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-black tracking-wider text-xs rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300"
        >
          AUTHENTICATE SESSION
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)] min-h-[500px] border border-white/[0.08] bg-card rounded-[2rem] flex overflow-hidden font-mono text-xs text-white relative">
      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. Sidebar */}
      <div className={`
        absolute md:relative z-30 md:z-auto
        h-full w-64 border-r border-white/[0.08] flex flex-col justify-between bg-black/95 md:bg-black/40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 space-y-4 flex-grow flex flex-col overflow-hidden">
          <button
            onClick={() => { handleStartNewChat(); setSidebarOpen(false); }}
            className="w-full py-3 bg-primary text-black font-black tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 hover:shadow-neon-cyan active:scale-95 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            NEW COPILOT SESSION
          </button>

          <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase block px-2 mb-2">
              [ PAST SESSIONS ]
            </span>
            {conversations.length === 0 ? (
              <p className="text-[10px] text-gray-600 px-2 py-4 italic">No sessions recorded.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveConvId(c.id);
                    loadConversationHistory(c.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full p-3 text-left rounded-xl border transition-all duration-300 flex items-center gap-2 group ${
                    activeConvId === c.id
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(0,255,255,0.05)]'
                      : 'border-transparent bg-transparent hover:bg-white/[0.03] text-gray-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate group-hover:translate-x-0.5 transition-transform">
                    {c.title || 'Conversation'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Cart Info Card in Sidebar */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-white/[0.08] bg-black/60 space-y-2">
            <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase block">
              [ CURRENT CART CONTEXT ]
            </span>
            <div className="flex items-center gap-2 text-primary font-bold">
              <ShoppingCart className="w-4 h-4" />
              <span>{cartItems.length} Products Loaded</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Chat Workspace */}
      <div className="flex-grow flex flex-col justify-between bg-black/25 min-w-0">
        {/* Chat Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/[0.08] bg-card flex items-center justify-between gap-3">
          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-primary transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle chat sessions"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-3 h-3 rounded-full bg-primary animate-ping flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] text-primary tracking-widest uppercase block">[ ACTIVE CONTEXT LINK ]</span>
              <h2 className="text-xs font-black uppercase text-white mt-0.5 truncate">
                {activeConvId
                  ? `SESSION: #${activeConvId.slice(0, 16).toUpperCase()}`
                  : 'ESTABLISHING FRESH COGNITIVE TERMINAL'}
              </h2>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div
          ref={chatContainerRef}
          className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-thin"
        >
          {loadingHistory ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono animate-pulse">
              [ ACCESSING SECURE ARCHIVE LEDGER... ]
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <Bot className="w-16 h-16 text-primary/30 animate-bounce" style={{ animationDuration: '4s' }} />
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-white uppercase">[ COPILOT INTERFACE STANDBY ]</h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  I can queries products, run vendor matrix comparisons, construct custom RFQ workflows, and deploy order agreements automatically using Arc escrow logic.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-4">
                <button
                  onClick={() => handleSuggestionClick('Compare the top 3 tech products in the marketplace')}
                  className="p-3 bg-card hover:bg-card-hover border border-card-border hover:border-primary/20 text-left rounded-xl transition-all duration-300"
                >
                  <span className="block text-[8px] text-primary font-bold uppercase mb-1">Comparison</span>
                  <span className="text-[10px] font-sans text-gray-400 line-clamp-1 leading-normal">
                    &ldquo;Compare top 3 tech products&rdquo;
                  </span>
                </button>
                <button
                  onClick={() => handleSuggestionClick('I need to source 500 custom hoodies — launch RFQ Wizard')}
                  className="p-3 bg-card hover:bg-card-hover border border-card-border hover:border-primary/20 text-left rounded-xl transition-all duration-300"
                >
                  <span className="block text-[8px] text-secondary font-bold uppercase mb-1">Procurement</span>
                  <span className="text-[10px] font-sans text-gray-400 line-clamp-1 leading-normal">
                    &ldquo;Source 500 custom hoodies RFQ&rdquo;
                  </span>
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
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>[ CALCULATING OPTIMIZED RESPONSE METRIC... ]</span>
                </div>
              )}
              {error && (
                <div className="p-4 bg-secondary/10 border border-secondary/30 text-secondary font-mono rounded-2xl">
                  [ AGENT EXCEPTION RECORDED: {error.message || 'Transmission error'} ]
                </div>
              )}
            </>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={handleFormSubmit}
          className="p-4 border-t border-white/[0.08] bg-card/60 flex gap-3 items-center"
        >
          <input
            id="agent-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            readOnly={isLoading}
            placeholder={isLoading ? 'Awaiting response streams...' : 'Interact with Ababil Copilot...'}
            className="flex-grow bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-colors min-w-0"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 flex-shrink-0 bg-primary hover:bg-primary-light disabled:bg-card-border text-black disabled:text-gray-600 rounded-2xl flex items-center justify-center hover:shadow-neon-cyan disabled:shadow-none transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* AbabilPay Checkout Modal overlay */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        amountUSDC={checkoutAmount}
        orderDescription="RFQ Sourced Quote Order"
        orderId={checkoutOrderId}
        initialIntent={checkoutIntent}
        onSuccess={handleCheckoutSuccess}
        onCancel={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
