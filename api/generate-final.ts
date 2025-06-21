import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, selections } = req.body as {
    prompt?: string;
    selections?: { label: string; value: string | number }[];
  };
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const controls = selections?.map(s => `${s.label}: ${s.value}`).join(', ') ?? '';
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are a concise assistant that writes well-structured answers as bullet points.' },
        { role: 'user', content: `Prompt: ${prompt}\nControls: ${controls}` }
      ]
    });

    const text = completion.choices[0].message.content;
    return res.status(200).json({ finalPrompt: text });
  } catch (err: any) {
    console.error('[gen-final] error', err?.message);
    return res.status(500).json({ error: 'Failed to generate output' });
  }
}
