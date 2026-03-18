export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: `You are WriteAI, an expert content writer and CV builder. 
When asked to return JSON, ALWAYS return ONLY raw valid JSON with no markdown, no backticks, no explanation, no preamble. 
Just the JSON object starting with { and ending with }.
When writing regular content (not JSON), write naturally and professionally.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    let result = data.choices?.[0]?.message?.content || 'No content generated.';

    // Clean up common JSON issues
    result = result.trim();

    // Remove markdown code blocks if present
    if (result.startsWith('```')) {
      result = result.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    // Fix escaped quotes that break JSON
    // Try to extract JSON if there's text before/after it
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch && prompt.toLowerCase().includes('json')) {
      result = jsonMatch[0];
    }

    return res.status(200).json({ result });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
