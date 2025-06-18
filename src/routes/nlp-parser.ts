import { Request, Response } from "express";
import { OpenAI } from "openai";

const SYS = `Return STRICT JSON format:
{
  "controls": [
    { "label": "...", "type": "slider", "min": 0, "max": 100, "step": 1, "default": 50, "unit": "%" },
    { "label": "...", "type": "options", "options": ["A", "B", "C"], "default": "B" }
  ]
}
Only return valid JSON. No markdown, no text. Max 6 controls.`;

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
        { role: "system", content: SYS },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const content = result.choices?.[0]?.message?.content ?? "";

    try {
      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (jsonError) {
      console.error("Failed to parse OpenAI response as JSON:", content);
      res.status(500).json({ error: "Invalid JSON from OpenAI" });
    }
  } catch (error: any) {
    console.error("API ERROR:", error?.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
}
