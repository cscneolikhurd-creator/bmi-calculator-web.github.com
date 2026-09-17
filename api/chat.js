export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Test endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'success',
      message: 'Chat API is live!',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMessage } = req.body || {};
  if (!userMessage) return res.status(400).json({ reply: '❌ No message' });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      reply: '🔧 API key not configured. Please try our free calculators.',
      status: 'error'
    });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are HealthCalc AI. Provide evidence-based health guidance. End with: "⚠️ Consult a healthcare professional."' },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const reply = data.choices?.[0]?.message?.content;
    return res.status(200).json({ reply, status: 'success' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({
      reply: '🔧 AI service temporarily unavailable. Try our free calculators!\n\n⚠️ Consult a healthcare professional.',
      status: 'error'
    });
  }
}
