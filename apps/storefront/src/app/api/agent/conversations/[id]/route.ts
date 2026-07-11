import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@ababil/supabase';
import { cookies } from 'next/headers';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// GET /api/agent/conversations/[id] — Retrieve conversation messages history
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: conversationId } = params;

    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Verify conversation ownership
    const { data: conv, error: convError } = await supabaseAdmin
      .from('agent_conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    if (conv.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Retrieve messages
    const { data: dbMessages, error: msgError } = await supabaseAdmin
      .from('agent_messages')
      .select('id, role, content, tool_name, tool_call_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Map DB messages to Vercel AI SDK Message format
    const mapped = (dbMessages || []).map((m: any) => {
      const msg: any = {
        id: m.id,
        role: m.role,
        content: '',
      };

      if (m.role === 'user') {
        msg.content = typeof m.content === 'string' ? m.content : m.content.text || JSON.stringify(m.content);
      } else if (m.role === 'assistant') {
        if (m.content && typeof m.content === 'object') {
          msg.content = m.content.text || '';
          if (m.content.toolCalls) {
            msg.toolCalls = m.content.toolCalls;
          }
        } else {
          msg.content = String(m.content);
        }
      } else if (m.role === 'tool') {
        // Tool responses are mapped to toolCall formats in useChat
        msg.role = 'assistant';
        msg.content = '';
        msg.toolCalls = [
          {
            id: m.tool_call_id,
            type: 'function',
            state: 'result',
            function: {
              name: m.tool_name,
              arguments: '{}',
            },
            result: m.content,
          },
        ];
      }

      return msg;
    });

    return NextResponse.json({ success: true, messages: mapped });
  } catch (err: any) {
    console.error('Error fetching conversation messages:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
