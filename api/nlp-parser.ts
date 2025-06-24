import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

// Structured instruction for the model
const SYS = `Return STRICT JSON format:
{
  "controls": [
    { "label": "...", "type": "slider", "min": 0, "max": 100, "step": 1, "default": 50, "unit": "%" },
    { "label": "...", "type": "options", "options": ["A", "B", "C"], "default": "B" }
  ]
}
Only return valid JSON. No markdown, no extra text. Max 6 controls.`;

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt } = req.body as { prompt?: string };
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: prompt }
      ]
    });

    const parsed = JSON.parse(result.choices[0].message.content || '{}');
    return res.status(200).json(parsed);

  } catch (err: any) {
    console.error('[nlp-parser] error', err.message);
    return res.status(500).json({
      error: 'Failed to generate controls',
      details: err.message
    });
  }
}
