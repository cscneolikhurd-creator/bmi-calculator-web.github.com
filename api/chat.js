// ============================================
// HEALTHCALC.IN - DUAL AI CHAT SYSTEM
// Primary: Google Gemini (1,500 requests/day FREE)
// Backup: Groq Llama 3.3 (30 requests/min FREE)
// Vercel: bmi-calculator-web-github-com
// ============================================

export default async function handler(req, res) {
  
  // ==========================================
  // CORS HEADERS (GitHub Pages ke liye)
  // ==========================================
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // ==========================================
  // OPTIONS Request Handle (Pre-flight)
  // ==========================================
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==========================================
  // Only POST Allowed
  // ==========================================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  // ==========================================
  // Get User Message
  // ==========================================
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ reply: "❌ Please send a message. Kripya kuch puchhein." });
  }

  // ==========================================
  // SYSTEM PROMPT (Medical AI)
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
  // STEP 1: TRY GEMINI FIRST (Primary)
  // ==========================================
  if (process.env.GEMINI_API_KEY) {
    
    console.log('🟢 [Gemini] Trying primary AI...');
    
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          signal: AbortSignal.timeout(12000) // 12 second timeout
        }
      );

      // Check if Gemini responded successfully
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        
        // Check for valid response
        if (geminiData.candidates && 
            geminiData.candidates[0] && 
            geminiData.candidates[0].content &&
            geminiData.candidates[0].content.parts &&
            geminiData.candidates[0].content.parts[0].text) {
          
          const reply = geminiData.candidates[0].content.parts[0].text;
          console.log('✅ [Gemini] Success! Response received');
          
          return res.status(200).json({ 
            reply: reply,
            model: 'gemini',
            status: 'success'
          });
        }
        
        // If Gemini blocked content
        if (geminiData.promptFeedback && geminiData.promptFeedback.blockReason) {
          console.log('🟡 [Gemini] Content blocked:', geminiData.promptFeedback.blockReason);
        }
      }
      
      // Rate limit check
      if (geminiResponse.status === 429) {
        console.log('🟡 [Gemini] Rate limit reached, switching to Groq...');
      } else {
        console.log('🟡 [Gemini] Failed with status:', geminiResponse.status);
      }
      
    } catch (geminiError) {
      console.log('🔴 [Gemini] Error:', geminiError.message);
      // Continue to backup
    }
    
  } else {
    console.log('⚠️ [Gemini] API key not found in Vercel');
  }

  // ==========================================
  // STEP 2: TRY GROQ (Backup)
  // ==========================================
  if (process.env.GROQ_API_KEY) {
    
    console.log('🟠 [Groq] Trying backup AI...');
    
    // Try different Groq models (best to fallback)
    const groqModels = [
      'llama-3.3-70b-versatile',    // Best quality
      'mixtral-8x7b-32768',         // Fast & capable
      'llama-3.1-8b-instant',       // Ultra-fast
      'gemma2-9b-it'                // Google's open model
    ];

    for (const model of groqModels) {
      
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
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
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          
          if (groqData.choices && 
              groqData.choices[0] && 
              groqData.choices[0].message &&
              groqData.choices[0].message.content) {
            
            const reply = groqData.choices[0].message.content;
            console.log(`✅ [Groq] Success with model: ${model}`);
            
            return res.status(200).json({ 
              reply: reply,
              model: 'groq',
              groqModel: model,
              status: 'success'
            });
          }
        }
        
        // Rate limit check
        if (groqResponse.status === 429) {
          console.log(`🟡 [Groq] Rate limit for ${model}, trying next model...`);
          continue; // Try next model
        }
        
        console.log(`🟡 [Groq] ${model} failed with status: ${groqResponse.status}`);
        
      } catch (groqError) {
        console.log(`🔴 [Groq] ${model} error:`, groqError.message);
        continue; // Try next model
      }
    }
    
    console.log('🔴 [Groq] All models failed');
    
  } else {
    console.log('⚠️ [Groq] API key not found in Vercel');
  }

  // ==========================================
  // STEP 3: CHECK IF ANY API KEY EXISTS
  // ==========================================
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return res.status(200).json({ 
      reply: `❌ **Backend Configuration Error**

Vercel mein koi bhi API key set nahi hai. Kripya ye steps follow karein:

1. **Vercel Dashboard kholen:**
   https://vercel.com/cscneolikhurd-creators-projects/bmi-calculator-web-github-com/settings/environment-variables

2. **Ye dono keys add karein:**
   • KEY: \`GEMINI_API_KEY\` (Google AI Studio se free lein)
   • KEY: \`GROQ_API_KEY\` (Groq console se free lein)

3. **Keys milengi yahan:**
   • Gemini: https://makersuite.google.com/app/apikey
   • Groq: https://console.groq.com/keys

4. **Redeploy karein** Vercel mein

Help chahiye? Contact: healthcalc.in/contact`,
      model: 'error',
      status: 'no_api_keys'
    });
  }

  // ==========================================
  // STEP 4: STATIC FALLBACK (Last Resort)
  // ==========================================
  console.log('⚪ [Fallback] Using static response');
  
  let staticReply = getStaticResponse(userMessage);
  
  return res.status(200).json({ 
    reply: staticReply,
    model: 'offline',
    status: 'fallback'
  });
}

// ============================================
// STATIC FALLBACK FUNCTION
// ============================================
function getStaticResponse(message) {
  const msg = message.toLowerCase();
  
  // Emergency keywords check
  const emergencyWords = [
    'emergency', 'heart attack', 'chest pain', 'stroke', 
    'bleeding', 'can\'t breathe', 'suicide', 'overdose',
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
🏥 Go to nearest hospital emergency room.

**While waiting for help:**
• Stay calm
• If person is unconscious, check breathing
• Don't give food or drink
• Keep phone charged and nearby

⚠️ This is an automated response. Please seek immediate medical attention.`;
    }
  }
  
  // BMI related
  if (msg.includes('bmi') || msg.includes('body mass')) {
    return `📊 **About BMI (Body Mass Index)**

• **Formula:** Weight(kg) ÷ Height(m)²
• **Normal Range:** 18.5 - 24.9
• **Underweight:** Below 18.5
• **Overweight:** 25 - 29.9
• **Obese:** 30 and above

💡 **Use our free BMI Calculator:** healthcalc.in/bmi-calculator.html

**Limitations of BMI:**
• Doesn't account for muscle mass
• May not be accurate for athletes
• Doesn't measure body fat distribution

**Try these better alternatives:**
• Waist-to-Hip Ratio Calculator
• Body Fat Percentage Calculator
• Ponderal Index Calculator

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }
  
  // Weight loss
  if (msg.includes('weight loss') || msg.includes('lose weight') || msg.includes('diet')) {
    return `🥗 **Healthy Weight Loss Guide**

**Safe Rate:** 0.5-1 kg (1-2 lbs) per week

**Calorie Basics:**
• Create 500 kcal daily deficit for ~0.5 kg/week loss
• Never go below 1200 kcal (women) / 1500 kcal (men)

**Evidence-Based Tips:**
• 🥩 Eat protein with every meal (1.6-2.2g per kg bodyweight)
• 💧 Drink 2-3 liters water daily
• 😴 Get 7-9 hours quality sleep
• 🏃 Combine cardio + strength training
• 🥦 Fill half plate with vegetables
• 📊 Track calories with our free calculator

**Free Tools at HealthCalc.in:**
• Calorie Deficit Calculator
• Macro Calculator
• Keto Calculator
• Carb Cycling Planner

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }
  
  // Pregnancy
  if (msg.includes('pregnancy') || msg.includes('pregnant') || msg.includes('baby') || msg.includes('due date')) {
    return `🤰 **Pregnancy Health Information**

**Pregnancy Duration:** 40 weeks (280 days from LMP)

**Trimesters:**
• **1st Trimester:** Weeks 1-12 (Baby's organs form)
• **2nd Trimester:** Weeks 13-26 (Feel baby move)
• **3rd Trimester:** Weeks 27-40 (Baby grows rapidly)

**Essential Care:**
• 💊 Take prenatal vitamins (Folic acid, Iron)
• 🏥 Regular prenatal checkups
• 🥗 Eat balanced, nutritious meals
• 🚫 Avoid alcohol, smoking, raw foods
• 🧘 Stay active with pregnancy-safe exercises

**Free Pregnancy Tools:**
• 🤰 Pregnancy Calculator - Due Date
• 🥚 Ovulation Calculator
• 📅 Period Tracker
• 👶 Conception Date Calculator

⚠️ Always consult your OB-GYN for pregnancy care.`;
  }
  
  // Keto
  if (msg.includes('keto') || msg.includes('ketogenic')) {
    return `🥑 **Ketogenic Diet Overview**

**Macro Ratio (Standard Keto):**
• 70-75% Fats
• 20-25% Protein
• 5% Net Carbs (<25g daily)

**Foods to Eat:**
• 🥩 Meat, fish, eggs
• 🥑 Avocados, olive oil
• 🧀 Cheese, butter, cream
• 🥬 Low-carb vegetables

**Foods to Avoid:**
• 🍞 Bread, pasta, rice
• 🍬 Sugar, sweets
• 🍌 High-sugar fruits
• 🥔 Potatoes, grains

**Free Keto Tools:**
• Keto Macro Calculator
• Carb Cycling Planner
• Body Fat Calculator

⚠️ Consult a healthcare professional before starting keto.`;
  }
  
  // Default response
  return `👋 **Welcome to HealthCalc AI!**

I'm currently in offline mode (high traffic). Here's what you can do:

**📊 Try Our 30+ Free Health Calculators:**
• ❤️ ASCVD Heart Risk Calculator
• ⚖️ BMI Calculator
• 🤰 Pregnancy Due Date Calculator
• 🥑 Keto Macro Calculator
• 🔥 Calorie Deficit Calculator
• 😴 Sleep Cycle Calculator
• 💪 FFMI Calculator
• 🎖️ Army Body Fat Calculator

**💡 Quick Health Tips:**
• 🥗 Eat 5 servings of fruits/vegetables daily
• 💧 Drink 8 glasses of water
• 🏃 Exercise 30 minutes daily
• 😴 Sleep 7-8 hours nightly
• 🧘 Manage stress with meditation

**🔄 Refresh the page** and try asking again!

⚠️ Consult a healthcare professional for personalized medical advice.`;
}
