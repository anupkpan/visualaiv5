import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const SYS = `You are a UI-parameter extractor.
Return ONLY valid strict JSON in this format:

{
  "controls": [
    { "label": "Tone",  "type": "slider",  "min": 0, "max": 100, "step": 1, "default": 50, "unit": "%" },
    { "label": "Style", "type": "options", "options": ["A","B","C"], "default": "A" }
  ]
}

No markdown fences, no extra text. Max 6 controls.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt } = req.body as { prompt?: string };
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',                // or gpt-4 / 3.5-turbo
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user',   content: prompt }
      ],
    });

    let raw = completion.choices[0].message?.content ?? '{}';

    // Strip ```json fences if model added them
    raw = raw.replace(/```json|```/g, '').trim();

    // Always attempt to parse
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn('Invalid JSON from OpenAI:', raw);
      return res.status(500).json({ error: 'Invalid JSON from OpenAI' });
    }

    return res.status(200).json(data);   // <-- frontend now receives real JSON
  } catch (err: any) {
    console.error('API ERROR:', err?.message || err);
    return res.status(500).json({ error: 'Internal Server Error', detail: err?.message });
  }
}
