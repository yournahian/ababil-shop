/**
 * Provider Router Fallback Test
 * Run with: node test-fallback.mjs
 * 
 * This script directly invokes the provider router logic with
 * a deliberately broken Gemini API key to prove fallback to Groq.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// ── Provider Registry (mirrors provider-router.ts) ────────────────────────

const BROKEN_GEMINI_KEY = 'INVALID_KEY_FOR_TEST_xxxxxxxxxxxxxxxxxxx';
const GROQ_API_KEY     = process.env.GROQ_API_KEY || '';
const OR_API_KEY       = process.env.OPENROUTER_API_KEY || '';

const providers = [
  {
    name: 'gemini',
    model: 'gemini-2.5-flash',
    getClient: () => createGoogleGenerativeAI({ apiKey: BROKEN_GEMINI_KEY }),
  },
  {
    name: 'groq',
    model: 'llama-3.1-8b-instant',
    getClient: () => createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: GROQ_API_KEY }),
  },
  {
    name: 'openrouter',
    model: 'google/gemini-2.5-flash',
    getClient: () => createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: OR_API_KEY }),
  },
];

// ── Fallback loop (mirrors streamAgentTextWithFallback) ────────────────────

async function runWithFallback(prompt) {
  let lastError = null;

  for (const providerDef of providers) {
    const client    = providerDef.getClient();
    const model     = client(providerDef.model);
    const startTime = Date.now();

    console.log(`\n[ProviderRouter] Attempting provider: ${providerDef.name}, model: ${providerDef.model}`);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => {
      console.warn(`[ProviderRouter] ${providerDef.name} timed out after 8s`);
      controller.abort();
    }, 8000);

    try {
      const result = await streamText({
        model,
        prompt,
        maxRetries: 0,
        maxTokens:  256,
        abortSignal: controller.signal,
      });

      // Consume the stream to get the text
      let finalText = '';
      for await (const chunk of result.textStream) {
        finalText += chunk;
      }

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      const usage   = await result.usage;
      console.log(`[ProviderRouter] SUCCESS. Provider: ${providerDef.name}, Latency: ${latency}ms`);
      console.log(`[Token Usage] Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}, Total: ${usage.totalTokens}`);
      console.log(`[Response] "${finalText.slice(0, 150)}..."`);
      return { provider: providerDef.name, model: providerDef.model, text: finalText };

    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      const latency = Date.now() - startTime;
      console.warn(`[ProviderRouter] FAILED. Provider: ${providerDef.name}, after ${latency}ms`);
      console.warn(`[ProviderRouter] Fallback reason: ${err.message?.slice(0, 200)}`);
    }
  }

  throw new Error(`[ProviderRouter] All providers failed. Last: ${lastError?.message}`);
}

// ── Run ────────────────────────────────────────────────────────────────────

console.log('=== Provider Router Fallback Test ===');
console.log('Gemini key is intentionally broken:', BROKEN_GEMINI_KEY.slice(0, 15) + '...');
console.log('Expected flow: Gemini FAIL → Groq SUCCESS');
console.log('=====================================================');

runWithFallback('In one sentence, list two types of fabric used in hoodies.')
  .then(result => {
    console.log(`\n✅ Final provider used: ${result.provider} (${result.model})`);
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ All providers failed:', err.message);
    process.exit(1);
  });
