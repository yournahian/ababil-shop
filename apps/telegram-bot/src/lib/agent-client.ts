import dotenv from 'dotenv';
dotenv.config();

const STOREFRONT_URL = process.env.STOREFRONT_URL || 'http://localhost:3000';

interface AgentResponse {
  success: boolean;
  text?: string;
  error?: string;
  unauthorized?: boolean;
}

export async function sendToAgent(
  chatId: number,
  message: string
): Promise<AgentResponse> {
  try {
    const response = await fetch(`${STOREFRONT_URL}/api/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-chat-id': String(chatId),
        'x-telegram-bot-token': process.env.TELEGRAM_BOT_TOKEN || '',
      },
      body: JSON.stringify({
        message,
        channel: 'telegram',
        externalChatId: String(chatId),
      }),
    });

    if (response.status === 401) {
      const data = await response.json();
      return {
        success: false,
        unauthorized: true,
        error: data.message || 'Please link your account first.',
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Server responded with HTTP ${response.status}: ${errText.slice(0, 100)}`,
      };
    }

    // Buffer the stream
    const reader = response.body;
    if (!reader) {
      return {
        success: false,
        error: 'Empty response stream received.',
      };
    }

    let text = '';
    let buffer = '';
    const decoder = new TextDecoder();
    
    // Node.js readable stream iteration
    const stream = reader as any;
    for await (const chunk of stream) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last element in buffer (might be incomplete)
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('0:')) {
          try {
            // Strip the protocol prefix '0:' and parse JSON string
            const jsonStr = line.slice(2).trim();
            const parsed = JSON.parse(jsonStr);
            text += parsed;
          } catch {
            // Fallback if not double-quoted JSON string
            text += line.slice(2);
          }
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer && buffer.startsWith('0:')) {
      try {
        const jsonStr = buffer.slice(2).trim();
        const parsed = JSON.parse(jsonStr);
        text += parsed;
      } catch {
        text += buffer.slice(2);
      }
    }

    return {
      success: true,
      text: text.trim(),
    };
  } catch (err: any) {
    console.error('Error in agent client:', err);
    return {
      success: false,
      error: err.message || 'Failed to connect to agent backend.',
    };
  }
}
