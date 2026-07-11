import { Context } from 'telegraf';
import { markdownToHtml, formatStatusEmoji } from '../lib/format';

const STOREFRONT_URL = process.env.STOREFRONT_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper to look up profile ID by Telegram Chat ID
async function getUserIdByChatId(chatId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?telegram_chat_id=eq.${chatId}&select=id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.id || null;
  } catch (err) {
    console.error('Failed to get userId by chatId:', err);
    return null;
  }
}

// ─── 1. /start command (Link Account) ─────────────────────────────────────────

export async function handleStart(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const linkUrl = `${STOREFRONT_URL}/auth/telegram?chatId=${chatId}`;

  const message = 
    `🤖 <b>Welcome to Ababil Shop AI Procurement Terminal!</b>\n\n` +
    `To chat with your AI Copilot, list RFQs, or accept quotes, you must link your Telegram profile to your Ababil Shop account.\n\n` +
    `🔗 <a href="${linkUrl}"><b>CLICK HERE TO LINK YOUR ACCOUNT</b></a>\n\n` +
    `Once linked, you can type any search query or use the commands below:\n` +
    `/rfq - List your active procurement requests\n` +
    `/orders - View your recent order tracking ledger`;

  await ctx.replyWithHTML(message);
}

// ─── 2. /rfq command (List active RFQs) ───────────────────────────────────────

export async function handleRfq(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const userId = await getUserIdByChatId(chatId);
  if (!userId) {
    return ctx.replyWithHTML(
      `⚠️ <b>Account not linked.</b> Please link your account first using /start.`
    );
  }

  try {
    const res = await fetch(`${STOREFRONT_URL}/api/agent/rfq`, {
      headers: {
        'x-telegram-chat-id': String(chatId),
        'x-telegram-bot-token': process.env.TELEGRAM_BOT_TOKEN || '',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.rfqs || data.rfqs.length === 0) {
      return ctx.replyWithHTML(
        `📂 <b>No active RFQs found.</b> Ask the Copilot to create one for you!`
      );
    }

    let msg = `📋 <b>Your Active Procurement Requests:</b>\n\n`;
    data.rfqs.forEach((rfq: any, i: number) => {
      msg += 
        `${i + 1}. <b>${rfq.title}</b>\n` +
        `   • Category: ${rfq.category} | Qty: ${rfq.quantity}\n` +
        `   • Budget: ${rfq.budgetUsdc.toFixed(2)} USDC | Status: ${rfq.status.toUpperCase()}\n` +
        `   • Quotes: ${rfq.quoteCount} received\n` +
        `   • View quotes: /quotes_${rfq.id.replace(/-/g, '_')}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  } catch (err: any) {
    await ctx.replyWithHTML(`❌ <b>Failed to load RFQs:</b> ${err.message}`);
  }
}

// ─── 3. /quotes command (Show quotes for RFQ) ───────────────────────────────

export async function handleQuotes(ctx: Context, rfqId: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const userId = await getUserIdByChatId(chatId);
  if (!userId) {
    return ctx.replyWithHTML(
      `⚠️ <b>Account not linked.</b> Please link your account first using /start.`
    );
  }

  try {
    const res = await fetch(`${STOREFRONT_URL}/api/agent/rfq/${rfqId}`, {
      headers: {
        'x-telegram-chat-id': String(chatId),
        'x-telegram-bot-token': process.env.TELEGRAM_BOT_TOKEN || '',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.rfq) {
      return ctx.replyWithHTML(`❌ <b>RFQ not found.</b>`);
    }

    const rfq = data.rfq;
    const quotes = rfq.quotes || [];

    let msg = 
      `📋 <b>Quotes for &quot;${rfq.title}&quot;</b>\n` +
      `Category: ${rfq.category} | Budget: ${rfq.budgetUsdc.toFixed(2)} USDC\n\n`;

    if (quotes.length === 0) {
      msg += `⏳ <i>Awaiting vendor quotes. I will notify you when proposals arrive.</i>`;
      return ctx.replyWithHTML(msg);
    }

    quotes.forEach((q: any, i: number) => {
      const statusSymbol = q.status === 'accepted' ? '✅' : q.status === 'rejected' ? '❌' : '⚡';
      msg += 
        `${i + 1}. ${statusSymbol} <b>${q.vendorName}</b>\n` +
        `   • Total Price: <b>${q.totalPriceUsdc.toFixed(2)} USDC</b>\n` +
        `   • Delivery Lead: ${q.deliveryDays} Days\n` +
        `   • Note: <i>&ldquo;${q.notes || 'No notes.'}&rdquo;</i>\n`;
      
      if (q.status === 'pending' && rfq.status !== 'accepted' && rfq.status !== 'fulfilled') {
        msg += `   • Accept Quote: /accept_${q.id.replace(/-/g, '_')}\n\n`;
      } else if (q.status === 'accepted') {
        msg += `   • 🔒 <b>ESCROW LOCKED</b>\n\n`;
      } else {
        msg += `\n`;
      }
    });

    await ctx.replyWithHTML(msg);
  } catch (err: any) {
    await ctx.replyWithHTML(`❌ <b>Failed to load quotes:</b> ${err.message}`);
  }
}

// ─── 4. /accept command (Accept Quote & Lock Escrow) ─────────────────────────

export async function handleAccept(ctx: Context, quoteId: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const userId = await getUserIdByChatId(chatId);
  if (!userId) {
    return ctx.replyWithHTML(
      `⚠️ <b>Account not linked.</b> Please link your account first using /start.`
    );
  }

  try {
    // 1. Resolve RFQ ID of this quote via Supabase Rest API
    const quoteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/vendor_quotes?id=eq.${quoteId}&select=rfq_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!quoteRes.ok) throw new Error('Failed to resolve quote metadata.');
    
    const quoteData = await quoteRes.json();
    const rfqId = quoteData[0]?.rfq_id;
    
    if (!rfqId) {
      return ctx.replyWithHTML(`❌ <b>Quote not found or invalid.</b>`);
    }

    // 2. Call storefront quote acceptance API route passing Bot Token headers
    const acceptRes = await fetch(`${STOREFRONT_URL}/api/agent/rfq/${rfqId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-chat-id': String(chatId),
        'x-telegram-bot-token': process.env.TELEGRAM_BOT_TOKEN || '',
      },
      body: JSON.stringify({ quoteId }),
    });

    const acceptData = await acceptRes.json();

    if (!acceptRes.ok || !acceptData.success) {
      return ctx.replyWithHTML(
        `❌ <b>Quote acceptance failed:</b> ${acceptData.error || 'Unknown error'}`
      );
    }

    const successMsg = 
      `🎉 <b>QUOTE ACCEPTED SUCCESSFULLY!</b>\n\n` +
      `🔒 <b>Escrow Funds Locked:</b> Committed on-chain (simulated).\n` +
      `🛸 <b>Courier Drone dispatched</b> for Order <code>#${acceptData.orderId.slice(0, 8)}</code>.\n\n` +
      `Use /orders to check the delivery telemetry live status.`;

    await ctx.replyWithHTML(successMsg);
  } catch (err: any) {
    await ctx.replyWithHTML(`❌ <b>Failed to accept quote:</b> ${err.message}`);
  }
}

// ─── 5. /orders command (List recent orders ledger) ──────────────────────────

export async function handleOrders(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const userId = await getUserIdByChatId(chatId);
  if (!userId) {
    return ctx.replyWithHTML(
      `⚠️ <b>Account not linked.</b> Please link your account first using /start.`
    );
  }

  try {
    // Fetch orders directly from Supabase REST
    const ordRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?customer_id=eq.${userId}&select=id,status,total_amount,payment_status,created_at,vendors(name)&order=created_at.desc&limit=5`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!ordRes.ok) throw new Error('Ecosystem ledger unreachable.');

    const orders = await ordRes.json();

    if (orders.length === 0) {
      return ctx.replyWithHTML(`📦 <b>No order records found on this account.</b>`);
    }

    let msg = `📦 <b>Your Recent Orders:</b>\n\n`;
    orders.forEach((o: any) => {
      const statusEmoji = formatStatusEmoji(o.status);
      const vendorName = o.vendors?.name || 'Ababil Vendor';
      msg += 
        `• <b>Order #${o.id.slice(0, 8)}</b>\n` +
        `  Amount: <b>${parseFloat(o.total_amount).toFixed(2)} USDC</b>\n` +
        `  Vendor: ${vendorName}\n` +
        `  Delivery State: ${statusEmoji}\n` +
        `  Payment: ${o.payment_status.toUpperCase()}\n` +
        `  Placed on: ${new Date(o.created_at).toLocaleDateString()}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  } catch (err: any) {
    await ctx.replyWithHTML(`❌ <b>Failed to retrieve orders:</b> ${err.message}`);
  }
}
