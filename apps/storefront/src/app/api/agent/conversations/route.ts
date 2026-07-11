import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@ababil/supabase';
import { cookies } from 'next/headers';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// GET /api/agent/conversations — List user conversations
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: conversations, error } = await supabaseAdmin
      .from('agent_conversations')
      .select('id, title, status, source, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, conversations });
  } catch (err: any) {
    console.error('Error listing conversations:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/agent/conversations — Create a new conversation
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title = 'New Conversation', source = 'web' } = await req.json().catch(() => ({}));

    const supabaseAdmin = getAdminClient();
    const { data: conversation, error } = await supabaseAdmin
      .from('agent_conversations')
      .insert({
        user_id: user.id,
        title,
        source,
        status: 'active',
      })
      .select('id, title, status, source, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, conversation });
  } catch (err: any) {
    console.error('Error creating conversation:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
