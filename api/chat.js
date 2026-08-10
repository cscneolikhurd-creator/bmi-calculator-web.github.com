export default async function handler(req, res) {
  // CORS Headers (Yeh GitHub Pages se aane wali request ko allow karega)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // OPTIONS request handle karna browser ke liye zaroori hai
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const { userMessage } = req.body;

  // Agar Vercel mein API key nahi daali hai toh error yahan dikhega
  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({ reply: "❌ Backend Error: Vercel mein GROQ_API_KEY missing hai." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an advanced medical AI assistant for HealthCalc.in. Always reply in clear bullet points. Add a disclaimer to consult a doctor." },
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
