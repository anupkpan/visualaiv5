import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { prompt, selections } = req.body as {
    prompt?: string;
    selections?: { label: string; value: string | number }[];
  };

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const result = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Answer the prompt clearly and concisely.' },
        { role: 'user', content: JSON.stringify({ prompt, selections }, null, 2) }
      ],
      temperature: 0.8
    });

    const content = result.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ finalPrompt: content });
  } catch (err: any) {
    console.error('API ERROR:', err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
