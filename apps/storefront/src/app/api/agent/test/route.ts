import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { tool } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const mockSearchTool = tool({
  description: 'Search for products',
  parameters: z.object({
    query: z.string().describe('Search query'),
    inStockOnly: z.boolean().optional().default(true),
  }),
  execute: async ({ query }) => ({
    found: true,
    products: [
      { id: 'aaa-111-aaa-111-aaa111aa', name: 'Mock Product A', priceUsdc: 2.50, rating: 4.9 },
      { id: 'bbb-222-bbb-222-bbb222bb', name: 'Mock Product B', priceUsdc: 3.99, rating: 4.7 },
      { id: 'ccc-333-ccc-333-ccc333cc', name: 'Mock Product C', priceUsdc: 1.50, rating: 4.5 },
    ],
  }),
});

const mockCompareTool = tool({
  description: 'Compare products by their IDs. Must be called with real UUIDs from search_products.',
  parameters: z.object({
    productIds: z.array(z.string()).min(2).max(5).describe('Array of 2-5 product UUIDs'),
  }),
  execute: async ({ productIds }) => ({
    found: true,
    products: productIds.map((id, i) => ({
      id,
      name: `Product ${i + 1}`,
      priceUsdc: 2.5 + i,
      rating: 4.9 - i * 0.1,
    })),
    recommendation: 'Product 1 is best value',
  }),
});

export async function GET() {
  const groq = createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY || '' });

  const results: Record<string, any> = {};

  // Test 70b with tool calls (compare workflow)
  try {
    const res = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: 'You are a product assistant. Always call search_products first to get UUIDs, then call compare_products with those UUIDs. Never guess IDs.',
      prompt: 'Compare the top 3 tech products',
      tools: { search_products: mockSearchTool, compare_products: mockCompareTool },
      maxSteps: 4,
      maxRetries: 0,
      providerOptions: { openai: { parallelToolCalls: false } },
    });
    results['llama-3.3-70b-versatile:toolcall'] = {
      success: true,
      text: res.text.slice(0, 200),
      toolCallsCount: res.toolCalls?.length ?? 0,
      steps: res.steps?.length ?? 0,
      stepTypes: res.steps?.map(s => s.stepType) ?? [],
    };
  } catch (err: any) {
    results['llama-3.3-70b-versatile:toolcall'] = { success: false, error: err.message?.slice(0, 400) };
  }

  // Test 8b for comparison
  try {
    const res = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: 'You are a product assistant. Always call search_products first to get UUIDs, then call compare_products with those UUIDs. Never guess IDs.',
      prompt: 'Compare the top 3 tech products',
      tools: { search_products: mockSearchTool, compare_products: mockCompareTool },
      maxSteps: 4,
      maxRetries: 0,
      providerOptions: { openai: { parallelToolCalls: false } },
    });
    results['llama-3.1-8b-instant:toolcall'] = {
      success: true,
      text: res.text.slice(0, 200),
      toolCallsCount: res.toolCalls?.length ?? 0,
      steps: res.steps?.length ?? 0,
    };
  } catch (err: any) {
    results['llama-3.1-8b-instant:toolcall'] = { success: false, error: err.message?.slice(0, 400) };
  }

  return NextResponse.json(results);
}
