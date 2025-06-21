import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    const rsp = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `You are a UI-parameter extractor.

Return ONLY a JSON object with up to six controls. 
Example:
{
  "controls":[
    {"label":"Spice Level","type":"slider","min":0,"max":10,"default":5},
    {"label":"Style","type":"options","options":["Hyderabadi","Lucknowi"],"default":"Hyderabadi"}
  ]
}

Rules:
- 3–6 controls.
- Use slider for numeric, options for categorical.
- No markdown, no extra text.`
        },
        { role: 'user', content: question }
      ]
    });

    const raw = rsp.choices[0].message.content ?? '{}';
    const obj = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');

    if (!Array.isArray(obj.controls) || obj.controls.length < 3) {
      obj.controls = [
        { label: 'Spice Level', type: 'slider', min: 0, max: 10, default: 5 },
        { label: 'Style', type: 'options', options: ['Hyderabadi','Lucknowi'], default: 'Hyderabadi' },
        { label: 'Cooking Time', type: 'slider', min: 5, max: 120, step: 5, default: 30 }
      ];
    }

    res.status(200).json(obj);
  } catch (err: any) {
    console.error('NLP-PARSE ERR', err);
    res.status(500).json({ error: 'Failed to parse', detail: err.message });
  }
}
