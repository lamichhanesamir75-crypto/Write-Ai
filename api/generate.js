export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, systemPrompt } = req.body;
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
          {
            role: 'system',
            content: systemPrompt || `You are WriteAI, a world-class AI writing assistant. 
When the prompt asks for JSON output: return ONLY raw valid JSON, no markdown, no backticks, no explanation whatsoever. Start directly with { and end with }.
When writing regular content: write naturally, professionally, and engagingly.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.75
      })
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'API error');

    let result = (data.choices?.[0]?.message?.content || '').trim();

    // Strip markdown code fences
    result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Extract JSON if mixed with text
    if (prompt.includes('"') && result.includes('{')) {
      const m = result.match(/\{[\s\S]*\}/);
      if (m) result = m[0];
    }

    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
