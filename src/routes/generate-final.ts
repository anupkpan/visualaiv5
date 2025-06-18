import { Request, Response } from "express";
import { OpenAI } from "openai";

// Instruction for AI to build a final prompt from user inputs
const SYS = `You are a prompt composer for AI art generation. 
Given a base prompt and a list of selected controls (like style, lighting, quality, etc.), craft a refined prompt ready to be sent to an image generation model. 
Do NOT include UI terms like slider/option. Keep it natural and creative.`;

export default async function handler(req: Request, res: Response) {
  const { prompt, selections } = req.body as {
    prompt?: string;
    selections?: { label: string; value: string | number }[];
  };

  if (!prompt || !selections) {
    return res.status(400).json({ error: "Missing prompt or selections" });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const context = selections.map((s) => `${s.label}: ${s.value}`).join(", ");
  const userMsg = `Prompt: "${prompt}" with parameters: ${context}`;

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: userMsg }
      ],
      temperature: 0.7
    });

    const finalPrompt = result.choices[0].message.content?.trim() || "Error: Empty response.";
    res.status(200).json({ finalPrompt });
  } catch (err: any) {
    console.error("❌ generate-final error:", err.message);
    res.status(500).json({ error: "Failed to generate final prompt", details: err.message });
  }
}
