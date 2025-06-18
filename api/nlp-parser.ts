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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: prompt },
      ],
    });

    const parsed = result.choices[0].message?.content ?? '{}';
    res.status(200).send(parsed);
  } catch (error: any) {
    console.error('API ERROR:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
