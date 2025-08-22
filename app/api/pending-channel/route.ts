import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for pending channels (replace with Redis or DB for production)
const pendingChannels: Record<string, any> = {};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Expecting: { owner, name, symbol, description, twitter, discord, imageUri, bannerImage }
    if (!data.owner || !data.name || !data.symbol) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Use a unique key, e.g., owner+symbol
    const key = `${data.owner.toLowerCase()}-${data.symbol.toUpperCase()}`;
    pendingChannels[key] = { ...data, createdAt: new Date().toISOString() };
    return NextResponse.json({ success: true, key });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  // For debugging: list all pending channels
  return NextResponse.json(pendingChannels);
}
