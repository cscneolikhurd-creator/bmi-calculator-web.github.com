// ============================================
// HEALTHCALC.IN - CHAT API v2
// Multi-Key Failover: Gemini → Groq → Static
// ============================================

export default async function handler(req, res) {
  
  // ==========================================
  // CORS HEADERS
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
  const systemPrompt = `You are HealthCalc AI, an expert medical assistant on healthcalc.in website.

RULES TO FOLLOW:
1. Give accurate, evidence-based health information (WHO, ACOG, NHS, CDC guidelines)
2. Use simple language that everyone can understand
3. Format answers with bullet points (•) for easy reading
4. Keep responses helpful but under 500 words
5. Always end with this exact line: "⚠️ Consult a healthcare professional for personalized medical advice."
6. For emergencies (chest pain, stroke, bleeding), say: "🚨 MEDICAL EMERGENCY - Call emergency services immediately! (US: 911, UK: 999, India: 108/112)"
7. Never prescribe medicines or diagnose diseases
8. Be friendly, supportive and encouraging like a health coach
9. If you don't know something, be honest and suggest consulting a doctor
10. Mention that users can try HealthCalc.in's 30+ free calculators for more help`;

  // ==========================================
  // STEP 1: TRY ALL GEMINI KEYS
  // ==========================================
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5
  ].filter(Boolean);

  if (geminiKeys.length > 0) {
    console.log(`🟢 [Gemini] ${geminiKeys.length} keys found. Trying each...`);
  }

  for (let i = 0; i < geminiKeys.length; i++) {
    try {
      console.log(`🟢 [Gemini] Trying Key ${i + 1}/${geminiKeys.length}...`);
      
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKeys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUSER QUESTION: ${userMessage}`
              }]
            }],
            safetySettings: [
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
              topP: 0.95
            }
          }),
          signal: AbortSignal.timeout(10000)
        }
      );

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        
        if (geminiData.candidates && 
            geminiData.candidates[0] && 
            geminiData.candidates[0].content &&
            geminiData.candidates[0].content.parts &&
            geminiData.candidates[0].content.parts[0].text) {
          
          const reply = geminiData.candidates[0].content.parts[0].text;
          console.log(`✅ [Gemini] Key ${i + 1} SUCCESS!`);
          
          return res.status(200).json({ 
            reply: reply,
            model: 'gemini',
            keyUsed: i + 1,
            status: 'success'
          });
        }
      }
      
      if (geminiResponse.status === 429) {
        console.log(`🟡 [Gemini] Key ${i + 1} rate limited. Trying next key...`);
      } else {
        console.log(`🟡 [Gemini] Key ${i + 1} failed (status: ${geminiResponse.status})`);
      }
      
    } catch (geminiError) {
      console.log(`🔴 [Gemini] Key ${i + 1} Error: ${geminiError.message}`);
    }
  }
  
  console.log('🔴 [Gemini] All keys exhausted');

  // ==========================================
  // STEP 2: TRY ALL GROQ KEYS
  // ==========================================
  const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5
  ].filter(Boolean);

  if (groqKeys.length > 0) {
    console.log(`🟠 [Groq] ${groqKeys.length} keys found. Trying each...`);
  }

  const groqModels = [
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant',
    'gemma2-9b-it'
  ];

  for (let i = 0; i < groqKeys.length; i++) {
    const model = groqModels[i % groqModels.length];
    
    try {
      console.log(`🟠 [Groq] Trying Key ${i + 1}/${groqKeys.length} (${model})...`);
      
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKeys[i]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 800,
          top_p: 0.95
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (groqResponse.ok) {
        const groqData = await groqResponse.json();
        
        if (groqData.choices && 
            groqData.choices[0] && 
            groqData.choices[0].message &&
            groqData.choices[0].message.content) {
          
          const reply = groqData.choices[0].message.content;
          console.log(`✅ [Groq] Key ${i + 1} SUCCESS (${model})!`);
          
          return res.status(200).json({ 
            reply: reply,
            model: 'groq',
            groqModel: model,
            keyUsed: i + 1,
            status: 'success'
          });
        }
      }
      
      if (groqResponse.status === 429) {
        console.log(`🟡 [Groq] Key ${i + 1} rate limited. Trying next...`);
      } else {
        console.log(`🟡 [Groq] Key ${i + 1} failed (status: ${groqResponse.status})`);
      }
      
    } catch (groqError) {
      console.log(`🔴 [Groq] Key ${i + 1} Error: ${groqError.message}`);
    }
  }
  
  console.log('🔴 [Groq] All keys exhausted');

  // ==========================================
  // STEP 3: STATIC FALLBACK
  // ==========================================
  console.log('⚪ [Fallback] Using static response');
  
  return res.status(200).json({ 
    reply: getStaticResponse(userMessage),
    model: 'offline',
    status: 'fallback'
  });
}

// ============================================
// STATIC FALLBACK FUNCTION
// ============================================
function getStaticResponse(message) {
  const msg = message.toLowerCase();
  
  const emergencyWords = [
    'emergency', 'heart attack', 'chest pain', 'stroke', 
    'bleeding', "can't breathe", 'suicide', 'overdose',
    'seizure', 'unconscious', 'poison', 'severe burn'
  ];
  
  for (const word of emergencyWords) {
    if (msg.includes(word)) {
      return `🚨 **MEDICAL EMERGENCY DETECTED**

**IMMEDIATE ACTION REQUIRED:**

📞 **Emergency Numbers:**
• 🇺🇸 United States: **911**
• 🇬🇧 United Kingdom: **999**
• 🇮🇳 India: **108** or **112**
• 🇨🇦 Canada: **911**
• 🇦🇺 Australia: **000**

🚑 Call emergency services NOW. Do NOT wait.

⚠️ This is an automated response. Please seek immediate medical attention.`;
    }
  }
  
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
  
  if (msg.includes('weight loss') || msg.includes('lose weight') || msg.includes('diet')) {
    return `🥗 **Healthy Weight Loss Guide**

**Safe Rate:** 0.5-1 kg (1-2 lbs) per week

**Calorie Basics:**
• Create 500 kcal daily deficit for ~0.5 kg/week loss
• Never go below 1200 kcal (women) / 1500 kcal (men)

**Evidence-Based Tips:**
• 🥩 Eat protein with every meal
• 💧 Drink 2-3 liters water daily
• 😴 Get 7-9 hours quality sleep
• 🏃 Combine cardio + strength training
• 🥦 Fill half plate with vegetables

**Free Tools at HealthCalc.in:**
• Calorie Deficit Calculator
• Macro Calculator
• Keto Calculator

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }
  
  if (msg.includes('pregnancy') || msg.includes('pregnant') || msg.includes('baby')) {
    return `🤰 **Pregnancy Health Information**

**Pregnancy Duration:** 40 weeks (280 days from LMP)

**Trimesters:**
• **1st:** Weeks 1-12 (organs form)
• **2nd:** Weeks 13-26 (feel baby move)
• **3rd:** Weeks 27-40 (rapid growth)

**Essential Care:**
• 💊 Take prenatal vitamins
• 🏥 Regular checkups
• 🥗 Eat balanced meals
• 🚫 Avoid alcohol, smoking

**Free Pregnancy Tools:**
• 🤰 Pregnancy Calculator
• 🥚 Ovulation Calculator
• 📅 Period Tracker

⚠️ Always consult your OB-GYN for pregnancy care.`;
  }
  
  if (msg.includes('keto') || msg.includes('ketogenic')) {
    return `🥑 **Ketogenic Diet Overview**

**Macro Ratio:**
• 70-75% Fats
• 20-25% Protein
• 5% Net Carbs (<25g daily)

**Foods to Eat:**
• 🥩 Meat, fish, eggs
• 🥑 Avocados, olive oil
• 🧀 Cheese, butter
• 🥬 Low-carb vegetables

**Free Keto Tools:**
• Keto Macro Calculator
• Carb Cycling Planner

⚠️ Consult a healthcare professional before starting keto.`;
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
• 💪 FFMI Calculator

**💡 Quick Health Tips:**
• 🥗 Eat 5 servings of fruits/vegetables daily
• 💧 Drink 8 glasses of water
• 🏃 Exercise 30 minutes daily
• 😴 Sleep 7-8 hours nightly
• 🧘 Manage stress with meditation

**🔄 Refresh the page** and try asking again!

⚠️ Consult a healthcare professional for personalized medical advice.`;
}
