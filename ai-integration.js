// ============================================
// HEALTHCALC.IN - AI Health Assistant
// International Version - English
// GitHub Pages Ready | All-in-One Solution
// ============================================

(function() {
'use strict';

// ==================== CONFIGURATION ====================
const CONFIG = {
// YOUR GEMINI API KEY HERE (Get free key: https://makersuite.google.com/app/apikey)
GEMINI_API_KEY: 'AQ.Ab8RN6JPDZKbtRtEQ2zLxIz7MzVdKbHTEepD0fdZ69OQHPCuRQ',

// Feature Flags
CHAT_ENABLED: true,
AUTO_INSIGHTS: true,
TYPING_EFFECT: true,

// Brand Colors (Customize for your site)
PRIMARY_COLOR: '#667eea',
SECONDARY_COLOR: '#764ba2',
ACCENT_COLOR: '#ff6b6b',

// International Settings
LANGUAGE: 'english',
TIMEZONE: 'UTC',
MEASUREMENT_SYSTEM: 'metric', // metric or imperial

// Behavior Settings
AUTO_OPEN_DELAY: 30000, // 30 seconds delay for first-time visitors
MAX_RESPONSE_LENGTH: 500,
CACHE_DURATION: 3600000, // 1 hour cache
ENABLE_VOICE_INPUT: false, // Set true for voice support
ENABLE_EMOJI: true
};

// ==================== AI CORE ENGINE ====================
class HealthAIEngine {
constructor() {
this.conversationHistory = [];
this.responseCache = new Map();
this.userPreferences = this.loadUserPreferences();
this.totalInteractions = 0;
this.sessionStartTime = Date.now();
}

// Main AI query method with caching
async query(userQuestion, pageContext = 'general health') {
this.totalInteractions++;

// Check cache first
const cacheKey = `${pageContext}_${userQuestion.toLowerCase().trim()}`;
if (this.responseCache.has(cacheKey)) {
const cached = this.responseCache.get(cacheKey);
if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
console.log('📦 Serving from cache');
return cached.response;
}
}

// Validate API key
if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'AQ.Ab8RN6JPDZKbtRtEQ2zLxIz7MzVdKbHTEepD0fdZ69OQHPCuRQ') {
return this.getFallbackResponse(userQuestion, pageContext);
}

// Prepare AI prompt
const prompt = this.buildPrompt(userQuestion, pageContext);

try {
const response = await this.callGeminiAPI(prompt);

// Cache the response
this.responseCache.set(cacheKey, {
response: response,
timestamp: Date.now()
});

// Clean old cache entries
this.cleanCache();

return response;

} catch (error) {
console.warn('AI API Error:', error.message);
return this.getFallbackResponse(userQuestion, pageContext);
}
}

// Build optimized prompt for health queries
buildPrompt(question, context) {
return `You are HealthCalc AI, a professional health information assistant on healthcalc.in, a website providing free health calculators and tools.

CONTEXT:
- User is currently on: ${context} page
- Website purpose: Free health calculators for BMI, BMR, heart rate, sleep, nutrition, pregnancy, and more
- Target audience: Health-conscious individuals worldwide
- Tone: Professional, supportive, evidence-based

USER QUESTION: ${question}

RESPONSE GUIDELINES:
1. Provide accurate, science-backed health information
2. Keep responses clear and actionable (2-3 paragraphs maximum)
3. Include relevant statistics or numbers when helpful
4. Always add disclaimer: "Consult healthcare professionals for medical advice"
5. Be encouraging and non-judgmental
6. If question relates to calculators, explain how to use them effectively
7. Use simple, accessible language (8th-grade reading level)
8. Format with line breaks for readability
9. Include emojis sparingly for engagement ${CONFIG.ENABLE_EMOJI ? '✅' : ''}

EXAMPLE RESPONSE STRUCTURE:
[Brief direct answer to question]
[Supporting information or tip]
[Practical recommendation]
[Medical disclaimer if applicable]

RESPONSE:`;
}

// Call Google Gemini API
async callGeminiAPI(prompt) {
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

const requestBody = {
contents: [{
parts: [{
text: prompt
}]
}],
generationConfig: {
temperature: 0.7,
topK: 40,
topP: 0.95,
maxOutputTokens: 500,
stopSequences: []
},
safetySettings: [
{
category: "HARM_CATEGORY_MEDICAL",
threshold: "BLOCK_ONLY_HIGH"
}
]
};

const response = await fetch(apiUrl, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(requestBody)
});

if (!response.ok) {
const errorData = await response.json();
throw new Error(`API Error: ${errorData.error?.message || response.status}`);
}

const data = await response.json();

if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
return data.candidates[0].content.parts[0].text;
}

throw new Error('Invalid API response structure');
}

// Comprehensive fallback responses (works offline)
getFallbackResponse(question, context) {
const q = question.toLowerCase();

// BMI Related
if (q.includes('bmi') || q.includes('body mass') || q.includes('weight')) {
return `📊 **Understanding Your BMI**

Body Mass Index (BMI) is a screening tool that estimates body fat based on height and weight.

**BMI Categories:**
• Underweight: Below 18.5
• Normal weight: 18.5 – 24.9
• Overweight: 25.0 – 29.9
• Obesity: 30.0 and above

**Important Notes:**
• BMI doesn't account for muscle mass or body composition
• Athletes may have high BMI but low body fat
• Use body fat percentage for more accurate assessment
• Waist circumference is another important health indicator

💡 **Tip:** Track your BMI trends over time rather than focusing on single readings.

⚠️ **Disclaimer:** Consult your healthcare provider for personalized weight management advice.`;
}

// Heart Health
if (q.includes('heart') || q.includes('pulse') || q.includes('cardio')) {
return `❤️ **Heart Health Essentials**

**Normal Resting Heart Rate:**
• Adults: 60-100 beats per minute (bpm)
• Well-trained athletes: 40-60 bpm
• Children (6-15 years): 70-100 bpm

**Heart Health Tips:**
1. **Exercise:** 150 minutes moderate activity weekly
2. **Diet:** Mediterranean diet reduces heart disease risk by 30%
3. **Sleep:** 7-9 hours quality sleep nightly
4. **Stress Management:** Meditation, yoga, deep breathing
5. **Regular Checkups:** Monitor blood pressure and cholesterol

**Warning Signs to Watch:**
• Chest pain or discomfort
• Shortness of breath
• Irregular heartbeat
• Unexplained fatigue

⚠️ **Emergency:** If experiencing chest pain, seek immediate medical attention.`;
}

// Sleep Related
if (q.includes('sleep') || q.includes('insomnia') || q.includes('rest')) {
return `😴 **Sleep Optimization Guide**

**Recommended Sleep Duration by Age:**
• Adults (18-64): 7-9 hours
• Older Adults (65+): 7-8 hours
• Teenagers (14-17): 8-10 hours

**Sleep Quality Tips:**
1. **Consistent Schedule:** Same bedtime/wake time daily
2. **Dark Environment:** Use blackout curtains, eye masks
3. **Cool Temperature:** 65-68°F (18-20°C) optimal
4. **Digital Sunset:** No screens 1 hour before bed
5. **Caffeine Cutoff:** Stop caffeine 8 hours before sleep

**Understanding Sleep Cycles:**
• Each cycle lasts ~90 minutes
• 4-6 cycles per night is ideal
• Wake up at end of cycle for refreshed feeling

💡 **Pro Tip:** Use our Sleep Cycle Calculator to find optimal wake times!`;
}

// Nutrition/Diet
if (q.includes('diet') || q.includes('nutrition') || q.includes('calorie') || q.includes('eat')) {
return `🥗 **Nutrition Fundamentals**

**Daily Calorie Needs (Average Adults):**
• Sedentary women: 1,600-2,000 calories
• Sedentary men: 2,000-2,600 calories
• Active individuals: Add 400-800 calories

**Balanced Plate Method:**
• ½ plate: Vegetables and fruits
• ¼ plate: Whole grains
• ¼ plate: Lean protein
• Healthy fats in moderation

**Weight Management:**
• Weight loss: 500-calorie daily deficit
• Weight gain: 300-500 calorie surplus
• Maintenance: Balance intake with expenditure

**Key Nutrients to Prioritize:**
• Protein: 0.8g per kg body weight (minimum)
• Fiber: 25-30g daily
• Water: 8-10 cups (2-2.5 liters)

💡 **Tip:** Use our Calorie Calculator for personalized recommendations!`;
}

// Hydration
if (q.includes('water') || q.includes('hydration') || q.includes('drink') || q.includes('fluid')) {
return `💧 **Hydration Guidelines**

**Daily Water Recommendations:**
• Men: 3.7 liters (125 oz) total water
• Women: 2.7 liters (91 oz) total water
• Includes water from food and beverages

**Factors That Increase Needs:**
• Exercise: Add 1.5-2.5 cups per hour
• Hot climate: Increase by 30-50%
• Pregnancy/Breastfeeding: Add 3-4 cups
• Illness (fever, diarrhea): Increase significantly

**Signs of Dehydration:**
• Dark yellow urine
• Dry mouth and lips
• Headache
• Fatigue
• Dizziness

**Hydration Tips:**
1. Start morning with 1-2 glasses of water
2. Carry reusable water bottle
3. Set hydration reminders
4. Eat water-rich foods (cucumber, watermelon)
5. Monitor urine color (pale straw = hydrated)

💧 **Check:** Use our Water Intake Calculator for your personalized goal!`;
}

// Pregnancy
if (q.includes('pregnancy') || q.includes('pregnant') || q.includes('baby')) {
return `🤰 **Pregnancy Health Guide**

**Key Health Metrics:**
• Healthy weight gain: 25-35 pounds (normal BMI)
• Due date: 40 weeks from last menstrual period
• Prenatal vitamins: Start before conception if possible

**Trimester Overview:**
• **First (0-13 weeks):** Morning sickness, fatigue, crucial development
• **Second (14-26 weeks):** Energy returns, baby movements begin
• **Third (27-40 weeks):** Final growth, preparation for birth

**Essential Care:**
1. Regular prenatal checkups
2. Balanced nutrition with folate, iron, calcium
3. Stay hydrated (10-12 cups water)
4. Moderate exercise (walking, swimming)
5. Avoid alcohol, smoking, raw foods

⚠️ **Always consult your OB-GYN for personalized pregnancy care.**`;
}

// General Health Tips
return `🏥 **HealthCalc AI Assistant**

Thank you for your question! While I'm in offline mode, here are some general health tips:

**Daily Health Checklist:**
✅ 7-9 hours of sleep
✅ 30 minutes of physical activity
✅ 5 servings of fruits/vegetables
✅ 8 glasses of water
✅ 10 minutes of mindfulness/stress relief

**Preventive Health:**
• Annual physical checkup
• Regular blood pressure monitoring
• Age-appropriate cancer screenings
• Vaccinations up to date
• Dental checkups twice yearly

**Explore Our Free Calculators:**
• BMI Calculator - Understand your weight status
• Heart Rate Calculator - Monitor cardiovascular health
• Sleep Calculator - Optimize your sleep schedule
• Calorie Calculator - Personalize your nutrition
• Water Intake Calculator - Stay properly hydrated

💬 **Ask me specific questions about any health topic or calculator!**

⚠️ **Medical Disclaimer:** This information is educational. Consult healthcare professionals for medical advice, diagnosis, or treatment.`;
}

// Get current page context
getPageContext() {
const url = window.location.href.toLowerCase();
const path = window.location.pathname.toLowerCase();
const title = document.title.toLowerCase();

const contextMap = {
'bmi': 'BMI and Weight Assessment Calculator',
'body-fat': 'Body Fat Percentage Analysis',
'calorie': 'Daily Calorie Needs Calculator',
'ideal-weight': 'Ideal Body Weight Calculator',
'heart-rate': 'Heart Rate and Cardiovascular Health',
'heart-risk': 'Heart Disease Risk Assessment',
'sleep-cycle': 'Sleep Cycle and Circadian Rhythm Optimization',
'sleep-debt': 'Sleep Debt and Recovery Calculator',
'water-intake': 'Daily Hydration Calculator',
'metabolic-age': 'Metabolic Age and Health Assessment',
'metabolic': 'Metabolic Rate Calculator',
'vascular-age': 'Vascular Age and Arterial Health',
'pregnancy': 'Pregnancy Due Date Calculator',
'menstrual': 'Menstrual Cycle and Fertility Tracking',
'hormone': 'Hormone Health and Balance',
'life-expectancy': 'Life Expectancy and Longevity Calculator',
'inflammation': 'Inflammation Score Assessment',
'gut-microbiome': 'Gut Microbiome Health Calculator',
'circadian': 'Circadian Rhythm and Biological Clock',
'fitness': 'Fitness and Exercise Calculator',
'nutrition': 'Nutrition and Diet Planning',
'about': 'About HealthCalc.in',
'contact': 'Contact HealthCalc Support',
'privacy': 'Privacy Policy Information',
'terms': 'Terms of Service'
};

// Check URL, path, and title
for (const [key, value] of Object.entries(contextMap)) {
if (url.includes(key) || path.includes(key) || title.includes(key)) {
return value;
}
}

// Default for homepage
if (path === '/' || path === '/index.html' || path === '') {
return 'HealthCalc Homepage - Health Calculator Directory';
}

return 'General Health Information';
}

// Cache management
cleanCache() {
if (this.responseCache.size > 100) {
const now = Date.now();
for (const [key, value] of this.responseCache) {
if (now - value.timestamp > CONFIG.CACHE_DURATION) {
this.responseCache.delete(key);
}
}
}
}

// User preferences management
loadUserPreferences() {
try {
const saved = localStorage.getItem('healthcalc_user_prefs');
return saved ? JSON.parse(saved) : {
theme: 'light',
fontSize: 'medium',
measurementSystem: 'metric',
notifications: true
};
} catch {
return {};
}
}

saveUserPreferences(prefs) {
this.userPreferences = { ...this.userPreferences, ...prefs };
try {
localStorage.setItem('healthcalc_user_prefs', JSON.stringify(this.userPreferences));
} catch (e) {
console.warn('Could not save preferences');
}
}

// Get session analytics
getSessionStats() {
return {
duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
interactions: this.totalInteractions,
context: this.getPageContext(),
timestamp: new Date().toISOString()
};
}
}

// ==================== CHAT WIDGET INTERFACE ====================
class ChatWidget {
constructor(aiEngine) {
this.ai = aiEngine;
this.isOpen = false;
this.messageCount = 0;
this.firstVisit = !localStorage.getItem('healthcalc_return_visitor');
this.widgetId = 'hc-ai-widget-' + Date.now();
}

// Build and inject complete widget
create() {
this.injectStyles();
this.injectHTML();
this.bindEvents();
this.initializeBehaviour();

console.log('✅ HealthCalc AI Widget Loaded');
console.log('📍 Context:', this.ai.getPageContext());
console.log('👤 User:', this.firstVisit ? 'New Visitor' : 'Returning User');
}

injectStyles() {
const styles = `
<style id="hc-ai-styles">
/* ============================================ */
/* HealthCalc AI Widget - Complete Stylesheet */
/* ============================================ */

/* Floating Action Button */
#hc-ai-fab {
position: fixed;
bottom: 30px;
right: 30px;
width: 62px;
height: 62px;
border-radius: 50%;
background: linear-gradient(135deg, ${CONFIG.PRIMARY_COLOR} 0%, ${CONFIG.SECONDARY_COLOR} 100%);
color: white;
border: none;
cursor: pointer;
box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
z-index: 999999;
display: flex;
align-items: center;
justify-content: center;
font-size: 28px;
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
animation: floatButton 3s ease-in-out infinite;
}

@keyframes floatButton {
0%, 100% { transform: translateY(0); }
50% { transform: translateY(-10px); }
}

#hc-ai-fab:hover {
transform: scale(1.1) translateY(-5px);
box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
animation: none;
}

#hc-ai-fab:active {
transform: scale(0.95);
}

/* Notification Badge */
.hc-ai-notification-badge {
position: absolute;
top: -4px;
right: -4px;
background: ${CONFIG.ACCENT_COLOR};
color: white;
border-radius: 50%;
width: 24px;
height: 24px;
font-size: 12px;
font-weight: bold;
display: flex;
align-items: center;
justify-content: center;
border: 3px solid white;
animation: badgePulse 2s infinite;
}

@keyframes badgePulse {
0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
50% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
}

/* Chat Window Container */
#hc-ai-window {
position: fixed;
bottom: 110px;
right: 30px;
width: 400px;
max-width: calc(100vw - 40px);
height: 600px;
max-height: calc(100vh - 140px);
background: #ffffff;
border-radius: 20px;
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
z-index: 999998;
display: none;
flex-direction: column;
overflow: hidden;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
animation: windowOpen 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes windowOpen {
from {
opacity: 0;
transform: translateY(20px) scale(0.95);
}
to {
opacity: 1;
transform: translateY(0) scale(1);
}
}

#hc-ai-window.minimized {
height: 60px;
}

/* Header */
#hc-ai-header {
background: linear-gradient(135deg, ${CONFIG.PRIMARY_COLOR} 0%, ${CONFIG.SECONDARY_COLOR} 100%);
color: white;
padding: 18px 20px;
display: flex;
align-items: center;
justify-content: space-between;
cursor: pointer;
user-select: none;
}

.hc-ai-header-left {
display: flex;
align-items: center;
gap: 12px;
}

.hc-ai-avatar {
width: 40px;
height: 40px;
background: rgba(255, 255, 255, 0.2);
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-size: 22px;
}

.hc-ai-header-info h3 {
margin: 0;
font-size: 16px;
font-weight: 600;
}

.hc-ai-header-info span {
font-size: 12px;
opacity: 0.9;
display: flex;
align-items: center;
gap: 6px;
}

.hc-online-indicator {
width: 8px;
height: 8px;
background: #4ade80;
border-radius: 50%;
display: inline-block;
animation: onlinePulse 2s infinite;
}

@keyframes onlinePulse {
0%, 100% { opacity: 1; transform: scale(1); }
50% { opacity: 0.5; transform: scale(1.5); }
}

.hc-ai-header-actions button {
background: rgba(255, 255, 255, 0.2);
border: none;
color: white;
width: 32px;
height: 32px;
border-radius: 8px;
cursor: pointer;
font-size: 16px;
transition: background 0.2s;
margin-left: 8px;
}

.hc-ai-header-actions button:hover {
background: rgba(255, 255, 255, 0.3);
}

/* Messages Area */
#hc-ai-messages {
flex: 1;
overflow-y: auto;
padding: 20px;
background: #f8fafc;
display: flex;
flex-direction: column;
gap: 16px;
}

#hc-ai-messages::-webkit-scrollbar {
width: 6px;
}

#hc-ai-messages::-webkit-scrollbar-track {
background: transparent;
}

#hc-ai-messages::-webkit-scrollbar-thumb {
background: #cbd5e1;
border-radius: 3px;
}

/* Message Bubbles */
.hc-message-wrapper {
display: flex;
gap: 10px;
animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
from {
opacity: 0;
transform: translateY(10px);
}
to {
opacity: 1;
transform: translateY(0);
}
}

.hc-message-wrapper.user-message {
flex-direction: row-reverse;
}

.hc-message-avatar {
width: 36px;
height: 36px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-size: 18px;
flex-shrink: 0;
}

.ai-message .hc-message-avatar {
background: #e0e7ff;
}

.user-message .hc-message-avatar {
background: ${CONFIG.PRIMARY_COLOR};
color: white;
}

.hc-message-bubble {
padding: 12px 16px;
border-radius: 16px;
max-width: 80%;
line-height: 1.6;
font-size: 14px;
word-wrap: break-word;
}

.ai-message .hc-message-bubble {
background: white;
color: #1e293b;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
border-top-left-radius: 4px;
}

.user-message .hc-message-bubble {
background: ${CONFIG.PRIMARY_COLOR};
color: white;
border-top-right-radius: 4px;
}

.hc-message-time {
font-size: 11px;
opacity: 0.6;
margin-top: 4px;
padding: 0 4px;
}

/* Typing Indicator */
.hc-typing-indicator {
display: flex;
gap: 6px;
padding: 12px 16px;
background: white;
border-radius: 16px;
width: fit-content;
}

.hc-typing-dot {
width: 8px;
height: 8px;
background: #94a3b8;
border-radius: 50%;
animation: typingBounce 1.4s infinite;
}

.hc-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.hc-typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
0%, 60%, 100% { transform: translateY(0); }
30% { transform: translateY(-10px); }
}

/* Suggestions */
#hc-ai-suggestions {
padding: 16px;
background: white;
border-top: 1px solid #e2e8f0;
display: flex;
flex-wrap: wrap;
gap: 8px;
max-height: 120px;
overflow-y: auto;
}

.hc-suggestion-chip {
background: #f1f5f9;
color: ${CONFIG.PRIMARY_COLOR};
border: 1px solid #e2e8f0;
padding: 8px 14px;
border-radius: 20px;
font-size: 13px;
cursor: pointer;
transition: all 0.2s;
white-space: nowrap;
user-select: none;
}

.hc-suggestion-chip:hover {
background: ${CONFIG.PRIMARY_COLOR};
color: white;
border-color: ${CONFIG.PRIMARY_COLOR};
transform: translateY(-1px);
}

/* Input Area */
#hc-ai-input-area {
padding: 16px;
background: white;
border-top: 1px solid #e2e8f0;
display: flex;
gap: 10px;
align-items: center;
}

#hc-ai-input {
flex: 1;
padding: 12px 18px;
border: 2px solid #e2e8f0;
border-radius: 25px;
outline: none;
font-size: 14px;
transition: border-color 0.3s;
font-family: inherit;
}

#hc-ai-input:focus {
border-color: ${CONFIG.PRIMARY_COLOR};
box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

#hc-ai-input::placeholder {
color: #94a3b8;
}

#hc-ai-send-btn {
width: 46px;
height: 46px;
border-radius: 50%;
background: ${CONFIG.PRIMARY_COLOR};
color: white;
border: none;
cursor: pointer;
font-size: 20px;
display: flex;
align-items: center;
justify-content: center;
transition: all 0.2s;
flex-shrink: 0;
}

#hc-ai-send-btn:hover {
background: ${CONFIG.SECONDARY_COLOR};
transform: scale(1.05);
}

#hc-ai-send-btn:active {
transform: scale(0.95);
}

#hc-ai-send-btn:disabled {
background: #cbd5e1;
cursor: not-allowed;
}

/* Footer */
#hc-ai-footer {
padding: 10px 16px;
background: #f8fafc;
border-top: 1px solid #e2e8f0;
text-align: center;
font-size: 11px;
color: #64748b;
}

/* Quick Actions */
.hc-quick-actions {
display: flex;
gap: 8px;
padding: 8px 16px;
background: #f8fafc;
overflow-x: auto;
}

.hc-quick-action-btn {
padding: 6px 12px;
background: white;
border: 1px solid #e2e8f0;
border-radius: 15px;
font-size: 12px;
cursor: pointer;
white-space: nowrap;
transition: all 0.2s;
}

.hc-quick-action-btn:hover {
background: ${CONFIG.PRIMARY_COLOR}10;
border-color: ${CONFIG.PRIMARY_COLOR};
}

/* Mobile Responsive */
@media (max-width: 480px) {
#hc-ai-window {
width: 100%;
height: 100%;
max-width: 100%;
max-height: 100%;
bottom: 0;
right: 0;
border-radius: 0;
position: fixed;
}

#hc-ai-fab {
bottom: 20px;
right: 20px;
width: 56px;
height: 56px;
font-size: 24px;
}

#hc-ai-messages {
padding: 12px;
}

.hc-message-bubble {
max-width: 85%;
font-size: 13px;
}
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
#hc-ai-window {
background: #1e293b;
}

#hc-ai-messages {
background: #0f172a;
}

.ai-message .hc-message-bubble {
background: #334155;
color: #e2e8f0;
}

#hc-ai-input {
background: #334155;
border-color: #475569;
color: #e2e8f0;
}

#hc-ai-suggestions {
background: #1e293b;
border-color: #334155;
}

.hc-suggestion-chip {
background: #334155;
border-color: #475569;
}
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', styles);
}

injectHTML() {
const html = `
<!-- HealthCalc AI Floating Button -->
<button id="hc-ai-fab" aria-label="Open Health Assistant" title="Health AI Assistant">
💬
<span class="hc-ai-notification-badge" style="display:none;">1</span>
</button>

<!-- HealthCalc AI Chat Window -->
<div id="hc-ai-window" role="dialog" aria-label="Health AI Assistant Chat">
<!-- Header -->
<div id="hc-ai-header">
<div class="hc-ai-header-left">
<div class="hc-ai-avatar">🏥</div>
<div class="hc-ai-header-info">
<h3>Health AI Assistant</h3>
<span>
<span class="hc-online-indicator"></span>
Online · Free
</span>
</div>
</div>
<div class="hc-ai-header-actions">
<button id="hc-ai-clear-chat" title="Clear Chat">🗑️</button>
<button id="hc-ai-minimize-btn" title="Minimize">━</button>
<button id="hc-ai-close-btn" title="Close">✕</button>
</div>
</div>

<!-- Messages Container -->
<div id="hc-ai-messages">
<div class="hc-message-wrapper ai-message">
<div class="hc-message-avatar">🤖</div>
<div>
<div class="hc-message-bubble">
<strong>Hello! 👋</strong><br><br>
I'm your <strong>HealthCalc AI Assistant</strong>. I can help you understand health metrics, calculator results, and wellness tips.<br><br>
<em>What would you like to know about today?</em>
</div>
<div class="hc-message-time">Just now</div>
</div>
</div>
</div>

<!-- Quick Actions -->
<div class="hc-quick-actions">
<button class="hc-quick-action-btn" data-query="Explain my BMI result">📊 BMI Help</button>
<button class="hc-quick-action-btn" data-query="Heart rate normal range">❤️ Heart Rate</button>
<button class="hc-quick-action-btn" data-query="How to sleep better">😴 Sleep Tips</button>
<button class="hc-quick-action-btn" data-query="Daily water intake recommendation">💧 Hydration</button>
<button class="hc-quick-action-btn" data-query="Healthy diet tips">🥗 Nutrition</button>
</div>

<!-- Suggestions Area -->
<div id="hc-ai-suggestions">
<span class="hc-suggestion-chip">What is a healthy BMI?</span>
<span class="hc-suggestion-chip">How many calories do I need?</span>
<span class="hc-suggestion-chip">Normal heart rate by age</span>
<span class="hc-suggestion-chip">Tips for weight loss</span>
</div>

<!-- Input Area -->
<div id="hc-ai-input-area">
<input
type="text"
id="hc-ai-input"
placeholder="Type your health question..."
aria-label="Type your question"
autocomplete="off"
>
<button id="hc-ai-send-btn" aria-label="Send message">
<span>➤</span>
</button>
</div>

<!-- Footer -->
<div id="hc-ai-footer">
⚠️ Information is educational only. Consult healthcare professionals for medical advice.
</div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', html);
}

bindEvents() {
// Open/Close widget
const fab = document.getElementById('hc-ai-fab');
const closeBtn = document.getElementById('hc-ai-close-btn');
const minimizeBtn = document.getElementById('hc-ai-minimize-btn');
const window = document.getElementById('hc-ai-window');
const input = document.getElementById('hc-ai-input');
const sendBtn = document.getElementById('hc-ai-send-btn');
const clearBtn = document.getElementById('hc-ai-clear-chat');

fab?.addEventListener('click', () => this.open());
closeBtn?.addEventListener('click', () => this.close());
minimizeBtn?.addEventListener('click', () => this.close());
clearBtn?.addEventListener('click', () => this.clearChat());

// Send message events
sendBtn?.addEventListener('click', () => this.sendMessage());
input?.addEventListener('keypress', (e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
this.sendMessage();
}
});

// Quick action buttons
document.querySelectorAll('.hc-quick-action-btn').forEach(btn => {
btn.addEventListener('click', () => {
const query = btn.dataset.query;
input.value = query;
this.sendMessage();
});
});

// Suggestion chips
document.querySelectorAll('.hc-suggestion-chip').forEach(chip => {
chip.addEventListener('click', () => {
input.value = chip.textContent;
this.sendMessage();
});
});

// Click header to minimize/maximize
document.getElementById('hc-ai-header')?.addEventListener('click', (e) => {
if (e.target.closest('button')) return; // Don't toggle if button clicked
if (window.classList.contains('minimized')) {
window.classList.remove('minimized');
}
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && this.isOpen) {
this.close();
}
});
}

initializeBehaviour() {
// First-time visitor: Auto-open chat after delay
if (this.firstVisit && CONFIG.AUTO_OPEN_DELAY > 0) {
setTimeout(() => {
this.open();
localStorage.setItem('healthcalc_return_visitor', 'true');
this.showWelcomeMessage();
}, CONFIG.AUTO_OPEN_DELAY);
}

// Add page-specific suggestions
this.updateSuggestionsForPage();
}

showWelcomeMessage() {
const context = this.ai.getPageContext();
const welcomeMsg = `👋 Welcome to HealthCalc! I notice you're on our ${context}. Feel free to ask me anything about health calculations or wellness tips!`;

setTimeout(() => {
this.addMessage(welcomeMsg, 'ai');
}, 1000);
}

updateSuggestionsForPage() {
const context = this.ai.getPageContext();
const suggestionsDiv = document.getElementById('hc-ai-suggestions');
if (!suggestionsDiv) return;

let suggestions = [];

if (context.includes('BMI')) {
suggestions = [
'What does my BMI number mean?',
'Is BMI accurate for athletes?',
'How to lower BMI naturally',
'BMI vs body fat percentage'
];
} else if (context.includes('Heart')) {
suggestions = [
'What is a normal resting heart rate?',
'How to improve heart health',
'Heart rate zones for exercise',
'Warning signs of heart problems'
];
} else if (context.includes('Sleep')) {
suggestions = [
'How much sleep do I need?',
'Tips for better sleep quality',
'What are sleep cycles?',
'How to fix sleep schedule'
];
} else if (context.includes('Calorie') || context.includes('Nutrition')) {
suggestions = [
'How many calories should I eat?',
'Healthy meal planning tips',
'Best foods for weight loss',
'Understanding macronutrients'
];
} else {
suggestions = [
'What health calculators do you offer?',
'How accurate are online calculators?',
'General health tips for adults',
'How often should I check my health?'
];
}

suggestionsDiv.innerHTML = suggestions
.map(s => `<span class="hc-suggestion-chip">${s}</span>`)
.join('');

// Rebind suggestion events
suggestionsDiv.querySelectorAll('.hc-suggestion-chip').forEach(chip => {
chip.addEventListener('click', () => {
const input = document.getElementById('hc-ai-input');
if (input) {
input.value = chip.textContent;
this.sendMessage();
}
});
});
}

open() {
const window = document.getElementById('hc-ai-window');
const fab = document.getElementById('hc-ai-fab');

if (window) {
window.style.display = 'flex';
window.classList.remove('minimized');
}
if (fab) {
fab.style.display = 'none';
}

this.isOpen = true;
this.focusInput();

// Track analytics
this.trackEvent('chat_opened');
}

close() {
const window = document.getElementById('hc-ai-window');
const fab = document.getElementById('hc-ai-fab');

if (window) {
window.style.display = 'none';
}
if (fab) {
fab.style.display = 'flex';
}

this.isOpen = false;

// Track analytics
this.trackEvent('chat_closed');
}

focusInput() {
setTimeout(() => {
const input = document.getElementById('hc-ai-input');
if (input) {
input.focus();
}
}, 300);
}

async sendMessage() {
const input = document.getElementById('hc-ai-input');
const sendBtn = document.getElementById('hc-ai-send-btn');

if (!input || !sendBtn) return;

const message = input.value.trim();
if (!message) return;

// Clear input and disable
input.value = '';
sendBtn.disabled = true;

// Display user message
this.addMessage(message, 'user');

// Show typing indicator
this.showTypingIndicator();

// Get AI response
const context = this.ai.getPageContext();
const response = await this.ai.query(message, context);

// Remove typing indicator
this.removeTypingIndicator();

// Display AI response
this.addMessage(response, 'ai');

// Re-enable input
sendBtn.disabled = false;
this.focusInput();

// Increment message count
this.messageCount++;

// Track interaction
this.trackEvent('message_sent', { context, messageLength: message.length });
}

addMessage(text, sender) {
const messagesDiv = document.getElementById('hc-ai-messages');
if (!messagesDiv) return;

const wrapper = document.createElement('div');
wrapper.className = `hc-message-wrapper ${sender}-message`;

const avatar = sender === 'user' ? '👤' : '🤖';
const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formattedText = this.formatMessage(text);

wrapper.innerHTML = `
<div class="hc-message-avatar">${avatar}</div>
<div>
<div class="hc-message-bubble">${formattedText}</div>
<div class="hc-message-time">${time}</div>
</div>
`;

messagesDiv.appendChild(wrapper);

// Smooth scroll to bottom
messagesDiv.scrollTo({
top: messagesDiv.scrollHeight,
behavior: 'smooth'
});
}

formatMessage(text) {
// Basic markdown-like formatting
return text
.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
.replace(/\*(.*?)\*/g, '<em>$1</em>')
.replace(/\n/g, '<br>')
.replace(/•/g, '<br>•');
}

showTypingIndicator() {
const messagesDiv = document.getElementById('hc-ai-messages');
if (!messagesDiv) return;

const wrapper = document.createElement('div');
wrapper.className = 'hc-message-wrapper ai-message';
wrapper.id = 'typing-indicator';

wrapper.innerHTML = `
<div class="hc-message-avatar">🤖</div>
<div class="hc-typing-indicator">
<div class="hc-typing-dot"></div>
<div class="hc-typing-dot"></div>
<div class="hc-typing-dot"></div>
</div>
`;

messagesDiv.appendChild(wrapper);
messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

removeTypingIndicator() {
const indicator = document.getElementById('typing-indicator');
if (indicator) {
indicator.remove();
}
}

clearChat() {
const messagesDiv = document.getElementById('hc-ai-messages');
if (messagesDiv) {
messagesDiv.innerHTML = '';
// Add back welcome message
this.addMessage(
'Chat cleared! How can I help you with your health questions?',
'ai'
);
}
}

trackEvent(eventName, data = {}) {
// Simple analytics tracking
const event = {
event: eventName,
timestamp: new Date().toISOString(),
page: window.location.pathname,
context: this.ai.getPageContext(),
sessionStats: this.ai.getSessionStats(),
...data
};

console.log('📊 Analytics:', event);

// Optional: Send to Google Analytics
if (typeof gtag === 'function') {
gtag('event', eventName, {
event_category: 'AI_Chat',
event_label: data.context || 'general'
});
}
}
}

// ==================== AUTO INSIGHTS FOR CALCULATORS ====================
class CalculatorInsights {
constructor(aiEngine) {
this.ai = aiEngine;
this.processedElements = new WeakSet();
}

// Start observing calculator results
observe() {
// Watch for dynamically loaded results
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
mutation.addedNodes.forEach((node) => {
if (node.nodeType === 1) { // Element node
this.scanForResults(node);
}
});
});
});

observer.observe(document.body, {
childList: true,
subtree: true
});

// Initial scan
setTimeout(() => this.scanForResults(document.body), 1000);
}

scanForResults(container) {
const resultSelectors = [
'.result', '#result', '#results',
'.calculator-result', '.calculation-result',
'.output-value', '.bmi-value', '.score-display',
'[data-result]', '.result-container'
];

resultSelectors.forEach(selector => {
const elements = container.querySelectorAll(selector);
elements.forEach(el => {
if (!this.processedElements.has(el)) {
this.addInsightPanel(el);
this.processedElements.add(el);
}
});
});
}

async addInsightPanel(resultElement) {
const context = this.ai.getPageContext();
const resultText = resultElement.textContent.trim();

if (!resultText || resultText.length < 2) return;

// Create insight container
const insightPanel = document.createElement('div');
insightPanel.className = 'hc-ai-insight-panel';
insightPanel.style.cssText = `
background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
border: 2px solid ${CONFIG.PRIMARY_COLOR}30;
border-radius: 16px;
padding: 20px;
margin: 20px 0;
animation: fadeInUp 0.5s ease;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

insightPanel.innerHTML = `
<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
<span style="font-size: 28px;">🤖</span>
<div>
<strong style="color: ${CONFIG.PRIMARY_COLOR}; font-size: 16px; display: block;">
AI-Powered Health Insights
</strong>
<small style="color: #64748b;">Personalized analysis of your results</small>
</div>
</div>
<div class="hc-insight-content" style="padding: 12px; background: white; border-radius: 12px; line-height: 1.6; color: #334155;">
<div class="hc-insight-loading">
<span>⏳ Analyzing your results...</span>
</div>
<div class="hc-insight-text" style="display: none;"></div>
</div>
<button class="hc-ask-more-btn" style="
margin-top: 12px;
padding: 10px 20px;
background: ${CONFIG.PRIMARY_COLOR};
color: white;
border: none;
border-radius: 25px;
cursor: pointer;
font-size: 14px;
font-weight: 500;
transition: all 0.2s;
">
💬 Ask More About Your Results
</button>
`;

// Insert after result
resultElement.parentNode?.insertBefore(insightPanel, resultElement.nextSibling);

// Get AI insight
try {
const insight = await this.ai.query(
`Based on this ${context} result: "${resultText}", provide 2-3 specific, actionable health insights or recommendations. Keep each point brief.`,
context
);

// Display insight
const loadingEl = insightPanel.querySelector('.hc-insight-loading');
const contentEl = insightPanel.querySelector('.hc-insight-text');

if (loadingEl) loadingEl.style.display = 'none';
if (contentEl) {
contentEl.style.display = 'block';
contentEl.innerHTML = insight.replace(/\n/g, '<br>');
}
} catch (error) {
const loadingEl = insightPanel.querySelector('.hc-insight-loading');
if (loadingEl) {
loadingEl.innerHTML = '<span style="color: #64748b;">💡 Use our AI chat assistant for personalized insights!</span>';
}
}

// Bind "Ask More" button
const askBtn = insightPanel.querySelector('.hc-ask-more-btn');
askBtn?.addEventListener('click', () => {
if (window.healthCalcAI?.chat) {
window.healthCalcAI.chat.open();
}
});
}
}

// ==================== INITIALIZATION ====================
function initializeAI() {
// Prevent double initialization
if (window.healthCalcAI) {
console.log('ℹ️ HealthCalc AI already initialized');
return;
}

try {
console.log('🚀 Initializing HealthCalc AI Assistant...');

// Create AI engine
const aiEngine = new HealthAIEngine();

// Create chat widget
const chatWidget = new ChatWidget(aiEngine);
chatWidget.create();

// Create calculator insights (if enabled)
let calculatorInsights = null;
if (CONFIG.AUTO_INSIGHTS) {
calculatorInsights = new CalculatorInsights(aiEngine);
calculatorInsights.observe();
}

// Expose global API
window.healthCalcAI = {
engine: aiEngine,
chat: chatWidget,
insights: calculatorInsights,

// Public methods
askQuestion: (question, context) => aiEngine.query(question, context),
openChat: () => chatWidget.open(),
closeChat: () => chatWidget.close(),
getContext: () => aiEngine.getPageContext(),
getStats: () => aiEngine.getSessionStats(),

// Version info
version: '2.0.0',
initialized: new Date().toISOString()
};

console.log('✅ HealthCalc AI Assistant Ready!');
console.log('📍 Page Context:', aiEngine.getPageContext());
console.log('💬 Chat widget loaded - Look for the floating button');

// Dispatch custom event
window.dispatchEvent(new CustomEvent('healthcalcAIReady', {
detail: { version: '2.0.0' }
}));

} catch (error) {
console.error('❌ Failed to initialize HealthCalc AI:', error);
}
}

// Start when DOM is ready
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initializeAI);
} else {
initializeAI();
}

})();
