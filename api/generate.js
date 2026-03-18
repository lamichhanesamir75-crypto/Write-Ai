export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt' });
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are WriteAI, a professional AI writing assistant. Generate high-quality content.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.8
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Groq API error');
    return res.status(200).json({ result: data.choices?.[0]?.message?.content || 'No content.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
