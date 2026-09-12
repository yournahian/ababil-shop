import { NextResponse } from 'next/server';
import { createDataStreamResponse, formatDataStreamPart } from 'ai';
import { createAdminClient, createServerClient } from '@ababil/supabase';
import { cookies } from 'next/headers';
import { buildSystemPrompt } from '@/lib/agent-prompts';
import { agentTools } from '@/lib/agent-tools';
import { isRateLimited } from '@/lib/rate-limit';
import { streamAgentTextWithFallback, generateAgentTextWithFallback } from '@/lib/provider-router';


// Emergency Development Mode Flag
const IS_DEV = process.env.AGENT_DEV_MODE === 'true';

export const maxDuration = 60;


function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// Helper to save a message to the database
async function saveMessage(
  supabase: any,
  conversationId: string,
  role: 'user' | 'assistant' | 'tool',
  content: any,
  toolName?: string,
  toolCallId?: string
) {
  const { error } = await supabase.from('agent_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    tool_name: toolName || null,
    tool_call_id: toolCallId || null,
  });
  if (error) {
    console.error('Failed to save message:', error);
  }
}

// Helper to window message history safely ensuring tool responses are paired with assistant tool calls
function windowMessages(messages: any[], limit: number): any[] {
  if (messages.length <= limit) return messages;
  
  let startIndex = messages.length - limit;
  
  // Ensure we do not orphan tool results: trace backwards if first message in window is a 'tool' role
  while (startIndex > 0 && messages[startIndex].role === 'tool') {
    startIndex--;
  }
  
  // Also include the starting assistant message if it contains the tool calls definition
  if (startIndex > 0 && messages[startIndex - 1].role === 'assistant' && messages[startIndex - 1].toolCalls) {
    startIndex--;
  }
  
  return messages.slice(startIndex);
}

function minifyToolResult(toolName: string, result: any): any {
  if (!result || typeof result !== 'object') return result;
  
  const clean = JSON.parse(JSON.stringify(result));
  
  try {
    if (toolName === 'search_products' || toolName === 'compare_products' || toolName === 'compare_top_products') {
      if (Array.isArray(clean.products)) {
        clean.products = clean.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          priceUsdc: p.priceUsdc || p.priceUSD,
          category: p.category,
          inStock: p.inStock,
          inventory: p.inventory,
          rating: p.rating,
          moq: p.moq,
          vendor: p.vendor ? { id: p.vendor.id, name: p.vendor.name } : undefined,
          description: p.description,
        }));
      }
    } else if (toolName === 'search_vendors') {
      if (Array.isArray(clean.vendors)) {
        clean.vendors = clean.vendors.map((v: any) => ({
          id: v.id,
          name: v.name,
          description: v.description,
          verified: v.verified,
          rating: v.rating,
          completedOrders: v.completedOrders,
          deliverySuccessRate: v.deliverySuccessRate,
          avgResponseHours: v.avgResponseHours,
          preferredDeliveryDays: v.preferredDeliveryDays,
        }));
      }
    } else if (toolName === 'get_rfq_status') {
      if (Array.isArray(clean.quotes)) {
        clean.quotes = clean.quotes.map((q: any) => ({
          id: q.id,
          rank: q.rank,
          vendorId: q.vendorId,
          vendorName: q.vendorName,
          unitPriceUsdc: q.unitPriceUsdc,
          totalPriceUsdc: q.totalPriceUsdc,
          deliveryDays: q.deliveryDays,
          notes: q.notes,
          withinBudget: q.withinBudget,
          status: q.status,
          orderId: q.orderId || q.order_id,
        }));
      }
    } else if (toolName === 'add_to_cart') {
      if (clean.product) {
        clean.product = {
          id: clean.product.id,
          name: clean.product.name,
          priceUSD: clean.product.priceUSD,
          inStock: clean.product.inStock,
          moq: clean.product.moq,
        };
      }
    }
  } catch (e) {
    console.error('Error minifying tool result:', e);
  }
  
  return clean;
}

export async function POST(req: Request) {
  // Restore correct environment variables from files to prevent memory leaks from previous tests
  try {
    const fs = require('fs');
    const path = require('path');
    const rootEnvPath = path.resolve(process.cwd(), '.env');
    const storefrontEnvPath = path.resolve(process.cwd(), 'apps/storefront/.env');
    const rootEnvPathAlt = path.resolve(process.cwd(), '../../.env');
    const storefrontEnvPathAlt = path.resolve(process.cwd(), '.env');

    const envFiles = [rootEnvPath, storefrontEnvPath, rootEnvPathAlt, storefrontEnvPathAlt];
    for (const filePath of envFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const index = trimmed.indexOf('=');
          if (index === -1) continue;
          const key = trimmed.slice(0, index).trim();
          let val = trimmed.slice(index + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1);
          }
          if (key === 'GEMINI_API_KEY' || key === 'GOOGLE_GENERATIVE_AI_API_KEY') {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e: any) {
    console.error('[Startup Env Check] Failed to restore env variables from files:', e.message);
  }

  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

  // Startup / Request Initialization Logging (Without printing the full key)
  try {
    const gKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const exists = !!gKey;
    const envVarName = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'GOOGLE_GENERATIVE_AI_API_KEY' : (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'NONE');
    const isEnabled = exists;
    
    const { debugLog } = require('@/lib/provider-router');
    console.log(`[Request-Init] Gemini config status - Key Exists: ${exists}, Env Var Used: ${envVarName}, Enabled: ${isEnabled}`);
    debugLog(`[Request-Init] Gemini config status - Key Exists: ${exists}, Env Var Used: ${envVarName}, Enabled: ${isEnabled}`);
  } catch (logErr: any) {
    console.error('[Request-Init] Logging failed:', logErr.message);
  }


  try {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    const body = await req.json();
    const {
      messages: clientMessages,
      message: singleMessage,
      conversationId: clientConversationId,
      channel = 'web',
      externalChatId,
      cartItems = [],
    } = body;

    const limitKey = externalChatId ? `tele_${externalChatId}` : `ip_${ip}`;
    const maxLimit = parseInt(process.env.RATE_LIMIT_MAX || '60', 10);
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

    if (isRateLimited(limitKey, maxLimit, windowMs)) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', message: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const supabaseAdmin = getAdminClient();

    // 1. Resolve User
    let userId: string | null = null;
    let userProfile: any = null;

    if (channel === 'web') {
      const cookieStore = cookies();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, username, email, role, full_name')
          .eq('id', userId)
          .single();
        userProfile = profile;
      }
    } else if (channel === 'telegram' && externalChatId) {
      const telegramChatId = req.headers.get('x-telegram-chat-id');
      const telegramBotToken = req.headers.get('x-telegram-bot-token');

      if (telegramChatId && telegramBotToken && telegramBotToken === process.env.TELEGRAM_BOT_TOKEN) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, username, email, role, full_name')
          .eq('telegram_chat_id', String(externalChatId))
          .single();
        
        if (profile) {
          userId = profile.id;
          userProfile = profile;
        }
      }
    }

    if (!userId || !userProfile) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: channel === 'telegram'
            ? 'Account not linked. Please use /start in Telegram to link your account.'
            : 'Unauthorized. Please log in.',
        },
        { status: 401 }
      );
    }

    // 2. Resolve Conversation
    let conversationId = clientConversationId;
    if (!conversationId) {
      if (channel === 'telegram' && externalChatId) {
        const { data: activeConv } = await supabaseAdmin
          .from('agent_conversations')
          .select('id')
          .eq('user_id', userId)
          .eq('source', 'telegram')
          .eq('external_chat_id', String(externalChatId))
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (activeConv) {
          conversationId = activeConv.id;
        }
      }

      if (!conversationId) {
        const title = singleMessage 
          ? (singleMessage.slice(0, 40) + (singleMessage.length > 40 ? '...' : ''))
          : 'New Web Chat';

        const { data: newConv, error: convError } = await supabaseAdmin
          .from('agent_conversations')
          .insert({
            user_id: userId,
            title,
            source: channel,
            external_chat_id: externalChatId ? String(externalChatId) : null,
            status: 'active',
          })
          .select('id')
          .single();

        if (convError || !newConv) {
          throw convError || new Error('Failed to create conversation');
        }
        conversationId = newConv.id;
      }
    }

    // 3. Save User Message
    const userText = singleMessage || (clientMessages && clientMessages[clientMessages.length - 1]?.content);
    if (userText) {
      if (singleMessage) {
        await saveMessage(supabaseAdmin, conversationId, 'user', userText);
      } else {
        const { data: lastMsg } = await supabaseAdmin
          .from('agent_messages')
          .select('id, content')
          .eq('conversation_id', conversationId)
          .eq('role', 'user')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!lastMsg || lastMsg.length === 0 || lastMsg[0].content !== userText) {
          await saveMessage(supabaseAdmin, conversationId, 'user', userText);
        }
      }
    }

    // ─── 4. Conversation Summaries Trigger ───────────────────────────────────────
    // When messages database log exceeds 20 items, summarize, store in record, and prune
    const { count: msgCount } = await supabaseAdmin
      .from('agent_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (msgCount && msgCount > 20) {
      try {
        const { data: dbMessagesForSummary } = await supabaseAdmin
          .from('agent_messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        const textForSummary = (dbMessagesForSummary || []).map((m: any) => {
          const textContent = typeof m.content === 'string'
            ? m.content
            : (m.content?.text || JSON.stringify(m.content));
          return `${m.role}: ${textContent}`;
        }).join('\n');

        const summaryPrompt = `Summarize the following conversation history between a user and an AI procurement assistant. Be concise (2-3 sentences max). Focus on products discussed, active RFQs, and user decisions.\n\n${textForSummary}`;
        
        const { text: summaryText } = await generateAgentTextWithFallback({
          prompt: summaryPrompt,
        });

        // Store summary safely in conversation record
        try {
          await supabaseAdmin
            .from('agent_conversations')
            .update({ summary: summaryText })
            .eq('id', conversationId);
        } catch (err) {
          console.warn('Failed to update summary column:', err);
        }

        // Delete older messages keeping only the last 10 messages
        const { data: allMsgs } = await supabaseAdmin
          .from('agent_messages')
          .select('id, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (allMsgs && allMsgs.length > 10) {
          const deleteCount = allMsgs.length - 10;
          const idsToDelete = allMsgs.slice(0, deleteCount).map((m: any) => m.id);

          await supabaseAdmin
            .from('agent_messages')
            .delete()
            .in('id', idsToDelete);

          const oldestRemaining = allMsgs[deleteCount];
          const summaryTimestamp = oldestRemaining
            ? new Date(new Date(oldestRemaining.created_at).getTime() - 1000).toISOString()
            : new Date().toISOString();

          // Save summary back to history (using 'assistant' role to comply with DB CHECK constraint)
          await supabaseAdmin.from('agent_messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: `[Summary of previous conversation: ${summaryText}]`,
            created_at: summaryTimestamp,
          });
        }
      } catch (sumErr) {
        console.error('Failed to generate/save conversation summary:', sumErr);
      }
    }

    // ─── 5. Retrieve Pruned History & Format for AI SDK ─────────────────────────
    const { data: dbMessages, error: msgError } = await supabaseAdmin
      .from('agent_messages')
      .select('role, content, tool_name, tool_call_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    let coreMessages = (dbMessages || []).map((m: any) => {
      if (m.role === 'user') {
        return { role: 'user', content: m.content };
      }
      if (m.role === 'assistant') {
        if (m.content && typeof m.content === 'object') {
          if (m.content.toolCalls && m.content.toolCalls.length > 0) {
            const contentParts: any[] = [];
            if (m.content.text && m.content.text.trim()) {
              contentParts.push({ type: 'text', text: m.content.text });
            }
            contentParts.push(
              ...m.content.toolCalls.map((tc: any) => ({
                type: 'tool-call',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                args: tc.args,
              }))
            );
            return {
              role: 'assistant',
              content: contentParts,
            };
          } else {
            return {
              role: 'assistant',
              content: m.content.text || '',
            };
          }
        }
        return { role: 'assistant', content: m.content };
      }
      if (m.role === 'tool') {
        return {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: m.tool_call_id,
              toolName: m.tool_name,
              result: m.content,
            },
          ],
        };
      }
      return { role: 'user', content: String(m.content) };
    });

    // ─── 6. Apply Conversation Windowing ─────────────────────────────────────────
    const windowSize = IS_DEV ? 5 : 15;
    const windowedMessages = windowMessages(coreMessages, windowSize);

    // Minify tool results in windowed history to keep tokens low
    const minifiedMessages = windowedMessages.map((m: any) => {
      if (m.role === 'tool' && Array.isArray(m.content)) {
        return {
          ...m,
          content: m.content.map((part: any) => {
            if (part.type === 'tool-result') {
              return {
                ...part,
                result: minifyToolResult(part.toolName, part.result),
              };
            }
            return part;
          }),
        };
      }
      return m;
    });

    // Load User Context
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_amount, created_at')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
      .limit(2);

    const context = {
      userId,
      conversationId,
      userEmail: userProfile.email,
      userName: userProfile.full_name || userProfile.username || undefined,
      userRole: userProfile.role,
      channel,
      recentCartItems: cartItems.map((item: any) => ({
        name: item.product?.name || item.name,
        quantity: item.quantity,
        priceUsdc: item.product?.priceUSD || item.priceUsdc || 0,
      })),
      recentOrders: (recentOrders || []).map((o: any) => ({
        id: o.id,
        status: o.status,
        totalUsdc: parseFloat(o.total_amount),
        createdAt: o.created_at,
      })),
    };

    const systemPrompt = buildSystemPrompt(context);

    // Determine relevant tools dynamically
    const textHistory = minifiedMessages.map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join(' ');
    const lowerText = ((userText || '') + ' ' + textHistory).toLowerCase();
    
    // Default capabilities that are always available
    const relevantTools: any = {
      search_products: agentTools.search_products,
      search_vendors: agentTools.search_vendors,
      add_to_cart: agentTools.add_to_cart,
    };
    
    // 1. RFQ / Procurement intent (adds advanced procurement options)
    const isRfqIntent =
      lowerText.includes('rfq') ||
      lowerText.includes('source') ||
      lowerText.includes('custom') ||
      lowerText.includes('quote') ||
      lowerText.includes('proposal') ||
      lowerText.includes('escrow') ||
      lowerText.includes('supplier') ||
      lowerText.includes('vendor');

    if (isRfqIntent) {
      relevantTools.create_rfq = agentTools.create_rfq;
      relevantTools.get_rfq_status = agentTools.get_rfq_status;
    }
    
    // 2. Product comparison intent (adds comparison capabilities)
    const isCompareIntent =
      lowerText.includes('compare') ||
      lowerText.includes('comparison') ||
      lowerText.includes('recommend') ||
      lowerText.includes('versus') ||
      lowerText.includes('vs') ||
      lowerText.includes('top') ||
      lowerText.includes('best');

    if (isCompareIntent) {
      relevantTools.compare_products = agentTools.compare_products;
      relevantTools.compare_top_products = agentTools.compare_top_products;
    }
    // 3. Cart / Buying intent
    const isCartIntent =
      lowerText.includes('cart') ||
      lowerText.includes('add') ||
      lowerText.includes('buy') ||
      lowerText.includes('purchase');

    // 4. Always include tools that were previously used in the chat history
    for (const msg of minifiedMessages) {
      if (msg.role === 'assistant' && Array.isArray(msg.toolCalls)) {
        for (const tc of msg.toolCalls) {
          const name = tc.toolName;
          if (name && agentTools[name as keyof typeof agentTools]) {
            relevantTools[name] = agentTools[name as keyof typeof agentTools];
          }
        }
      }
      if (msg.role === 'tool' && Array.isArray(msg.content)) {
        for (const part of msg.content) {
          const name = part.toolName;
          if (name && agentTools[name as keyof typeof agentTools]) {
            relevantTools[name] = agentTools[name as keyof typeof agentTools];
          }
        }
      }
    }

    const hasIntent = isRfqIntent || isCompareIntent || isCartIntent;

    const responseHeaders = new Headers();
    responseHeaders.set('x-conversation-id', conversationId);

    return createDataStreamResponse({
      headers: responseHeaders,
      execute: async (dataStream) => {
        // ── Step 1: Tool Selection ────────────────────────────────────────────────
        // streamAgentTextWithFallback now owns stream consumption.
        // The provider loop catches ALL errors (auth, quota, timeout, AbortError)
        // before they can escape to this execute() callback.
        console.log('[agent] Starting Step 1: Tool selection');
        const { text, toolCalls } = await streamAgentTextWithFallback(
          {
            system: systemPrompt,
            messages: minifiedMessages,
            tools: relevantTools,
            toolChoice: 'auto',
            maxSteps: 1,
            hasIntent: hasIntent,
            sendStart: true,
          },
          dataStream
        );
        console.log('[agent] Step 1 finished. text:', text?.slice(0, 80), 'toolCalls count:', toolCalls?.length ?? 0);
        if (toolCalls && toolCalls.length > 0) {
          console.log('[agent] [ORCHESTRATION LOG] Selected tools:', JSON.stringify(toolCalls, null, 2));
        }

        const executedToolResults: any[] = [];
        if (toolCalls && toolCalls.length > 0) {
          // Save assistant message with tool calls to database
          await saveMessage(supabaseAdmin, conversationId, 'assistant', {
            text: text || '',
            toolCalls,
          });

          // Execute each tool call server-side
          for (const call of toolCalls) {
            const toolName = call.toolName;
            const toolCallId = call.toolCallId;
            const args = call.args;

            console.log(`[agent] Executing tool ${toolName} server-side with args:`, args);

            const toolDefinition = relevantTools[toolName];
            if (!toolDefinition) {
              console.error(`[agent] Tool ${toolName} not found in relevant tools`);
              continue;
            }

            let resultVal: any;
            try {
              resultVal = await toolDefinition.execute(args, {
                toolCallId,
                messages: minifiedMessages,
              });
              console.log(`[agent] [ORCHESTRATION LOG] Raw tool result for ${toolName}:`, JSON.stringify(resultVal, null, 2));
            } catch (execErr: any) {
              console.error(`[agent] Error executing tool ${toolName}:`, execErr);
              resultVal = { error: execErr.message || String(execErr) };
            }

            // Save tool result to database
            await saveMessage(
              supabaseAdmin,
              conversationId,
              'tool',
              resultVal,
              toolName,
              toolCallId
            );

            executedToolResults.push({
              toolCallId,
              toolName,
              result: resultVal,
            });

            // Write tool result manually to the data stream using the SDK protocol format
            const minifiedRes = minifyToolResult(toolName, resultVal);
            dataStream.write(
              formatDataStreamPart('tool_result', {
                toolCallId,
                result: minifiedRes,
              })
            );
          }

          // ── Step 2: Summarization ────────────────────────────────────────────────
          // Uses the same provider fallback chain with sendStart:false to avoid
          // a duplicate message-start frame after Step 1 already opened one.
          console.log('[agent] Starting Step 2: Summarization');

          // Build context: history + assistant tool-call record + tool results
          const assistantContentParts: any[] = [];
          if (text && text.trim()) {
            assistantContentParts.push({ type: 'text', text });
          }
          if (toolCalls && toolCalls.length > 0) {
            assistantContentParts.push(
              ...toolCalls.map((tc: any) => ({
                type: 'tool-call',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                args: tc.args,
              }))
            );
          }

          const step2Messages = [
            ...minifiedMessages,
            {
              role: 'assistant',
              content: assistantContentParts,
            },
            ...executedToolResults.map(res => ({
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolCallId: res.toolCallId,
                  toolName: res.toolName,
                  result: minifyToolResult(res.toolName, res.result),
                }
              ]
            }))
          ];

          console.log('[agent] [ORCHESTRATION LOG] Context passed into Step 2 summarization (step2Messages):', JSON.stringify(step2Messages, null, 2));

          const step2SystemPrompt = systemPrompt + `\n\n## Summarization Guidelines
When summarizing the search results from the tools, present them in a highly structured, professional format:

1. For Vendors/Suppliers found:
If suppliers are found, always include their metadata (Description, Rating, Delivery Success Rate, etc.) in this exact structured format:

Found [Count] matching supplier(s):

• [Supplier Name]
* Description: [Description]
* Rating: [Rating]/5
* Delivery Success Rate: [Delivery Success Rate]% (convert the decimal rate like 0.8 to a percentage like 80%)

Available actions:
1. Search products from this supplier
2. Create an RFQ
3. View supplier profile

2. For general responses or if no suppliers are found, explain the situation clearly and professionally. Do not include placeholder blocks.`;

          await streamAgentTextWithFallback(
            {
              system: step2SystemPrompt,
              messages: step2Messages,
              tools: {},
              toolChoice: 'none',
              maxSteps: 1,
              hasIntent: false,
              sendStart: false,
              onFinish: async ({ text: finalSummaryText }) => {
                if (finalSummaryText) {
                  await saveMessage(supabaseAdmin, conversationId, 'assistant', finalSummaryText);
                }
              },
            },
            dataStream
          );
          console.log('[agent] Step 2 summarization complete.');
        } else {
          // No tools called — Step 1 was the final response. Already saved via onFinish.
          if (text) {
            await saveMessage(supabaseAdmin, conversationId, 'assistant', text);
          }
        }
      },
      onError: (error) => {
        console.error('[agent] Data stream error encountered:', error);
        return error instanceof Error ? error.message : String(error);
      }
    });
  } catch (err: any) {
    console.error('Error in agent chat endpoint:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
