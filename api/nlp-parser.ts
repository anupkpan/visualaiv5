import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYS = `
You are an AI UI-assistant.
Return ONLY JSON like:
{
  "controls": [
    { "label": "Spice Level", "type": "slider", "min": 0, "max": 10, "default": 5 },
    { "label": "Style", "type": "options", "options": ["Hyderabadi","Lucknowi"], "default": 0 }
  ]
}
No markdown, no text, max 6 controls.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const reply = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: prompt }
      ]
    });

    let txt = reply.choices[0].message.content ?? '';
    txt = txt.replace(/```json|```/g, '').trim();

    const match = txt.match(/\{[\s\S]*}/);
    const parsed = match ? JSON.parse(match[0]) : null;

    if (parsed?.controls?.length) return res.status(200).json(parsed);

    // ✱ fallback
    return res.status(200).json({
      controls: [
        { label: 'Style', type: 'options', options: ['Traditional', 'Modern'], default: 0 },
        { label: 'Spice', type: 'slider', min: 0, max: 10, default: 5 },
        { label: 'Time (min)', type: 'slider', min: 10, max: 120, default: 30 }
      ]
    });
  } catch (err: any) {
    console.error('parser-fail', err.message);
    return res.status(500).json({ error: 'Parser error', detail: err.message });
  }
}
