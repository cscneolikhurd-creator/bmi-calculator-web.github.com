// ============================================
// HEALTHCALC.IN - CHAT API (DeepSeek Version)
// ============================================

// ==========================================
// CONFIGURATION
// ==========================================
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Log API key status (sirf preview, full key nahi)
if (DEEPSEEK_API_KEY) {
  const preview = DEEPSEEK_API_KEY.substring(0, 10) + '...' + DEEPSEEK_API_KEY.substring(DEEPSEEK_API_KEY.length - 5);
  console.log(`✅ DeepSeek API key loaded: ${preview}`);
} else {
  console.error('❌ DEEPSEEK_API_KEY not found in environment variables');
}

// ==========================================
// SYSTEM PROMPT
// ==========================================
const SYSTEM_PROMPT = `You are HealthCalc AI, an expert health and medical assistant for HealthCalc.in.

RULES TO FOLLOW:
1. Give accurate, evidence-based health information
2. Use simple, clear language
3. Format answers with bullet points when helpful
4. Keep responses under 500 words
5. Always end with: "⚠️ Consult a healthcare professional for personalized medical advice."
6. For emergencies, say: "🚨 MEDICAL EMERGENCY - Call emergency services immediately!"
7. Never prescribe medicines or diagnose diseases
8. Be friendly and encouraging
9. If you don't know something, be honest about it
10. Mention HealthCalc.in's 30+ free calculators when relevant

Always prioritize user safety and evidence-based information.`;

// ==========================================
// DEEPSEEK API CALL
// ==========================================
async function callDeepSeek(userMessage) {
  console.log(`📤 Sending request to DeepSeek API...`);

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.95,
      stream: false
    }),
  });

  console.log(`📥 Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ DeepSeek API error (${response.status}):`, errorText);

    // Specific error handling
    if (response.status === 401) {
      throw new Error('API_KEY_INVALID');
    }
    if (response.status === 402) {
      throw new Error('INSUFFICIENT_BALANCE');
    }
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    throw new Error(`API_ERROR_${response.status}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error('EMPTY_RESPONSE');
  }

  console.log(`✅ DeepSeek responded successfully (${reply.length} chars)`);
  return reply;
}

// ==========================================
// MAIN HANDLER
// ==========================================
export default async function handler(req, res) {
  // ===== CORS HEADERS =====
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // ===== HANDLE OPTIONS (preflight) =====
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ===== TEST ENDPOINT (GET /api/chat) =====
  if (req.method === 'GET') {
    if (!DEEPSEEK_API_KEY) {
      return res.status(200).json({
        status: 'error',
        message: 'DEEPSEEK_API_KEY not configured in Vercel environment variables',
        timestamp: new Date().toISOString()
      });
    }

    try {
      const testResponse = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Say "OK" only.' }],
          max_tokens: 10
        }),
      });

      const testData = await testResponse.json();

      if (testResponse.ok) {
        return res.status(200).json({
          status: 'success',
          message: 'DeepSeek API is working perfectly',
          apiKeyPreview: DEEPSEEK_API_KEY.substring(0, 10) + '...',
          testReply: testData.choices?.[0]?.message?.content,
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(200).json({
          status: 'error',
          message: 'DeepSeek API returned an error',
          httpStatus: testResponse.status,
          error: testData.error || testData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      return res.status(200).json({
        status: 'error',
        message: 'Failed to connect to DeepSeek API',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ===== ONLY POST ALLOWED BELOW =====
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST and GET methods allowed' });
  }

  // ===== VALIDATE API KEY =====
  if (!DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY missing');
    return res.status(500).json({
      reply: '🔧 **Configuration Error**\n\nOur AI service is temporarily unavailable. Please try one of our 30+ free calculators instead.\n\n⚠️ Consult a healthcare professional for personalized medical advice.',
      status: 'error',
      reason: 'API key not configured'
    });
  }

  // ===== PARSE REQUEST =====
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({
      reply: '❌ Please send a valid message.',
      status: 'error'
    });
  }

  console.log(`🚀 Processing: "${userMessage.substring(0, 50)}..."`);

  // ===== CALL DEEPSEEK =====
  try {
    const reply = await callDeepSeek(userMessage);

    return res.status(200).json({
      reply: reply,
      model: 'deepseek-chat',
      status: 'success'
    });

  } catch (error) {
    console.error(`💥 Error: ${error.message}`);

    // User-friendly error messages
    let errorReply = '';

    if (error.message === 'API_KEY_INVALID') {
      errorReply = '🔧 **API Key Error**\n\nOur AI service authentication failed. Please try again later or use our free calculators.\n\n⚠️ Consult a healthcare professional for personalized medical advice.';
    } else if (error.message === 'INSUFFICIENT_BALANCE') {
      errorReply = '💰 **Service Temporarily Unavailable**\n\nOur AI service is being maintained. Please try again soon or use our 30+ free calculators.\n\n⚠️ Consult a healthcare professional for personalized medical advice.';
    } else if (error.message === 'RATE_LIMIT') {
      errorReply = '⏳ **Too Many Requests**\n\nPlease wait a moment and try again. Meanwhile, try our free BMI, Calorie, or Keto calculators!\n\n⚠️ Consult a healthcare professional for personalized medical advice.';
    } else if (error.message === 'EMPTY_RESPONSE') {
      errorReply = '🤖 **AI Response Empty**\n\nPlease try rephrasing your question or try again.\n\n⚠️ Consult a healthcare professional for personalized medical advice.';
    } else {
      errorReply = '🔧 **Service Temporarily Unavailable**\n\nPlease try again in a moment, or use our free calculators.\n\n⚠️ Consult a healthcare professional for personalized medical advice.';
    }

    return res.status(200).json({
      reply: errorReply,
      status: 'error',
      reason: error.message
    });
  }
}
