import { Request, Response } from 'express';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: Request, res: Response) {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Respond to the prompt with plain, natural English, with no markdown or JSON.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    let output = completion.choices[0].message.content || '';

    // 🧹 Clean up any code blocks if GPT ignores instructions
    output = output.replace(/```(?:json|text)?/g, '').replace(/```/g, '').trim();

    res.status(200).json({ output });
  } catch (err: any) {
    console.error("FINAL GPT ERROR:", err);
    res.status(500).json({ error: 'Failed to generate final output', detail: err.message });
  }
}
