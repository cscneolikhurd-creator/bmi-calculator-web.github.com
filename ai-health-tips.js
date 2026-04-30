// ai-health-tips.js - AI Health Tips for ALL HealthCalc Tools
// Works with Gemini API - Just add this one file to all calculators

(function() {
// API Configuration
var GEMINI_API_KEY = 'AIzaSyBvS34JYPxDiIv-CrHuMaf_QuK_pnrknDs';
var GEMINI_MODEL = 'gemini-2.0-flash';

// Auto-initialize when page loads
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initAI);
} else {
initAI();
}

function initAI() {
var aiBtn = document.getElementById('getAiBtn');
if (!aiBtn) {
console.log('ℹ️ No AI button found on this page - skipping AI setup');
return;
}

// Remove old event listeners
var newBtn = aiBtn.cloneNode(true);
aiBtn.parentNode.replaceChild(newBtn, aiBtn);

// Add click handler
newBtn.addEventListener('click', getAIAdvice);
console.log('🤖 AI Health Tips ready! Click "Get Personalized Advice" button.');
}

async function getAIAdvice() {
var btn = document.getElementById('getAiBtn');
var loading = document.getElementById('aiLoading');
var resultCard = document.getElementById('aiResultCard');
var content = document.getElementById('aiAdviceContent');

if (!btn || !loading || !resultCard || !content) {
alert('AI components missing on this page. Please refresh and try again.');
return;
}

// Show loading
btn.style.display = 'none';
loading.style.display = 'block';
resultCard.style.display = 'none';

// Collect page data
var pageData = getAllPageData();
var prompt = createSmartPrompt(pageData);

console.log('📤 Sending to AI:', prompt.substring(0, 100) + '...');

try {
var response = await fetch(
'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY,
{
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
contents: [{
parts: [{ text: prompt }]
}],
generationConfig: {
temperature: 0.7,
maxOutputTokens: 300,
topP: 0.8,
topK: 40
}
})
}
);

var data = await response.json();
console.log('📥 AI Response:', data);

if (!response.ok) {
var errorMsg = data.error?.message || 'Unknown API error';
throw new Error(errorMsg);
}

var advice = data.candidates?.[0]?.content?.parts?.[0]?.text;

if (!advice || advice.trim() === '') {
throw new Error('Empty response from AI');
}

// Show result
content.innerHTML = '<div style="padding:16px;background:#f0fdf4;border-radius:10px;border-left:4px solid #10b981;line-height:1.6;">' +
'<div style="font-size:0.85rem;color:#059669;margin-bottom:8px;">✨ AI-Generated Health Tips</div>' +
'<div style="white-space:pre-wrap;color:#1a202c;">' + advice + '</div>' +
'<div style="margin-top:12px;padding-top:10px;border-top:1px solid #d1fae5;font-size:0.7rem;color:#6b7280;">⚕️ These tips complement professional medical advice</div>' +
'</div>';

resultCard.style.display = 'block';

} catch (error) {
console.error('❌ AI Error:', error.message);

content.innerHTML = '<div style="padding:16px;background:#fef2f2;border-radius:10px;border-left:4px solid #ef4444;">' +
'<div style="color:#dc2626;font-weight:600;margin-bottom:8px;">⚠️ Tips Unavailable</div>' +
'<p style="color:#991b1b;margin:0;font-size:0.9rem;">Unable to generate tips at this moment.</p>' +
'<p style="color:#b91c1c;margin:5px 0 0;font-size:0.8rem;">Error: ' + error.message + '</p>' +
'<button onclick="location.reload()" style="margin-top:10px;padding:8px 16px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;">Try Again</button>' +
'</div>';

resultCard.style.display = 'block';

} finally {
loading.style.display = 'none';
btn.style.display = 'inline-flex';
}
}

function getAllPageData() {
var data = {
url: window.location.href,
title: document.title || '',
toolName: '',
mainResult: '',
allValues: []
};

// Get tool name from H1 or title
var h1 = document.querySelector('h1');
if (h1) {
data.toolName = h1.textContent.replace(/[🎯⚖️🧬🔥💧😴❤️🏃🤰⏳🔬🦠🌙🌸⚡]/g, '').trim();
}

// Get main result value
var mainValueSelectors = [
'#bodyFat', '#bmi-display', '#tdee', '#riskPercent', '#idealWeight',
'#fat-value', '#peterson', '#health-score', '#calorie-value',
'#heartAge', '#vascularAge', '#inflammationScore', '#gutScore',
'#sleepScore', '#circadianScore', '#hormoneScore', '#lifeExpectancy',
'#metabolicAge', '#waterIntake', '#bmr'
];

for (var i = 0; i < mainValueSelectors.length; i++) {
var el = document.querySelector(mainValueSelectors[i]);
if (el && el.textContent && el.textContent.trim() !== '--' && el.textContent.trim() !== '') {
var label = mainValueSelectors[i].replace('#', '').replace(/([A-Z])/g, ' $1').trim();
data.allValues.push(label + ': ' + el.textContent.trim());
if (!data.mainResult) {
data.mainResult = el.textContent.trim();
}
}
}

// Get category labels
var categories = document.querySelectorAll('.health-item .label, .macro-item .label, .goal-card .title, .risk-category, .card-subtitle');
categories.forEach(function(cat) {
var val = cat.nextElementSibling;
if (val && val.textContent && val.textContent.trim() !== '--') {
data.allValues.push(cat.textContent.trim() + ': ' + val.textContent.trim());
}
});

return data;
}

function createSmartPrompt(data) {
var toolName = data.toolName || 'Health Calculator';
var mainResult = data.mainResult || 'recent calculation';
var details = data.allValues.slice(0, 8).join(', ');

return 'Act as a friendly health coach. A user just used the ' + toolName +
' and got these results: ' + mainResult +
'. Additional details: ' + details +
'. Give exactly 3 personalized, actionable health tips based on these results. ' +
'Each tip should be 1-2 sentences. Be encouraging and specific. ' +
'Focus on practical diet, exercise, and lifestyle changes. ' +
'Format: Use bullet points (•) for each tip. Keep total response under 150 words.';
}

console.log('✅ HealthCalc AI Module Loaded Successfully');
console.log('🔑 API Key: ' + GEMINI_API_KEY.substring(0, 8) + '...');
console.log('📋 Ready to generate health tips!');

})();
