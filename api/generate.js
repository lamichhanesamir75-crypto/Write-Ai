// =============================================
// WriteAI - Vercel Serverless Function
// This file keeps your Groq API key SAFE & HIDDEN
// =============================================

export default async function handler(req, res) {
  // Allow your website to call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model:'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are WriteAI, a professional AI writing assistant. Generate high-quality, engaging, ready-to-use content. Be creative and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.8
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    const result = data.choices?.[0]?.message?.content || 'Could not generate content.';
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
