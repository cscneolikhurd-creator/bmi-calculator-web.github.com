// ============================================
// HEALTHCALC.IN - CHAT API (FIXED VERSION)
// ============================================

// ==========================================
// CONFIGURATION - WITH VALIDATION
// ==========================================
const API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5
]
.filter(key => {
  // Check if key exists and is valid format
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  // Groq keys start with 'gsk_' and are at least 20 chars
  return trimmed.startsWith('gsk_') && trimmed.length > 20;
})
.map(key => key.trim()); // Remove any extra spaces

console.log(`🔑 Loaded ${API_KEYS.length} valid API keys`);
API_KEYS.forEach((key, index) => {
  const first10 = key.substring(0, 10);
  const last5 = key.substring(key.length - 5);
  console.log(`🔑 Key ${index + 1}: ${first10}...${last5} (length: ${key.length})`);
});

// ==========================================
// CACHE
// ==========================================
const responseCache = new Map();
const CACHE_TTL = 3600000;

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
// TEST ENDPOINT
// ==========================================
export async function test(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  console.log('🧪 Running API key test...');
  
  const results = [];
  
  if (API_KEYS.length === 0) {
    return res.status(200).json({
      totalKeys: 0,
      error: 'No valid API keys found. Please check environment variables.',
      timestamp: new Date().toISOString()
    });
  }
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    const keyPreview = key.substring(0, 10) + '...' + key.substring(key.length - 5);
    
    try {
      console.log(`🧪 Testing Key ${i + 1}: ${keyPreview}`);
      
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = {
        key: keyPreview,
        keyLength: key.length,
        index: i + 1,
        status: response.status,
        ok: response.ok
      };
      
      if (!response.ok) {
        const errorText = await response.text();
        result.error = errorText.substring(0, 200);
      }
      
      results.push(result);
      console.log(`🧪 Key ${i + 1} result: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
    } catch (error) {
      results.push({
        key: keyPreview,
        keyLength: key.length,
        index: i + 1,
        status: 'error',
        ok: false,
        error: error.message
      });
      console.error(`🧪 Key ${i + 1} error:`, error.message);
    }
  }
  
  return res.status(200).json({
    totalKeys: API_KEYS.length,
    timestamp: new Date().toISOString(),
    results: results
  });
}

// ==========================================
// GROQ API CALL WITH RETRY & ROTATION
// ==========================================
async function callGroqWithRetry(userMessage, systemPrompt, retryCount = 0) {
  if (retryCount >= API_KEYS.length) {
    console.log('❌ All API keys exhausted');
    return null;
  }

  const currentKey = API_KEYS[retryCount];
  console.log(`🔑 Trying API Key ${retryCount + 1}/${API_KEYS.length}`);
  
  try {
    console.log(`📤 Sending request to Groq API...`);
    
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
      })
    });

    console.log(`📥 Response status: ${groqResponse.status}`);

    // ⭐ RATE LIMIT
    if (groqResponse.status === 429) {
      console.log(`⏳ Rate limit hit on Key ${retryCount + 1}`);
      return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
    }

    // ⭐ SERVER ERROR
    if (groqResponse.status >= 500) {
      console.log(`⚠️ Server error ${groqResponse.status} on Key ${retryCount + 1}`);
      return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
    }

    // ⭐ AUTH ERROR
    if (groqResponse.status === 401 || groqResponse.status === 403) {
      console.log(`❌ Auth error ${groqResponse.status} on Key ${retryCount + 1}, skipping...`);
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

    console.log(`❌ Error ${groqResponse.status} with Key ${retryCount + 1}`);
    return null;
    
  } catch (error) {
    console.error(`💥 Network error on Key ${retryCount + 1}:`, error.message);
    return callGroqWithRetry(userMessage, systemPrompt, retryCount + 1);
  }
}

// ============================================
// MAIN HANDLER
// ============================================
export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ⭐ Handle test endpoint
  if (req.method === 'GET' && req.url === '/api/chat/test') {
    return test(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ reply: "❌ Please send a message." });
  }

  console.log(`🚀 Processing: "${userMessage.substring(0, 50)}..."`);

  // Check cache
  const cachedResponse = getCachedResponse(userMessage);
  if (cachedResponse) {
    console.log('📦 Returning cached response');
    return res.status(200).json({
      reply: cachedResponse,
      model: 'cache',
      status: 'cached'
    });
  }

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

  if (API_KEYS.length === 0) {
    console.log('⚪ No valid API keys found');
    const fallbackReply = getStaticResponse(userMessage);
    setCachedResponse(userMessage, fallbackReply);
    return res.status(200).json({
      reply: fallbackReply,
      model: 'offline',
      status: 'fallback',
      reason: 'No valid API keys configured'
    });
  }

  try {
    const reply = await callGroqWithRetry(userMessage, systemPrompt);
    
    if (reply) {
      setCachedResponse(userMessage, reply);
      console.log('✅ Returning AI response');
      return res.status(200).json({
        reply: reply,
        model: 'groq',
        status: 'success'
      });
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }

  console.log('⚪ Using fallback response');
  const fallbackReply = getStaticResponse(userMessage);
  setCachedResponse(userMessage, fallbackReply);
  return res.status(200).json({
    reply: fallbackReply,
    model: 'offline',
    status: 'fallback',
    reason: 'All API keys failed'
  });
}

// ============================================
// STATIC FALLBACK RESPONSES
// ============================================
function getStaticResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('bmi') || msg.includes('body mass') || (msg.includes('weight') && msg.includes('height'))) {
    return `📊 **About BMI (Body Mass Index)**

• **Formula:** Weight(kg) ÷ Height(m)²
• **Normal Range:** 18.5 - 24.9
• **Underweight:** Below 18.5
• **Overweight:** 25 - 29.9
• **Obese:** 30 and above

💡 **Use our free BMI Calculator:** healthcalc.in/bmi-calculator.html

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
