import React from 'react';
import { Bot, User, Cpu } from 'lucide-react';
import ProductSearchCard from './ProductSearchCard';
import VendorSearchCard from './VendorSearchCard';
import RFQCreatedCard from './RFQCreatedCard';
import QuoteComparisonCard from './QuoteComparisonCard';

interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    toolCalls?: any[];
  };
  onAcceptQuote?: (quoteId: string) => Promise<{ success: boolean; orderId: string; intent?: any; simulated?: boolean } | null>;
}

export default function MessageBubble({ message, onAcceptQuote }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Format text content for rendering
  const renderTextContent = (text: string) => {
    if (!text) return null;

    // Simple markdown link parser and bold parser for beautiful inline rendering
    const parts = text.split(/(\*\*.*?\*\*|\n)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-extrabold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part === '\n') {
        return <br key={i} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex gap-4 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Icon */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-black/40 border border-card-border flex items-center justify-center text-primary flex-shrink-0">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[85%] space-y-2`}>
        {/* Main Text Content */}
        {message.content && (
          <div
            className={`p-4 rounded-3xl text-xs leading-relaxed font-sans ${
              isUser
                ? 'bg-primary/10 border border-primary/20 text-white rounded-tr-none font-mono text-[11px]'
                : 'bg-card border border-card-border text-gray-300 rounded-tl-none'
            }`}
          >
            {renderTextContent(message.content)}
          </div>
        )}

        {/* Generative Tool Calls/Results */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2 w-full">
            {message.toolCalls.map((toolCall) => {
              const toolCallId = toolCall.toolCallId || toolCall.id;
              const toolName = toolCall.toolName || toolCall.function?.name;
              const { state, result } = toolCall;

              // 1. Render Loading State for executing tools
              if (state === 'executing' || !result) {
                return (
                  <div
                    key={toolCallId}
                    className="flex items-center gap-2 p-3 bg-black/25 border border-dashed border-card-border rounded-xl text-[9px] font-mono text-gray-500 animate-pulse"
                  >
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <span>[ RUNNING COMPUTE ENGINE: {(toolName || '').toUpperCase()}... ]</span>
                  </div>
                );
              }

              // 2. Render Result State (Generative UI)
              switch (toolName) {
                case 'search_products':
                  return (
                    <ProductSearchCard
                      key={toolCallId}
                      products={result.products}
                      found={result.found}
                      message={result.message}
                    />
                  );
                case 'compare_products':
                case 'compare_top_products':
                  return (
                    <ProductSearchCard
                      key={toolCallId}
                      products={result.products}
                      found={result.found}
                      message={result.recommendation || result.message}
                    />
                  );
                case 'search_vendors':
                  return (
                    <VendorSearchCard
                      key={toolCallId}
                      vendors={result.vendors}
                      found={result.found}
                      category={result.category}
                      location={result.location}
                      message={result.message}
                    />
                  );
                case 'create_rfq':
                  return (
                    <RFQCreatedCard
                      key={toolCallId}
                      rfq={result.rfq}
                      vendorsNotified={result.vendorsNotified}
                      message={result.message}
                    />
                  );
                case 'get_rfq_status':
                  return (
                    <QuoteComparisonCard
                      key={toolCallId}
                      rfq={result.rfq}
                      quotes={result.quotes}
                      quoteCount={result.quoteCount}
                      recommendation={result.recommendation}
                      message={result.message}
                      onAccept={onAcceptQuote}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
        )}
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
          <User className="w-4.5 h-4.5" />
        </div>
      )}
    </div>
  );
}
