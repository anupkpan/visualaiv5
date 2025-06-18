const axios = require('axios');

module.exports = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Missing "question" in request body' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not set' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI parameter extractor.
Only output a valid JSON array of sliders, nothing else.
Each slider must have:
- label (string)
- min (0)
- max (100)
- default (0-100)
If unsure, always return at least 3 sliders.

Example:
[
  {"label":"Tone","min":0,"max":100,"default":50},
  {"label":"Length","min":0,"max":100,"default":50},
  {"label":"Formality","min":0,"max":100,"default":50}
]`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.4
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let text = response.data.choices[0].message.content;

    // Cleanup GPT formatting
    text = text.replace(/```json|```/g, '').trim();

    let parsedSliders = [];
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        parsedSliders = JSON.parse(match[0]);
      } catch (e) {
        console.warn("Failed to parse JSON:", e);
      }
    }

    if (!Array.isArray(parsedSliders) || parsedSliders.length === 0) {
      parsedSliders = [
        { label: "Tone", min: 0, max: 100, default: 50 },
        { label: "Length", min: 0, max: 100, default: 50 },
        { label: "Formality", min: 0, max: 100, default: 50 }
      ];
    }

    res.status(200).json({ sliders: parsedSliders });
  } catch (err) {
    console.error("API ERROR:", err.message);
    res.status(500).json({ error: 'Failed to generate sliders', detail: err.message });
  }
};