import { Request, Response } from "express";
import { OpenAI } from "openai";

export default async function handler(req: Request, res: Response) {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const result = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Answer the prompt clearly." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    const content = result.choices?.[0]?.message?.content ?? "";

    res.json({ response: content });
  } catch (error: any) {
    console.error("API ERROR:", error?.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
}
