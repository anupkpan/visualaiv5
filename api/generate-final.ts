import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt, selections } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const userPrompt = selections?.length
      ? `${prompt}\n\nUse these modifiers:\n` + selections.map((s: any) => `- ${s.label}: ${s.value}`).join('\n')
      : prompt;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [
        { role: 'system', content: `You are a helpful and concise assistant. Answer clearly and helpfully.` },
        { role: 'user', content: userPrompt }
      ]
    });

    let output = chat.choices[0].message.content?.trim() ?? '';

    // Clean output if GPT wraps in code block
    output = output.replace(/```(json|text)?/g, '').replace(/```/g, '').trim();

    res.status(200).json({ output });
  } catch (err: any) {
    console.error("FINAL GPT ERROR:", err);
    res.status(500).json({ error: 'Failed to generate final output', detail: err.message });
  }
}
