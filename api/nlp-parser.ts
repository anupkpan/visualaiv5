// ===== FILE: api/nlp-parser.ts =====
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `Extract visual controls (sliders and options) from a prompt. Only return valid JSON like below:
{
  "controls": [
    { "label": "Spice Level", "type": "slider", "min": 0, "max": 10, "default": 5 },
    { "label": "Style", "type": "options", "options": ["Hyderabadi", "Lucknowi"], "default": 0 }
  ]
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let text = chat.choices[0].message.content ?? '';
    text = text.replace(/```json|```/g, '').trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.controls)) throw new Error('Missing controls array');

    res.status(200).json(parsed);
  } catch (err: any) {
    console.error('NLP Parser Error:', err.message);
    // Fallback sliders
    return res.status(200).json({
      controls: [
        { label: 'Style', type: 'options', options: ['Traditional', 'Modern'], default: 0 },
        { label: 'Spice Level', type: 'slider', min: 0, max: 10, default: 5 },
        { label: 'Time', type: 'slider', min: 0, max: 120, default: 30 }
      ]
    });
  }
}
