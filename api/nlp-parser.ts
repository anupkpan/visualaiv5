import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt } = req.body as { prompt?: string };
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    /* ask GPT to return at most 6 controls (sliders & option groups) */
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',              // cheaper & fast; use gpt-4 if you prefer
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `Return STRICT JSON:

{
  "controls": [
    { "label": "Spice Level", "type": "slider", "min": 0, "max": 10, "default": 5, "unit": "" },
    { "label": "Style", "type": "options", "options": ["Hyderabadi","Lucknowi"], "default": 0 }
  ]
}

Rules:
- 3–6 controls total
- mix of "slider" and "options"
- No markdown, no extra keys`
        },
        { role: 'user', content: prompt }
      ]
    });

    let json = completion.choices[0].message.content!.trim();
    json = json.replace(/```json|```/g, '');

    const parsed = JSON.parse(json);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('[nlp-parser] error', err?.message);
    /* fallback default sliders */
    return res.status(200).json({
      controls: [
        { label: 'Tone', type: 'slider', min: 0, max: 100, default: 50 },
        { label: 'Length', type: 'slider', min: 0, max: 100, default: 50 }
      ]
    });
  }
}
