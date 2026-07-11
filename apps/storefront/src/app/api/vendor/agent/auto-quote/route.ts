import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { createAdminClient } from '@ababil/supabase';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// POST /api/vendor/agent/auto-quote — Run auto-quote AI generation
export async function POST(req: Request) {
  try {
    const { rfqId, vendorId } = await req.json();

    if (!rfqId || !vendorId) {
      return NextResponse.json({ success: false, error: 'Missing rfqId or vendorId' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Fetch vendor agent settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('vendor_agent_settings')
      .select('*')
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (settingsError) throw settingsError;

    // If settings don't exist or auto-reply is disabled, exit
    if (!settings || !settings.auto_reply_enabled) {
      return NextResponse.json({
        success: true,
        autoQuoted: false,
        message: 'Auto-reply is disabled or settings not configured for this vendor.',
      });
    }

    // 2. Fetch RFQ details
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select('*')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ success: false, error: 'RFQ not found' }, { status: 404 });
    }

    // Double check if vendor already quoted this RFQ
    const { data: existingQuote } = await supabaseAdmin
      .from('vendor_quotes')
      .select('id')
      .eq('rfq_id', rfqId)
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (existingQuote) {
      return NextResponse.json({
        success: true,
        autoQuoted: false,
        message: 'Vendor has already submitted a quote for this RFQ.',
      });
    }

    // If vendor restricts auto-quotes to certain categories, verify
    if (settings.auto_quote_categories && settings.auto_quote_categories.length > 0) {
      if (!settings.auto_quote_categories.includes(rfq.category)) {
        return NextResponse.json({
          success: true,
          autoQuoted: false,
          message: `RFQ category "${rfq.category}" is not in vendor's auto-quote whitelist.`,
        });
      }
    }

    // 3. Fetch vendor products for catalog context
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price_usd, moq, tiered_pricing')
      .eq('vendor_id', vendorId)
      .eq('status', 'active');

    // Fetch vendor profile for name
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('name')
      .eq('id', vendorId)
      .single();

    const vendorName = vendor?.name || 'Ababil Merchant';

    // 4. Construct prompt and generate quote decision via GPT-4o-mini
    const catalogText = (products || []).map(p => 
      `- ${p.name} (Price: ${p.price_usd} USDC, MOQ: ${p.moq || 1}) - ${p.description?.slice(0, 100)}`
    ).join('\n');

    const systemPrompt = `You are the Automated Sales Agent for **${vendorName}**, a supplier in the Ababil Shop marketplace.
Your job is to analyze a Request for Quotation (RFQ) from a buyer and decide if you want to submit a quote.
If you decide to quote, calculate a competitive unit price and delivery time.

## Vendor Pricing Constraints & Preferences:
- **Maximum Discount Allowed:** ${parseFloat(settings.max_discount_pct)}% off catalog prices.
- **Minimum Target Margin:** ${parseFloat(settings.min_margin_pct)}%.
- **Preferred Delivery Days:** ${settings.preferred_delivery_days} days.
- **Merchant Persona & Notes:** ${settings.agent_persona_notes || 'Always be professional and competitive.'}

## Your Catalog Context:
${catalogText || 'No standard catalog items. We custom quote all requests.'}

## Guidelines:
1. Determine if this RFQ fits your offerings. If the buyer requests services/goods you cannot supply or print, set willQuote=false.
2. The buyer's budget is **${parseFloat(rfq.budget_usdc).toFixed(2)} USDC** for **${rfq.quantity} unit(s)** (Max: **${(parseFloat(rfq.budget_usdc) / rfq.quantity).toFixed(2)} USDC** per unit).
3. Try to quote within their budget if it fits your pricing constraints.
4. Calculate a fair unit price. If you have a matching catalog product, start with its price and optionally discount it (up to the max discount).
5. If willQuote is true, return the unit price (USDC) and delivery time (days).`;

    const userPrompt = `### Incoming RFQ:
- **Title:** ${rfq.title}
- **Type:** ${rfq.rfq_type}
- **Category:** ${rfq.category}
- **Quantity Required:** ${rfq.quantity}
- **Total Budget:** ${parseFloat(rfq.budget_usdc).toFixed(2)} USDC
- **Delivery Deadline:** ${rfq.delivery_deadline || 'No specific deadline'}
- **Location Preference:** ${rfq.location || 'Anywhere'}
- **Description:** ${rfq.description}
- **Additional Requirements:** ${JSON.stringify(rfq.requirements)}`;

    const { text: responseText } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: systemPrompt,
      prompt: userPrompt,
    });

    // We can also extract structured data. To make it extremely robust, let's run a structured outputs call
    const structuredResult = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are a parser. Extract the structured JSON from the sales agent's response. Return valid JSON only.`,
      prompt: `Response:
${responseText}

Extract into this JSON format:
{
  "willQuote": boolean,
  "unitPriceUsdc": number,
  "deliveryDays": number,
  "notes": "Short response note/message to the buyer"
}`,
    });

    let quoteDecision;
    try {
      // Clean JSON string in case LLM wraps it in markdown codeblocks
      const cleanedJson = structuredResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      quoteDecision = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error('Failed to parse quote decision JSON. Raw output:', structuredResult.text);
      // Fallback parser using regex
      const willQuote = responseText.toLowerCase().includes('willquote": true') || responseText.toLowerCase().includes('will_quote": true');
      quoteDecision = {
        willQuote,
        unitPriceUsdc: willQuote ? parseFloat(rfq.budget_usdc) / rfq.quantity * 0.9 : 0,
        deliveryDays: settings.preferred_delivery_days,
        notes: 'Thank you for your request. We have generated an auto-quote.',
      };
    }

    if (!quoteDecision.willQuote || !quoteDecision.unitPriceUsdc) {
      return NextResponse.json({
        success: true,
        autoQuoted: false,
        message: 'Agent reviewed RFQ and decided not to quote.',
      });
    }

    const totalPriceUsdc = quoteDecision.unitPriceUsdc * rfq.quantity;

    // 5. Insert Auto-Generated Quote
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('vendor_quotes')
      .insert({
        rfq_id: rfqId,
        vendor_id: vendorId,
        unit_price_usdc: quoteDecision.unitPriceUsdc,
        total_price_usdc: totalPriceUsdc,
        delivery_days: quoteDecision.deliveryDays || settings.preferred_delivery_days,
        notes: quoteDecision.notes || 'Auto-generated sales quote.',
        auto_generated: true,
        status: 'pending',
        escrow_status: 'none',
      })
      .select()
      .single();

    if (quoteError) {
      throw quoteError;
    }

    return NextResponse.json({
      success: true,
      autoQuoted: true,
      quote: {
        id: quote.id,
        unitPriceUsdc: parseFloat(quote.unit_price_usdc),
        totalPriceUsdc: parseFloat(quote.total_price_usdc),
        deliveryDays: quote.delivery_days,
        notes: quote.notes,
        autoGenerated: true,
      },
    });
  } catch (err: any) {
    console.error('Error running vendor auto-quote:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
