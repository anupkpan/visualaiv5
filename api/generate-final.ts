import { Request, Response } from 'express';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: Request, res: Response) {
  const { prompt, controls } = req.body;
  if (!prompt || !controls) return res.status(400).json({ error: 'Missing prompt or controls' });

  const controlText = Object.entries(controls)
    .map(([key, val]) => `${key}: ${val}`)
    .join(', ');

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that crafts rich and accurate responses based on structured inputs.' },
        { role: 'user', content: `Prompt: ${prompt}\nSettings: ${controlText}` }
      ]
    });
    const result = completion.choices[0].message.content;
    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate final output' });
  }
}
