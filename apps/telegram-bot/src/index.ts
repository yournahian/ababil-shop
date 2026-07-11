import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { 
  handleStart, 
  handleRfq, 
  handleQuotes, 
  handleAccept, 
  handleOrders 
} from './handlers/commands';
import { handleMessage } from './handlers/message';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn('⚠️ [ABABIL BOT] TELEGRAM_BOT_TOKEN environment variable is not defined. Telegram interface is standby/disabled.');
  // Keep the workspace process alive so Turborepo doesn't crash the other apps (storefront/dashboard)
  setInterval(() => {}, 60000);
} else {
  const bot = new Telegraf(token);

  // Command bindings
  bot.command('start', handleStart);
  bot.command('rfq', handleRfq);
  bot.command('orders', handleOrders);

  // Dynamic path handlers using regex for UUID decoding (Telegram commands don't allow dashes)
  bot.hears(/^\/quotes_(.+)$/, async (ctx) => {
    try {
      const rfqId = ctx.match[1].replace(/_/g, '-');
      await handleQuotes(ctx, rfqId);
    } catch (err) {
      console.error('Error parsing dynamic quotes route:', err);
      await ctx.reply('❌ Failed to resolve quotes payload.');
    }
  });

  bot.hears(/^\/accept_(.+)$/, async (ctx) => {
    try {
      const quoteId = ctx.match[1].replace(/_/g, '-');
      await handleAccept(ctx, quoteId);
    } catch (err) {
      console.error('Error parsing dynamic accept route:', err);
      await ctx.reply('❌ Failed to resolve accept payload.');
    }
  });

  // Relaying all generic text messages to the AI Agent chat endpoint
  bot.on('text', handleMessage);

  // Bootstrapping
  bot.launch()
    .then(() => {
      console.log('⚡ [ABABIL BOT] Telegram agent-procurement listener online.');
    })
    .catch((err) => {
      console.error('Fatal: Failed to startup Telegram bot listener thread:', err);
      process.exit(1);
    });

  // Graceful termination handling
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
