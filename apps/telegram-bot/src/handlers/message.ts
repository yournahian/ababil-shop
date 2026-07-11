import { Context } from 'telegraf';
import { sendToAgent } from '../lib/agent-client';
import { markdownToHtml } from '../lib/format';

const STOREFRONT_URL = process.env.STOREFRONT_URL || 'http://localhost:3000';

export async function handleMessage(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const messageText = (ctx.message as any)?.text;
  if (!messageText) return;

  try {
    // Show typing indicator
    await ctx.sendChatAction('typing').catch(() => {});

    // Send the user message to the storefront agent endpoint
    const res = await sendToAgent(chatId, messageText);

    if (res.unauthorized) {
      const linkUrl = `${STOREFRONT_URL}/auth/telegram?chatId=${chatId}`;
      const authMessage = 
        `⚠️ <b>Account not linked.</b>\n\n` +
        `To chat with your AI Copilot, list RFQs, or accept quotes, you must link your Telegram profile to your Ababil Shop account.\n\n` +
        `🔗 <a href="${linkUrl}"><b>CLICK HERE TO LINK YOUR ACCOUNT</b></a>\n\n` +
        `Once linked, you can chat with me or use /rfq and /orders.`;
      
      await ctx.replyWithHTML(authMessage);
      return;
    }

    if (!res.success) {
      await ctx.replyWithHTML(
        `❌ <b>Copilot Encountered an Error:</b>\n<code>${res.error || 'Failed to process request.'}</code>`
      );
      return;
    }

    // Convert OpenAI response Markdown to Telegram HTML and reply
    const htmlText = res.text ? markdownToHtml(res.text) : '<i>No response returned from the agent.</i>';
    await ctx.replyWithHTML(htmlText);
  } catch (err: any) {
    console.error('Error handling Telegram message:', err);
    await ctx.replyWithHTML(
      `❌ <b>Transmission Error:</b> Failed to deliver message to procurement cognitive layer.`
    );
  }
}
