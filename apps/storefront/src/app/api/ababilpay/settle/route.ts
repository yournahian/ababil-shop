import { NextRequest, NextResponse } from 'next/server';

const ABABIL_API = 'https://testnetv1.ababilpay.xyz/api/v1';
const ABABIL_API_KEY = process.env.ABABIL_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${ABABIL_API}/x402/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ABABIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`AbabilPay returned non-JSON: ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error?.message || data?.message || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ababilpay/settle] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
