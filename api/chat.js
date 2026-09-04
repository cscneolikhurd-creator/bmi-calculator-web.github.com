// ============================================
// HEALTHCALC.IN - CHAT API (FINAL VERSION)
// ============================================

// ==========================================
// CACHE FOR REPEATED QUESTIONS
// ==========================================
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

function getCachedResponse(message) {
  const key = message.toLowerCase().trim();
  if (responseCache.has(key)) {
    const { data, timestamp } = responseCache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log('📦 Cache hit!');
      return data;
    }
    responseCache.delete(key);
  }
  return null;
}

function setCachedResponse(message, response) {
  const key = message.toLowerCase().trim();
  responseCache.set(key, {
    data: response,
    timestamp: Date.now()
  });
}

// ==========================================
// RATE LIMIT TRACKING PER KEY
// ==========================================
const keyUsage = new Map();

function trackKeyUsage(keyIndex) {
  const now = Date.now();
  const key = `key_${keyIndex}`;
  if (!keyUsage.has(key)) {
    keyUsage.set(key, []);
  }
  const timestamps = keyUsage.get(key);
  timestamps.push(now);
  // Keep only last 1 minute
  const oneMinuteAgo = now - 60000;
  const recent = timestamps.filter(t => t > oneMinuteAgo);
  keyUsage.set(key, recent);
  return recent.length;
}

// ==========================================
// MULTIPLE API KEYS CONFIGURATION
// ==========================================
const API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5
].filter(key => key && key.trim() !== '');

console.log(`🔑 Loaded ${API_KEYS.length} API keys`);

// ==========================================
// GROQ API CALL WITH RETRY & ROTATION
// ==========================================
async function callGroqWithRetry(userMessage, systemPrompt, retryCount = 0) {
  // Agar saari keys try kar li hain toh fail
  if (retryCount >= API_KEYS.length) {
    console.log('❌ All API keys exhausted');
    return null;
  }

  const currentKey = API_KEYS[retryCount];
  console.log(`🔑 Trying API Key ${retryCount + 1}/${API_KEYS.length}`);
  
  // Track usage for this key
  const usageCount = trackKeyUsage(retryCount);
  console.log(`📊 Key ${retryCount + 1} usage: ${usageCount}/30 per minute`);
  
  // Agar key already rate limited hai toh skip karein
  if (usageCount >= 25) { // 25 requests per minute, 30 limit hai
    console.log(`⏳ Key ${retryCount + 1} near limit, trying next...`);
    return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
  }

  // Timeout controller - 10 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentKey}`,
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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // ⭐ RATE LIMIT DETECTED (429)
    if (groqResponse.status === 429) {
      console.log(`⏳ Rate limit hit on Key ${retryCount + 1}, trying next key...`);
      return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
    }

    // ⭐ SERVER ERROR (5xx) - Retry with next key
    if (groqResponse.status >= 500) {
      console.log(`⚠️ Server error ${groqResponse.status} on Key ${retryCount + 1}, trying next...`);
      return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
    }

    // ⭐ UNAUTHORIZED (401) - Invalid key, skip
    if (groqResponse.status === 401) {
      console.log(`❌ Invalid API Key ${retryCount + 1}, skipping...`);
      return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
    }

    // ⭐ SUCCESS
    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const reply = data.choices?.[0]?.message?.content;
      
      if (reply) {
        console.log(`✅ Success with Key ${retryCount + 1}`);
        return reply;
      }
    }

    // Koi aur error (400, 403, etc.)
    console.log(`❌ Error ${groqResponse.status} with Key ${retryCount + 1}`);
    return null;
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log(`⏰ Timeout on Key ${retryCount + 1}, trying next...`);
    } else {
      console.error(`💥 Network error on Key ${retryCount + 1}:`, error.message);
    }
    // Network error - next key try karo
    return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
  }
}

// ============================================
// MAIN HANDLER
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
  // CHECK CACHE FIRST
  // ==========================================
  const cachedResponse = getCachedResponse(userMessage);
  if (cachedResponse) {
    return res.status(200).json({
      reply: cachedResponse,
      model: 'cache',
      status: 'cached'
    });
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
  // CHECK API KEYS
  // ==========================================
  if (API_KEYS.length === 0) {
    console.log('⚪ No API keys found, using fallback');
    const fallbackReply = getStaticResponse(userMessage);
    setCachedResponse(userMessage, fallbackReply);
    return res.status(200).json({
      reply: fallbackReply,
      model: 'offline',
      status: 'fallback',
      reason: 'No API keys configured'
    });
  }

  // ==========================================
  // TRY GROQ API WITH RETRY
  // ==========================================
  try {
    console.log(`🚀 Processing request: "${userMessage.substring(0, 50)}..."`);
    const reply = await callGroqWithRetry(userMessage, systemPrompt);
    
    if (reply) {
      // Cache the response
      setCachedResponse(userMessage, reply);
      return res.status(200).json({
        reply: reply,
        model: 'groq',
        status: 'success'
      });
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }

  // ==========================================
  // FALLBACK - Jab sab fail ho jaye
  // ==========================================
  console.log('⚪ Using fallback response');
  const fallbackReply = getStaticResponse(userMessage);
  setCachedResponse(userMessage, fallbackReply);
  return res.status(200).json({
    reply: fallbackReply,
    model: 'offline',
    status: 'fallback',
    reason: 'All API keys failed or rate limited'
  });
}

// ============================================
// STATIC FALLBACK RESPONSES (ENHANCED)
// ============================================
function getStaticResponse(message) {
  const msg = message.toLowerCase();

  // ==========================================
  // BMI RELATED
  // ==========================================
  if (msg.includes('bmi') || msg.includes('body mass') || (msg.includes('weight') && msg.includes('height'))) {
    return `📊 **About BMI (Body Mass Index)**

• **Formula:** Weight(kg) ÷ Height(m)²
• **Normal Range:** 18.5 - 24.9
• **Underweight:** Below 18.5
• **Overweight:** 25 - 29.9
• **Obese:** 30 and above
• **Waist circumference matters too!**

💡 **Use our free BMI Calculator:** healthcalc.in/bmi-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // WEIGHT LOSS / DIET
  // ==========================================
  if (msg.includes('weight loss') || msg.includes('diet') || msg.includes('calorie') || msg.includes('fat') || msg.includes('keto')) {
    return `🥗 **Healthy Weight Loss Guide**

**Safe Rate:** 0.5-1 kg (1-2 lbs) per week

**Calorie Basics:**
• Create 500 kcal daily deficit for ~0.5 kg/week loss
• Never go below 1200 kcal (women) / 1500 kcal (men)

**Key Tips:**
• Eat more protein and fiber
• Stay hydrated (2-3L water daily)
• Sleep 7-9 hours
• Exercise 150 min/week

**Free Tools at HealthCalc.in:**
• Calorie Deficit Calculator: healthcalc.in/calorie-deficit.html
• Macro Calculator: healthcalc.in/macro-calculator.html
• Keto Calculator: healthcalc.in/keto-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // HEART / ASCVD
  // ==========================================
  if (msg.includes('heart') || msg.includes('ascvd') || msg.includes('cardiovascular') || msg.includes('stroke') || msg.includes('blood pressure')) {
    return `❤️ **Heart Health & ASCVD Risk**

**ASCVD = Atherosclerotic Cardiovascular Disease**

**Risk Factors:**
• Age & Gender
• Blood Pressure
• Cholesterol levels
• Smoking status
• Diabetes
• BMI

**Prevention:**
• Healthy diet
• Regular exercise
• No smoking
• Stress management
• Regular checkups

💡 **Calculate your risk:** healthcalc.in/ascvd-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // PREGNANCY
  // ==========================================
  if (msg.includes('pregnancy') || msg.includes('due date') || msg.includes('conception') || msg.includes('ovulation') || msg.includes('menstrual')) {
    return `🤰 **Pregnancy & Due Date Information**

**Pregnancy Duration:** ~40 weeks (280 days)

**Key Milestones:**
• First Trimester: Weeks 1-13
• Second Trimester: Weeks 14-27
• Third Trimester: Weeks 28-40

**Important:**
• Regular prenatal checkups
• Folic acid (400-800 mcg daily)
• Avoid alcohol, smoking
• Healthy nutrition

**Free Tools:**
• Due Date Calculator: healthcalc.in/pregnancy-calculator.html
• Ovulation Calculator: healthcalc.in/ovulation-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // SLEEP
  // ==========================================
  if (msg.includes('sleep') || msg.includes('insomnia') || msg.includes('rest') || msg.includes('circadian')) {
    return `😴 **Healthy Sleep Guide**

**Recommended Sleep by Age:**
• Adults (18-60): 7-9 hours
• Older adults (61+): 7-8 hours
• Teens (14-17): 8-10 hours
• Children (6-13): 9-11 hours

**Sleep Tips:**
• Consistent schedule
• Dark, cool room (18-22°C)
• No screens 1 hour before bed
• Avoid caffeine after 2 PM
• Exercise daily

**Free Tools:**
• Sleep Cycle Calculator: healthcalc.in/sleep-cycle-calculator.html
• Circadian Rhythm: healthcalc.in/circadian-rhythm-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // WORKOUT / EXERCISE
  // ==========================================
  if (msg.includes('workout') || msg.includes('exercise') || msg.includes('gym') || msg.includes('fitness') || msg.includes('vo2')) {
    return `💪 **Fitness & Exercise Guide**

**Cardio Guidelines:**
• 150 min moderate OR 75 min vigorous per week
• Include strength training 2x per week

**Key Metrics:**
• VO2 Max: Measure of aerobic fitness
• MET: Metabolic Equivalent of Task
• Target Heart Rate: 50-85% of max

**Free Tools:**
• VO2 Max Calculator: healthcalc.in/vo2max-calculator.html
• MET Calculator: healthcalc.in/met-calculator.html
• Heart Rate Calculator: healthcalc.in/heart-rate-calculator.html

⚠️ Consult a healthcare professional before starting any exercise program.`;
  }

  // ==========================================
  // HYDRATION / WATER
  // ==========================================
  if (msg.includes('water') || msg.includes('hydration') || msg.includes('drink')) {
    return `💧 **Hydration Guide**

**Daily Water Intake:**
• Men: ~3.7 liters (15.5 cups)
• Women: ~2.7 liters (11.5 cups)
• Increase if active or in hot weather

**Signs of Dehydration:**
• Dark urine
• Dry mouth
• Fatigue
• Headache
• Dizziness

**Tips:**
• Drink water throughout the day
• Eat water-rich foods (fruits, vegetables)
• Monitor urine color

💡 **Water Intake Calculator:** healthcalc.in/water-intake-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // BODY FAT / COMPOSITION
  // ==========================================
  if (msg.includes('body fat') || msg.includes('body composition') || msg.includes('ffmi') || msg.includes('body shape')) {
    return `📏 **Body Composition Guide**

**Key Metrics:**
• Body Fat Percentage: Essential vs. Storage fat
• FFMI (Fat-Free Mass Index): Muscle mass indicator
• Waist-to-Hip Ratio: Health risk indicator

**Healthy Ranges:**
• Men: 6-24% body fat
• Women: 16-30% body fat

**Free Tools:**
• Body Fat Calculator: healthcalc.in/body-fat-calculator.html
• FFMI Calculator: healthcalc.in/ffmi-calculator.html
• WHR Calculator: healthcalc.in/whr-calculator.html

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // GREETINGS / GENERAL
  // ==========================================
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('namaste') || msg.includes('good morning') || msg.includes('good evening')) {
    return `👋 **Hello! Welcome to HealthCalc AI!**

I'm currently experiencing high traffic. But don't worry - you can still:

📊 **Use Our 30+ Free Health Calculators:**
• ❤️ Heart Risk (ASCVD) Calculator
• ⚖️ BMI Calculator
• 🤰 Pregnancy Due Date Calculator
• 🥑 Keto Macro Calculator
• 🔥 Calorie Deficit Calculator
• 😴 Sleep Cycle Calculator
• 🏃 Calorie Burn Calculator
• 💪 One Rep Max Calculator
• 💧 Water Intake Calculator
• 📏 Body Fat Calculator

💡 **Tip:** Try again in 1-2 minutes for AI responses!

⚠️ Consult a healthcare professional for personalized medical advice.`;
  }

  // ==========================================
  // DEFAULT FALLBACK
  // ==========================================
  return `👋 **Welcome to HealthCalc AI!**

I'm currently in high traffic mode. Please try again in a moment.

**📊 Try Our 30+ Free Health Calculators:**
• ❤️ ASCVD Heart Risk Calculator
• ⚖️ BMI Calculator
• 🤰 Pregnancy Due Date Calculator
• 🥑 Keto Macro Calculator
• 🔥 Calorie Deficit Calculator
• 😴 Sleep Cycle Calculator
• 🏃 Calorie Burn Calculator
• 💪 One Rep Max Calculator
• 🩺 Blood Pressure Guide
• 📊 Body Fat Calculator
• 💧 Water Intake Calculator
• 📏 WHR Calculator

⚠️ Consult a healthcare professional for personalized medical advice.`;
}
