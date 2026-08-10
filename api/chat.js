// api/chat.js
export default async function handler(req, res) {
  // CORS Headers (GitHub Pages se request allow karne ke liye)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // OPTIONS request handle karna (Pre-flight check)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const { userMessage } = req.body;

  // Error handling agar Vercel mein API key nahi hai
  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({ reply: "❌ Backend Error: Vercel mein GROQ_API_KEY missing hai. Kripya Environment Variables check karein." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Sabse fast aur smart model
        messages: [
          { 
            role: "system", 
            content: "You are an advanced medical AI assistant for HealthCalc.in. Always reply in clear bullet points. Keep answers concise. Always add a disclaimer to consult a doctor." 
          },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ reply: `⚠️ Groq Error: ${data.error.message}` });
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    res.status(200).json({ reply: `🚨 Server Error: ${error.message}` });
  }
}
