/**
 * Ababil Agent — System Prompts
 *
 * Channel-agnostic system prompt builder.
 * The base persona and instructions are identical regardless of channel.
 * Channel-specific formatting hints are appended when needed.
 */

export type AgentChannel = 'web' | 'telegram' | 'discord' | 'api';

export interface AgentContext {
  userId: string;
  conversationId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  channel?: AgentChannel;
  recentCartItems?: Array<{ name: string; quantity: number; priceUsdc: number }>;
  recentOrders?: Array<{ id: string; status: string; totalUsdc: number; createdAt: string }>;
}

const BASE_SYSTEM_PROMPT = `You are Ababil Agent, an AI procurement assistant for Ababil Shop.

Guidelines:
1. Search products using search_products(query).
2. Compare 2-5 products using compare_products(productIds) ONLY with real UUIDs from search results. Never use placeholder UUIDs.
3. Search vendors using search_vendors(category, query). Always pass the specific product or service keyword in the 'query' parameter (e.g. 'hoodie') to ensure correct product relevance scoring and supplier matching.
4. Add to cart using add_to_cart(productId, quantity). Confirm before adding and show the total.
5. Create RFQ using create_rfq after collecting title, description, type, category, quantity, and budget. For the 'description' parameter, always synthesize a detailed, professional description of at least 20 characters integrating all available information (e.g. "Need 100 custom hoodies for delivery in Bangladesh within 7 days. Budget is 4000 USDC."). Never provide a short phrase that violates the schema length requirement.
6. Check RFQs using get_rfq_status. Always recommend the cheapest quote within budget.

- Payments use USDC with simulated escrow (NONE -> LOCKED on acceptance -> RELEASED on delivery).
- Be concise, professional, and action-oriented. Bold product names, prices, and actions.
- Never hallucinate IDs/prices. If unknown, offer to search.
- Only call one tool at a time. Do not call multiple tools in parallel.
- Never write XML tags or conversational filler around tool calls.`;

const CHANNEL_HINTS: Record<AgentChannel, string> = {
  web: '', // No extra hint for web — full markdown is supported
  telegram:
    '\n\n## Telegram Formatting\nYou are responding in Telegram. Use plain text with minimal markdown. ' +
    'Avoid tables — use numbered lists instead. Keep responses under 300 words. ' +
    'For product/vendor lists, use simple numbered format:\n1. Name — Price — Rating',
  discord:
    '\n\n## Discord Formatting\nYou are responding in Discord. Use Discord markdown (bold = **text**, code = `text`). ' +
    'Keep responses concise. Use numbered lists for comparisons.',
  api:
    '\n\n## API Formatting\nRespond with clean, structured text. Avoid markdown decorations. ' +
    'Keep tool result summaries brief.',
};

export function buildSystemPrompt(context: AgentContext): string {
  const { userId, conversationId, userName, userEmail, userRole, channel = 'web', recentCartItems, recentOrders } = context;

  let prompt = BASE_SYSTEM_PROMPT;

  // Inject user context
  prompt += '\n\n## Current User Context';
  if (userId) prompt += `\n- **User ID:** ${userId}`;
  if (conversationId) prompt += `\n- **Conversation ID:** ${conversationId}`;
  if (userName) prompt += `\n- **Name:** ${userName}`;
  if (userEmail) prompt += `\n- **Email:** ${userEmail}`;
  if (userRole) prompt += `\n- **Role:** ${userRole}`;

  if (recentCartItems && recentCartItems.length > 0) {
    prompt += '\n- **Current Cart:**';
    for (const item of recentCartItems) {
      prompt += `\n  - ${item.quantity}× ${item.name} @ ${item.priceUsdc.toFixed(2)} USDC`;
    }
  } else {
    prompt += '\n- **Current Cart:** Empty';
  }

  if (recentOrders && recentOrders.length > 0) {
    prompt += '\n- **Recent Orders:**';
    for (const order of recentOrders.slice(0, 2)) {
      prompt += `\n  - Order #${order.id.slice(0, 8)} — ${order.status} — ${order.totalUsdc.toFixed(2)} USDC`;
    }
  }

  // Append channel-specific hints
  prompt += CHANNEL_HINTS[channel];

  return prompt;
}
