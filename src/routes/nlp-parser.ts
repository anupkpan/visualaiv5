import { Request, Response } from "express";
import { OpenAI } from "openai";

// Instruction for AI to return valid UI controls
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
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(result.choices[0].message.content || "{}");
    res.status(200).json(parsed);
  } catch (err: any) {
    console.error("❌ nlp-parser error:", err.message);
    res.status(500).json({ error: "Failed to parse prompt", details: err.message });
  }
}
