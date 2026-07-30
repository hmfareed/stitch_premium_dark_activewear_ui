import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getApiKey(): string {
  if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim()) {
    return process.env.NVIDIA_API_KEY.trim();
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('NVIDIA_API_KEY=')) {
          return trimmed.substring('NVIDIA_API_KEY='.length).trim();
        }
      }
    }
  } catch (err) {
    console.warn('Could not read .env.local fallback for NVIDIA_API_KEY:', err);
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'NVIDIA_API_KEY environment variable is not configured.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      message,
      history = [],
      isPidgin = false,
      user = null,
      catalogSummary = '',
      sessionState = {},
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message field is required.' },
        { status: 400 }
      );
    }

    const userName = user?.name ? user.name.split(' ')[0] : 'Valued Customer';
    const userRole = user?.role || 'customer';

    // Construct rich system prompt tailored for AfriCart Multi-Vendor Marketplace
    const systemPrompt = `You are AfriCart AI — powered by NVIDIA Llama 3.3 70B. You are the official 24/7 personal shopping assistant, customer service agent, and marketplace advisor for AfriCart (Ghana's top multi-vendor e-commerce platform).

Context & Platform Details:
1. User: ${userName} (Role: ${userRole})
2. Language Mode: ${isPidgin ? 'Ghanaian Pidgin English (e.g., "How far boss!", "No wahala", "Wetin you dey find?")' : 'Standard English (warm, helpful, concise, smart)'}
3. Currency: Ghanaian Cedi (GHS or GH₵). Quote prices in GHS/GH₵.
4. Payments: Mobile Money (MTN MoMo, Telecel Cash, AT Money), Paystack, Card, Wallet.
5. Delivery: Nationwide fast delivery across Accra, Kumasi, Takoradi, Tamale, Cape Coast, etc.

Live Product Catalog Snippet:
${catalogSummary ? catalogSummary : '- Browse Electronics, Fashion, Appliances, Phones, Laptops, Beauty, and Ghanaian Artisanal Products.'}

Response Instructions:
- Provide intelligent, human-like, energetic, and highly informative responses.
- If asked about products, recommend specific items from the catalog snippet above with prices in GHS.
- Use clear markdown, bold key words, bullet points, and appropriate emoji.
- Keep answers under 200 words for fast mobile reading unless step-by-step guidance is asked.`;

    const formattedHistory = history
      .slice(-8)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message },
    ];

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 600,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`NVIDIA API response error (${response.status}):`, errText);
      return NextResponse.json(
        { success: false, error: `NVIDIA API returned ${response.status}: ${errText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const replyText = data?.choices?.[0]?.message?.content || '';

    if (!replyText) {
      return NextResponse.json(
        { success: false, error: 'Empty completion received from NVIDIA API.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: replyText.trim(),
      modelUsed: 'NVIDIA Llama 3.3 70B',
    });
  } catch (error: any) {
    console.error('Error in NVIDIA AI Chat Route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
