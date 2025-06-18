// api/nlp-parser.ts
import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
  const body = await req.json();
  const prompt = body.prompt;

  if (!prompt) {
    return new NextResponse(JSON.stringify({ error: 'Missing prompt' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new NextResponse(JSON.stringify({ message: `Prompt received: ${prompt}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
