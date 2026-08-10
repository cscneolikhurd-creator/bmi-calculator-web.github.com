export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const { userMessage } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({ reply: "❌ Vercel Error: GROQ_API_KEY missing hai. Kripya Vercel settings mein key daalein aur redeploy karein." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Groq ka latest model
        messages: [
          { role: "system", content: "You are an advanced medical AI assistant for HealthCalc.in. Answer in bullet points and be conversational. Always add a medical disclaimer." },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    // Agar Groq ki taraf se API Key ya Limit ka error aata hai
    if (data.error) {
      return res.status(200).json({ reply: `⚠️ Groq API Error: ${data.error.message}` });
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    res.status(200).json({ reply: `🚨 Server Error: ${error.message}` });
  }
}
