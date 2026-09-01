// ============================================
// HEALTHCALC.IN - CHAT API
// ============================================

export default async function handler(req, res) {
  // ==========================================
  // CORS HEADERS - SABSE PEHLE
  // ==========================================
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ reply: "❌ Please send a message." });
  }

  // ==========================================
  // SYSTEM PROMPT
  // ==========================================
  const systemPrompt = `You are HealthCalc AI, an expert medical assistant...

RULES TO FOLLOW:
1. Give accurate, evidence-based health information
2. Use simple language
3. Format answers with bullet points
4. Keep responses under 500 words
5. Always end with: "⚠️ Consult a healthcare professional for personalized medical advice."
6. For emergencies, say: "🚨 MEDICAL EMERGENCY - Call emergency services immediately!"
7. Never prescribe medicines or diagnose diseases
8. Be friendly and encouraging
9. If you don't know something, be honest
10. Mention HealthCalc.in's 30+ free calculators`;

  // ==========================================
  // GROQ API CALL
  // ==========================================
  const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;

  if (!GROQ_API_KEY) {
    console.log('⚪ No API key found, using fallback');
    return res.status(200).json({
      reply: getStaticResponse(userMessage),
      model: 'offline',
      status: 'fallback'
    });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.95
      })
    });

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const reply = data.choices?.[0]?.message?.content;

      if (reply) {
        return res.status(200).json({
          reply: reply,
          model: 'groq',
          status: 'success'
        });
      }
    }
  } catch (error) {
    console.error('Groq API Error:', error.message);
  }

  // ==========================================
  // FALLBACK
  // ==========================================
  console.log('⚪ Using fallback response');
  return res.status(200).json({
    reply: getStaticResponse(userMessage),
    model: 'offline',
    status: 'fallback'
  });
}

// ============================================
// STATIC FALLBACK RESPONSES
// ============================================
function getStaticResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('bmi') || msg.includes('body mass')) {
    return `📊 **About BMI (Body Mass Index)**

• **Formula:** Weight(kg) ÷ Height(m)²
• **Normal Range:** 18.5 - 24.9
• **Underweight:** Below 18.5
• **Overweight:** 25 - 29.9
• **Obese:** 30 and above

💡 **Use our free BMI Calculator:** healthcalc.in/bmi-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  if (msg.includes('weight loss') || msg.includes('diet')) {
    return `🥗 **Healthy Weight Loss Guide**

**Safe Rate:** 0.5-1 kg (1-2 lbs) per week

**Calorie Basics:**
• Create 500 kcal daily deficit for ~0.5 kg/week loss
• Never go below 1200 kcal (women) / 1500 kcal (men)

**Free Tools at HealthCalc.in:**
• Calorie Deficit Calculator
• Macro Calculator
• Keto Calculator

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  return `👋 **Welcome to HealthCalc AI!**

I'm currently in high traffic mode. Please try again in a moment.

**📊 Try Our 30+ Free Health Calculators:**
• ❤️ ASCVD Heart Risk Calculator
• ⚖️ BMI Calculator
• 🤰 Pregnancy Due Date Calculator
• 🥑 Keto Macro Calculator
• 🔥 Calorie Deficit Calculator
• 😴 Sleep Cycle Calculator

⚠️ Consult a healthcare professional for personalized medical advice.`;
}
