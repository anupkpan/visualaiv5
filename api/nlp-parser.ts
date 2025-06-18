import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const SYS = `Return STRICT JSON format:
{
  "controls": [
    { "label": "...", "type": "slider", "min": 0, "max": 100, "step": 1, "default": 50, "unit": "%" },
    { "label": "...", "type": "options", "options": ["A", "B", "C"], "default": "B" }
  ]
}
Only return valid JSON. No markdown, no text. Max 6 controls.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const result = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    const content = result.choices?.[0]?.message?.content ?? '';

    try {
      const parsed = JSON.parse(content);
      res.status(200).json(parsed);
    } catch (err) {
      console.error('Invalid JSON from OpenAI:', content);
      res.status(500).json({ error: 'Invalid JSON from OpenAI' });
    }
  } catch (err: any) {
    console.error('API ERROR:', err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
