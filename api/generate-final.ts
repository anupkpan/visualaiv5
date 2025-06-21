import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt, selections } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  const modLines = (selections || [])
    .map((s: any) => `- ${s.label}: ${s.value}`)
    .join('\n');

  const fullPrompt = `${prompt}\n\nContext:\n${modLines}`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'Provide a helpful, step-by-step answer. Plain text only.' },
        { role: 'user', content: fullPrompt }
      ]
    });

    let output = chat.choices[0].message.content?.trim() ?? '';
    output = output.replace(/```[a-z]*\n?|\n?```/g, '').trim();

    res.status(200).json({ output });
  } catch (err: any) {
    console.error('FINAL ERR', err);
    res.status(500).json({ error: 'Failed to generate', detail: err.message });
  }
}
