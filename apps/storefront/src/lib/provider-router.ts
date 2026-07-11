import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LanguageModel, streamText, generateText } from 'ai';
import fs from 'fs';
import path from 'path';

export function debugLog(message: string, data?: any) {
  try {
    const logPath = path.resolve(process.cwd(), 'agent-debug.log');
    const timestamp = new Date().toISOString();
    const dataStr = data ? ' ' + (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : '';
    fs.appendFileSync(logPath, `[${timestamp}] ${message}${dataStr}\n`, 'utf8');
  } catch (e) {
    console.error('[ProviderRouter] Failed to write to agent-debug.log', e);
  }
}


export interface RegisteredProvider {
  name: string;
  getApiKey: () => string | undefined;
  getSDKClient: () => any;
  getDefaultModel: () => string;
}

export const PROVIDER_REGISTRY: Record<string, RegisteredProvider> = {
  gemini: {
    name: 'gemini',
    getApiKey: () => process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
    getSDKClient: () => createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '',
    }),
    getDefaultModel: () => process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  groq: {
    name: 'groq',
    getApiKey: () => process.env.GROQ_API_KEY,
    getSDKClient: () => createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY || '',
    }),
    getDefaultModel: () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  openrouter: {
    name: 'openrouter',
    getApiKey: () => process.env.OPENROUTER_API_KEY,
    getSDKClient: () => createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
    }),
    getDefaultModel: () => process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
  },
  openai: {
    name: 'openai',
    getApiKey: () => process.env.OPENAI_API_KEY,
    getSDKClient: () => createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    }),
    getDefaultModel: () => process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
};

try {
  const gKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const exists = !!gKey;
  const envVarName = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'GOOGLE_GENERATIVE_AI_API_KEY' : (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'NONE');
  const isEnabled = exists;
  console.log(`[ProviderRouter] Gemini Status - Key Exists: ${exists}, Env Var: ${envVarName}, Enabled: ${isEnabled}`);
  debugLog(`[ProviderRouter] Gemini Status - Key Exists: ${exists}, Env Var: ${envVarName}, Enabled: ${isEnabled}`);
} catch (e) {}


export function getProviderPriorityList(): string[] {
  const primary = process.env.PRIMARY_AI_PROVIDER || 'gemini';
  const secondary = process.env.SECONDARY_AI_PROVIDER || 'groq';
  const tertiary = process.env.TERTIARY_AI_PROVIDER || 'openrouter';
  
  const list = [primary, secondary, tertiary];
  
  for (const name of Object.keys(PROVIDER_REGISTRY)) {
    if (!list.includes(name)) {
      list.push(name);
    }
  }
  
  return list.filter(name => !!PROVIDER_REGISTRY[name]);
}

export function getPrimaryModel(): LanguageModel {
  const priorityList = getProviderPriorityList();
  for (const providerName of priorityList) {
    const provider = PROVIDER_REGISTRY[providerName];
    if (provider && provider.getApiKey()) {
      const sdkClient = provider.getSDKClient();
      const modelName = provider.getDefaultModel();
      return sdkClient(modelName);
    }
  }
  throw new Error('[ProviderRouter] No enabled AI provider found');
}

// ── Minimal structural type for the DataStreamWriter ─────────────────────────
// Matches the execute callback param type from createDataStreamResponse
type DataStreamWriterLike = {
  write: (data: string) => void;
};

export interface RouterStreamOptions {
  system: string;
  messages: any[];
  tools: any;
  toolChoice: 'auto' | 'required' | 'none';
  maxSteps: number;
  hasIntent?: boolean;
  /**
   * Set to false for Step 2 (summarization) so the stream doesn't send a
   * duplicate message-start frame after Step 1 has already opened one.
   * Defaults to true.
   */
  sendStart?: boolean;
  onFinish?: (options: { text: string; toolCalls: any[]; toolResults: any[]; usage?: any }) => Promise<void> | void;
}

/**
 * Stream agent text through the provider fallback chain.
 *
 * ARCHITECTURE NOTE
 * -----------------
 * The previous implementation returned a raw StreamTextResult and deferred
 * stream consumption to route.ts. This caused AbortErrors (from the 8-second
 * timeout) to surface OUTSIDE the catch block — inside the createDataStreamResponse
 * execute callback — making fallback impossible.
 *
 * This implementation consumes `result.toDataStream()` INSIDE the provider loop
 * using Promise.race + a per-read deadline. Any error (auth failure, quota,
 * network, timeout, AbortError) is caught by the catch block and triggers the
 * next provider in the chain.
 *
 * @param options  Router configuration (system, messages, tools, etc.)
 * @param dataStream  The DataStreamWriter from createDataStreamResponse.execute
 * @returns  Resolved { text, toolCalls } once a provider succeeds
 */
export async function streamAgentTextWithFallback(
  options: RouterStreamOptions,
  dataStream: DataStreamWriterLike
): Promise<{ text: string; toolCalls: any[] }> {
  debugLog('Starting streamAgentTextWithFallback', { toolChoice: options.toolChoice, hasIntent: options.hasIntent });
  if (options.toolChoice === 'none') {
    console.log('[ProviderRouter] [ORCHESTRATION LOG] System Prompt sent to summarizer:', options.system);
    console.log('[ProviderRouter] [ORCHESTRATION LOG] Chat Messages sent to summarizer:', JSON.stringify(options.messages, null, 2));
  }
  const priorityList = getProviderPriorityList();
  let lastError: any = null;
  const TIMEOUT_MS = 8000;
  const sendStart = options.sendStart !== false; // default true

  for (const providerName of priorityList) {
    const provider = PROVIDER_REGISTRY[providerName];
    if (!provider) continue;

    const apiKey = provider.getApiKey();
    if (!apiKey) {
      console.log(`[ProviderRouter] Skipping provider ${providerName} (API key not configured)`);
      debugLog(`Skipping provider ${providerName} (API key not configured)`);
      continue;
    }

    const sdkClient = provider.getSDKClient();
    const modelName = provider.getDefaultModel();
    const model = sdkClient(modelName);

    // Only force 'required' on fallback providers when intent is present AND
    // tools exist AND toolChoice isn't already 'none'
    const hasTools = Object.keys(options.tools || {}).length > 0;
    const finalToolChoice = (
      providerName !== priorityList[0] &&
      options.hasIntent &&
      hasTools &&
      options.toolChoice !== 'none'
    )
      ? 'required'
      : options.toolChoice;

    console.log(`[ProviderRouter] Attempting stream using provider: ${providerName}, model: ${modelName}`);
    debugLog(`Attempting stream using provider: ${providerName}, model: ${modelName}`);

    const startTime = Date.now();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const result = streamText({
        model,
        system: options.system,
        messages: options.messages,
        // Don't pass tools/toolChoice when there are no tools (avoids provider errors)
        ...(hasTools ? { tools: options.tools, toolChoice: finalToolChoice } : {}),
        maxSteps: options.maxSteps,
        maxRetries: 0,
        maxTokens: 4096,
        providerOptions: {
          openai: {
            parallelToolCalls: false,
          },
        },
      });

      // ── KEY CHANGE ────────────────────────────────────────────────────────
      // Consume result.toDataStream() inside this try block.
      // Any provider failure (auth error, network error, quota exceeded, or
      // timeout) now surfaces HERE as a thrown error and is caught below,
      // allowing the loop to continue to the next provider.
      // ─────────────────────────────────────────────────────────────────────
      console.log(`[ProviderRouter] [DEBUG] Calling toDataStream`);
      const readable = result.toDataStream({
        experimental_sendStart: sendStart,
      } as any);
      console.log(`[ProviderRouter] [DEBUG] Calling getReader`);
      reader = readable.getReader();
      const decoder = new TextDecoder();
      console.log(`[ProviderRouter] [DEBUG] Entering read loop. TIMEOUT_MS: ${TIMEOUT_MS}`);
      debugLog(`Stream response created. Starting read loop.`);

      let buffer = '';
      let accumulatedText = '';
      const parsedToolCalls: any[] = [];
      let parsedUsage: any = null;
      let streamHasError = false;

      let stepNum = 0;
      while (true) {
        stepNum++;
        const remaining = TIMEOUT_MS;
        
        let timeoutId: any;
        const readPromise = (async () => {
          try {
            const res = await reader.read();
            return res;
          } catch (readErr: any) {
            debugLog(`[${providerName}] reader.read() threw:`, readErr.message || readErr);
            throw readErr;
          }
        })();

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            debugLog(`[${providerName}] Timeout fired for ${providerName} after ${TIMEOUT_MS}ms`);
            reject(new Error(`[ProviderRouter] Provider ${providerName} timed out after ${TIMEOUT_MS}ms`));
          }, remaining);
        });

        const { done, value } = await Promise.race([readPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        if (done) break;

        const decoded = decoder.decode(value, { stream: true });
        buffer += decoded;
        let lineEndIndex;
        const filteredLines: string[] = [];
        while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineEndIndex);
          buffer = buffer.slice(lineEndIndex + 1);

          if (!line.trim()) {
            filteredLines.push(line);
            continue;
          }

          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) {
            filteredLines.push(line);
            continue;
          }

          const prefix = line.slice(0, colonIndex);
          const rawData = line.slice(colonIndex + 1);

          try {
            const parsed = JSON.parse(rawData);
            if (prefix === '0') {
              accumulatedText += parsed;
              filteredLines.push(line);
            } else if (prefix === '9') {
              parsedToolCalls.push(parsed);
              filteredLines.push(line);
            } else if (prefix === 'e') {
              if (parsed.usage) {
                parsedUsage = parsed.usage;
              }
              filteredLines.push(line);
            } else if (prefix === '3') {
              streamHasError = true;
              debugLog(`[${providerName}] Stream error frame detected (suppressed for fallback):`, parsed);
              console.log(`[ProviderRouter] [DEBUG] Stream error frame detected (suppressed for fallback):`, parsed);
            } else {
              filteredLines.push(line);
            }
          } catch (err) {
            filteredLines.push(line);
          }
        }

        if (filteredLines.length > 0) {
          dataStream.write(filteredLines.join('\n') + '\n');
        }
      }

      console.log(`[ProviderRouter] [DEBUG] Loop exited. Checking stream state...`);
      
      // Flush any remaining partial line in buffer
      if (buffer.trim()) {
        const colonIndex = buffer.indexOf(':');
        if (colonIndex !== -1) {
          const prefix = buffer.slice(0, colonIndex);
          const rawData = buffer.slice(colonIndex + 1);
          try {
            const parsed = JSON.parse(rawData);
            if (prefix === '3') {
              streamHasError = true;
              debugLog(`[${providerName}] Stream error frame in remainder:`, parsed);
              console.log(`[ProviderRouter] [DEBUG] Stream error frame detected in remainder:`, parsed);
            } else {
              dataStream.write(buffer);
            }
          } catch (err) {
            dataStream.write(buffer);
          }
        } else {
          dataStream.write(buffer);
        }
      }

      debugLog(`[${providerName}] Stream finished. streamHasError=${streamHasError}, textLen=${accumulatedText.length}, toolCalls=${parsedToolCalls.length}`);

      if (streamHasError || (accumulatedText.length === 0 && parsedToolCalls.length === 0)) {
        throw new Error('[ProviderRouter] Stream completed but returned an error frame or generated no content');
      }

      console.log(`[ProviderRouter] Provider ${providerName} (${modelName}) stream finished. Latency: ${Date.now() - startTime}ms`);
      console.log(`[FINAL PROVIDER USED] ${providerName} (${modelName})`);
      debugLog(`[FINAL PROVIDER USED] ${providerName} (${modelName})`);
      if (parsedUsage) {
        console.log(
          `[Token Usage] Provider: ${providerName}, Model: ${modelName}, ` +
          `Prompt Tokens: ${parsedUsage.promptTokens}, Completion Tokens: ${parsedUsage.completionTokens}, ` +
          `Total Tokens: ${parsedUsage.totalTokens}`
        );
      }

      if (options.onFinish) {
        await options.onFinish({ text: accumulatedText, toolCalls: parsedToolCalls, toolResults: [], usage: parsedUsage });
      }

      return { text: accumulatedText, toolCalls: parsedToolCalls };

    } catch (err: any) {
      console.log(`[ProviderRouter] [DEBUG] catch block entered. Error:`, err.message || err);
      debugLog(`[${providerName}] catch block entered. Error:`, err.message || err);
      // Cancel the reader so the underlying HTTP request is aborted
      if (reader) {
        try { reader.cancel(); } catch {}
      }
      lastError = err;
      const latency = Date.now() - startTime;
      console.warn(
        `[ProviderRouter] Provider ${providerName} (${modelName}) FAILED after ${latency}ms. ` +
        `Fallback reason: ${err.message || err}`
      );
      debugLog(`[${providerName}] Provider FAILED after ${latency}ms. Fallback reason: ${err.message || err}`);
      // Loop continues to next provider
    }
  }

  debugLog(`All AI providers failed. Last error:`, lastError?.message || lastError);
  throw new Error(`[ProviderRouter] All AI providers failed. Last error: ${lastError?.message || lastError}`);
}

export interface RouterGenerateOptions {
  prompt: string;
  system?: string;
  maxTokens?: number;
}

export async function generateAgentTextWithFallback(options: RouterGenerateOptions) {
  const priorityList = getProviderPriorityList();
  let lastError: any = null;
  
  for (const providerName of priorityList) {
    const provider = PROVIDER_REGISTRY[providerName];
    if (!provider) continue;
    
    const apiKey = provider.getApiKey();
    if (!apiKey) continue;
    
    const sdkClient = provider.getSDKClient();
    const modelName = provider.getDefaultModel();
    const model = sdkClient(modelName);
    
    const startTime = Date.now();
    try {
      const result = await generateText({
        model,
        prompt: options.prompt,
        system: options.system,
        maxTokens: options.maxTokens ?? 1024,
        maxRetries: 0,
      });
      const latency = Date.now() - startTime;
      const usage = result.usage;
      console.log(`[ProviderRouter] generateText succeeded. Provider: ${providerName}, Model: ${modelName}, Latency: ${latency}ms`);
      console.log(`[FINAL PROVIDER USED] ${providerName} (${modelName})`);
      if (usage) {
        console.log(`[Token Usage] Provider: ${providerName}, Model: ${modelName}, Prompt Tokens: ${usage.promptTokens}, Completion Tokens: ${usage.completionTokens}, Total Tokens: ${usage.totalTokens}`);
      }
      return result;
    } catch (err: any) {
      const latency = Date.now() - startTime;
      lastError = err;
      console.warn(`[ProviderRouter] generateText for provider ${providerName} (${modelName}) failed after ${latency}ms: ${err.message || err}`);
    }
  }
  
  throw new Error(`[ProviderRouter] generateAgentTextWithFallback failed. Last error: ${lastError?.message || lastError}`);
}
