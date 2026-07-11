const fs = require('fs');
const path = require('path');

// Load environment variables from .env
function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
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
      process.env[key] = val;
    }
    console.log(`Loaded env from ${filePath}`);
  } else {
    console.log(`Env file not found: ${filePath}`);
  }
}

loadEnv(path.join(__dirname, '.env'));
loadEnv(path.join(__dirname, 'apps', 'storefront', '.env'));

const { createOpenAI } = require('@ai-sdk/openai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { streamText } = require('ai');

const PROVIDERS = {
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
    getDefaultModel: () => process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
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

async function testProvider(name) {
  console.log(`\n=== Testing ${name} ===`);
  const p = PROVIDERS[name];
  const apiKey = p.getApiKey();
  console.log(`API Key configured: ${apiKey ? 'Yes' : 'No'}`);
  if (!apiKey) return;

  try {
    const client = p.getSDKClient();
    const modelName = p.getDefaultModel();
    const model = client(modelName);

    console.log(`Calling streamText with model ${modelName}...`);
    const result = streamText({
      model,
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Say hello!' }],
      maxTokens: 50,
      maxRetries: 0,
    });

    const reader = result.toDataStream().getReader();
    const decoder = new TextDecoder();
    let text = '';
    let hasErrorFrame = false;
    let chunksCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunksCount++;
      const decoded = decoder.decode(value, { stream: true });
      const lines = decoded.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        const prefix = line.slice(0, colonIndex);
        const rawData = line.slice(colonIndex + 1);
        if (prefix === '0') {
          text += JSON.parse(rawData);
        } else if (prefix === '3') {
          hasErrorFrame = true;
          console.log(`[Error frame detected]:`, rawData);
        }
      }
    }

    console.log(`Result: Chunks: ${chunksCount}, ErrorFrame: ${hasErrorFrame}, Text: "${text.trim()}"`);
  } catch (err) {
    console.error(`Error testing ${name}:`, err);
  }
}

async function runAll() {
  for (const name of Object.keys(PROVIDERS)) {
    await testProvider(name);
  }
}

runAll();
