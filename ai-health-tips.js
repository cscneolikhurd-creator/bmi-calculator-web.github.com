// ai-health-tips.js - Advanced AI Health Tips for ALL HealthCalc Tools
// Works with Gemini API - Multi-language, Smart Data Extraction, Enhanced Prompts
// Version: 2.0
// Last Updated: 2026-05-14

(function() {
'use strict';

// ========== API CONFIGURATION ==========
var GEMINI_API_KEY = 'AIzaSyBvS34JYPxDiIv-CrHuMaf_QuK_pnrknDs';
var GEMINI_MODEL = 'gemini-2.0-flash';

// ========== GLOBAL STATE ==========
var currentLanguage = 'en';
var isInitialized = false;

// ========== TOOL-SPECIFIC PROMPT TEMPLATES ==========
var toolTemplates = {
    'bmi': 'Based on BMI of {value}. Normal range: 18.5-24.9. Indian cutoff: 23+ overweight.',
    'bodyfat': 'Based on body fat percentage of {value}%. Healthy ranges: Men 8-20%, Women 20-32%.',
    'calorie': 'Daily calorie need is {value} kcal. This is your maintenance calories.',
    'ffmi': 'FFMI score is {value}. Natural lifters typically range 18-24, enhanced above 25+.',
    'whr': 'Waist-to-hip ratio is {value}. Healthy: Women <0.85, Men <0.90.',
    'bac': 'Estimated BAC is {value}%. Legal limit: 0.08% in USA/UK, 0.05% in EU/India.',
    'vo2max': 'VO₂ Max is {value} mL/kg/min. Average for age: 35-45 for men, 30-38 for women.',
    'heartrate': 'Heart rate zones calculated. Max HR: {value} bpm.',
    'met': 'Activity calories burned: {value} kcal. MET value indicates exercise intensity.',
    'pregnancy': 'Due date: {value}. Current week: {week} weeks pregnant.',
    'sleep': 'Sleep debt: {value} hours. Optimal sleep: 7-9 hours nightly.',
    'gut': 'Gut health score: {value}/100. Higher diversity = better microbiome health.',
    'inflammation': 'Inflammation score: {value}/100. Lower is better for health.',
    'life': 'Life expectancy: {value} years. Based on WHO/UN life tables.',
    'hormone': 'Hormone health score: {value}/100. Balanced hormones = better health.',
    'metabolic': 'Metabolic age: {value} years. Lower than actual age = better metabolism.',
    'water': 'Daily water need: {value} L. Adjust for activity and weather.',
    'idealweight': 'Ideal weight range: {value} kg. Frame size adjusted.'
};

// ========== LANGUAGE DETECTION ==========
function detectLanguage() {
    // Check URL parameters
    var urlParams = new URLSearchParams(window.location.search);
    var langParam = urlParams.get('lang');
    if (langParam && ['en', 'hi', 'es', 'fr', 'de', 'ja', 'ar'].includes(langParam)) {
        return langParam;
    }
    
    // Check HTML lang attribute
    var htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang.startsWith('hi')) return 'hi';
    
    // Check for Hindi text on page
    var bodyText = document.body.innerText || '';
    var hasHindi = /[\u0900-\u097F]/.test(bodyText);
    if (hasHindi) return 'hi';
    
    // Check localStorage
    try {
        var savedLang = localStorage.getItem('healthcalc_language');
        if (savedLang && ['en', 'hi', 'es', 'fr', 'de', 'ja', 'ar'].includes(savedLang)) {
            return savedLang;
        }
    } catch(e) {}
    
    return 'en';
}

// ========== LANGUAGE MESSAGES ==========
var langMessages = {
    en: {
        title: '✨ AI-Generated Health Tips',
        disclaimer: '⚕️ These tips complement professional medical advice',
        errorTitle: '⚠️ Tips Unavailable',
        errorMsg: 'Unable to generate tips at this moment.',
        tryAgain: 'Try Again',
        loading: 'Generating your personalized health tips...'
    },
    hi: {
        title: '✨ AI-जनरेटेड स्वास्थ्य सुझाव',
        disclaimer: '⚕️ ये सुझाव पेशेवर चिकित्सा सलाह के पूरक हैं',
        errorTitle: '⚠️ सुझाव अनुपलब्ध',
        errorMsg: 'इस समय सुझाव उत्पन्न करने में असमर्थ।',
        tryAgain: 'पुनः प्रयास करें',
        loading: 'आपके व्यक्तिगत स्वास्थ्य सुझाव तैयार किए जा रहे हैं...'
    },
    es: {
        title: '✨ Consejos de Salud Generados por IA',
        disclaimer: '⚕️ Estos consejos complementan el asesoramiento médico profesional',
        errorTitle: '⚠️ Consejos no disponibles',
        errorMsg: 'No se pueden generar consejos en este momento.',
        tryAgain: 'Reintentar',
        loading: 'Generando tus consejos de salud personalizados...'
    },
    fr: {
        title: '✨ Conseils Santé Générés par IA',
        disclaimer: '⚕️ Ces conseils complètent les avis médicaux professionnels',
        errorTitle: '⚠️ Conseils indisponibles',
        errorMsg: 'Impossible de générer des conseils pour le moment.',
        tryAgain: 'Réessayer',
        loading: 'Génération de vos conseils santé personnalisés...'
    },
    de: {
        title: '✨ KI-generierte Gesundheitstipps',
        disclaimer: '⚕️ Diese Tipps ergänzen die professionelle medizinische Beratung',
        errorTitle: '⚠️ Tipps nicht verfügbar',
        errorMsg: 'Tipps können derzeit nicht generiert werden.',
        tryAgain: 'Erneut versuchen',
        loading: 'Generiere Ihre personalisierten Gesundheitstipps...'
    }
};

// ========== TOOL DETECTION ==========
function detectTool() {
    var url = window.location.href;
    var title = document.title.toLowerCase();
    
    var tools = {
        bmi: ['bmi', 'body mass index'],
        bodyfat: ['body fat', 'bodyfat'],
        calorie: ['calorie', 'tdee', 'caloric'],
        ffmi: ['ffmi', 'fat-free mass'],
        whr: ['whr', 'waist-to-hip', 'waist hip'],
        bac: ['bac', 'blood alcohol', 'alcohol'],
        vo2max: ['vo2', 'vo2max', 'cardio fitness'],
        heartrate: ['heart rate', 'heart-rate', 'karvonen'],
        met: ['met', 'activity', 'calories burned'],
        pregnancy: ['pregnancy', 'due date', 'pregnant'],
        sleep: ['sleep debt', 'sleep cycle', 'sleep quality'],
        gut: ['gut', 'microbiome', 'microbiome health'],
        inflammation: ['inflammation', 'inflammatory'],
        life: ['life expectancy', 'healthspan', 'lifespan'],
        hormone: ['hormone', 'testosterone', 'estrogen'],
        metabolic: ['metabolic age', 'metabolism'],
        water: ['water intake', 'hydration'],
        idealweight: ['ideal weight', 'ideal body weight']
    };
    
    for (var tool in tools) {
        for (var i = 0; i < tools[tool].length; i++) {
            if (url.includes(tools[tool][i].replace(/ /g, '-')) || title.includes(tools[tool][i])) {
                return tool;
            }
        }
    }
    return null;
}

// ========== ENHANCED DATA EXTRACTION ==========
function getAllPageData() {
    var data = {
        url: window.location.href,
        title: document.title || '',
        toolName: '',
        toolType: null,
        mainValue: null,
        mainUnit: '',
        allValues: {},
        age: null,
        gender: null,
        height: null,
        weight: null,
        language: currentLanguage
    };
    
    // Get tool name from H1
    var h1 = document.querySelector('h1');
    if (h1) {
        data.toolName = h1.textContent.replace(/[^\w\s]/g, '').trim();
    }
    
    // Detect tool type
    data.toolType = detectTool();
    
    // Common value selectors with their units
    var valueSelectors = [
        { selector: '#bmi-display, .bmi-value, #bmiValue', name: 'BMI', unit: '' },
        { selector: '#bodyfat, #bodyFat, .bodyfat-value, #fat-value', name: 'Body Fat', unit: '%' },
        { selector: '#tdee, #calories, #calorie-value, .calorie-number', name: 'Calories', unit: 'kcal' },
        { selector: '#idealWeight, #ideal-weight, .ideal-weight', name: 'Ideal Weight', unit: 'kg' },
        { selector: '#ffmiNumber, .ffmi-value, #ffmi', name: 'FFMI', unit: '' },
        { selector: '#whrValue, .whr-number, #whr', name: 'WHR', unit: '' },
        { selector: '#bacResult, .bac-value, #bac', name: 'BAC', unit: '%' },
        { selector: '#vo2Number, .vo2-value, #vo2', name: 'VO₂ Max', unit: 'mL/kg/min' },
        { selector: '#maxHr, .max-value, #maxHeartRate', name: 'Max HR', unit: 'bpm' },
        { selector: '#calories, .calorie-burned, #caloriesBurned', name: 'Calories Burned', unit: 'kcal' },
        { selector: '#dueDateDisplay, .due-date-number', name: 'Due Date', unit: '' },
        { selector: '#debtHours, .debt-value, #sleepDebt', name: 'Sleep Debt', unit: 'hours' },
        { selector: '#scoreNumber, .score-number, #gutScore', name: 'Health Score', unit: '/100' },
        { selector: '#inflammatoryScore, .inflammation-value', name: 'Inflammation Score', unit: '/100' },
        { selector: '#lifespanDisplay, .live-main, #lifeExpectancy', name: 'Life Expectancy', unit: 'years' },
        { selector: '#hormoneScore, .score-number, #hormoneScore', name: 'Hormone Score', unit: '/100' },
        { selector: '#metabolicAge, .age-number, #metaAge', name: 'Metabolic Age', unit: 'years' },
        { selector: '#waterAmount, .water-value', name: 'Water Need', unit: 'L' },
        { selector: '#idealWeight, #idealRange', name: 'Ideal Weight', unit: 'kg' }
    ];
    
    // Extract main value
    for (var i = 0; i < valueSelectors.length; i++) {
        var sel = valueSelectors[i];
        var elements = document.querySelectorAll(sel.selector);
        for (var j = 0; j < elements.length; j++) {
            var el = elements[j];
            var text = el.textContent.trim();
            if (text && text !== '--' && text !== '' && !isNaN(parseFloat(text))) {
                data.mainValue = parseFloat(text);
                data.mainUnit = sel.unit;
                data.allValues[sel.name] = { value: data.mainValue, unit: sel.unit };
                break;
            }
        }
        if (data.mainValue) break;
    }
    
    // Extract age
    var ageSelectors = ['#age', '#ageValue', '.age-value', 'input#age', 'input[name="age"]'];
    for (var i = 0; i < ageSelectors.length; i++) {
        var ageEl = document.querySelector(ageSelectors[i]);
        if (ageEl && ageEl.value) {
            data.age = parseInt(ageEl.value);
            break;
        }
    }
    
    // Extract gender
    var genderSelect = document.querySelector('#gender, select[name="gender"]');
    if (genderSelect && genderSelect.value) {
        data.gender = genderSelect.value;
    }
    
    // Extract height & weight
    var heightEl = document.querySelector('#height, #heightCm, input[name="height"]');
    if (heightEl && heightEl.value) data.height = parseFloat(heightEl.value);
    
    var weightEl = document.querySelector('#weight, #weightKg, input[name="weight"]');
    if (weightEl && weightEl.value) data.weight = parseFloat(weightEl.value);
    
    // Extract from result display
    var resultDisplays = document.querySelectorAll('.result-card, .score-box, .value, .result-value, .display-value');
    for (var i = 0; i < resultDisplays.length && Object.keys(data.allValues).length < 5; i++) {
        var text = resultDisplays[i].textContent.trim();
        if (text && !isNaN(parseFloat(text)) && parseFloat(text) > 0 && parseFloat(text) < 200) {
            var label = resultDisplays[i].previousElementSibling;
            var name = label ? label.textContent.trim() : 'Value';
            if (!data.allValues[name]) {
                data.allValues[name] = { value: parseFloat(text), unit: '' };
            }
        }
    }
    
    return data;
}

// ========== SMART PROMPT GENERATION ==========
function createSmartPrompt(data) {
    var toolName = data.toolName || 'Health Calculator';
    var mainValue = data.mainValue;
    var toolType = data.toolType;
    
    // Use tool-specific template if available
    var template = null;
    if (toolType && toolTemplates[toolType]) {
        template = toolTemplates[toolType];
        template = template.replace('{value}', mainValue);
        if (data.age) template = template.replace('{age}', data.age);
    }
    
    var context = '';
    if (template) {
        context = template;
    } else if (mainValue) {
        context = 'Main result: ' + mainValue + (data.mainUnit ? ' ' + data.mainUnit : '');
    }
    
    // Add additional context
    var additional = [];
    if (data.age) additional.push('Age: ' + data.age);
    if (data.gender) additional.push('Gender: ' + data.gender);
    if (data.height) additional.push('Height: ' + data.height + 'cm');
    if (data.weight) additional.push('Weight: ' + data.weight + 'kg');
    
    // Add other values
    var valueCount = 0;
    for (var key in data.allValues) {
        if (valueCount < 3 && key !== 'Main') {
            var val = data.allValues[key];
            additional.push(key + ': ' + val.value + (val.unit ? ' ' + val.unit : ''));
            valueCount++;
        }
    }
    
    var fullContext = context;
    if (additional.length > 0) {
        fullContext += (fullContext ? ' | ' : '') + additional.join(', ');
    }
    
    // Language-specific instruction
    var langInstructions = {
        en: 'Respond in English.',
        hi: 'हिंदी में जवाब दें।',
        es: 'Responde en español.',
        fr: 'Répondez en français.',
        de: 'Antworten Sie auf Deutsch.',
        ja: '日本語で答えてください。',
        ar: 'بالعربية رد.'
    };
    
    var langInstruction = langInstructions[currentLanguage] || 'Respond in English.';
    
    return 'You are a friendly, professional health coach. A user used the "' + toolName + '" calculator.\n\n' +
           'User data: ' + fullContext + '\n\n' +
           'Give exactly 3 personalized, actionable health tips based on these results.\n' +
           'Each tip should be 1-2 sentences, practical, and encouraging.\n' +
           'Focus on diet, exercise, sleep, stress management, or lifestyle changes.\n' +
           langInstruction + '\n\n' +
           'Format: Use bullet points (•) for each tip. Keep total under 150 words.';
}

// ========== MAIN AI FUNCTION ==========
async function getAIAdvice() {
    var btn = document.getElementById('getAiBtn');
    var loading = document.getElementById('aiLoading');
    var resultCard = document.getElementById('aiResultCard');
    var content = document.getElementById('aiAdviceContent');
    
    if (!btn || !loading || !resultCard || !content) {
        console.error('❌ AI components missing');
        return;
    }
    
    // Detect language
    currentLanguage = detectLanguage();
    var msg = langMessages[currentLanguage] || langMessages.en;
    
    // Show loading
    btn.style.display = 'none';
    loading.style.display = 'block';
    resultCard.style.display = 'none';
    
    // Update loading text
    var loadingText = loading.querySelector('span');
    if (loadingText) loadingText.textContent = msg.loading;
    
    // Collect page data
    var pageData = getAllPageData();
    pageData.language = currentLanguage;
    
    var prompt = createSmartPrompt(pageData);
    
    console.log('📤 AI Request:', {
        tool: pageData.toolType || pageData.toolName,
        mainValue: pageData.mainValue,
        language: currentLanguage
    });
    
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
                        maxOutputTokens: 350,
                        topP: 0.9,
                        topK: 40
                    }
                })
            }
        );
        
        var data = await response.json();
        
        if (!response.ok) {
            var errorDetail = data.error?.message || 'Unknown API error';
            throw new Error(errorDetail);
        }
        
        var advice = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!advice || advice.trim() === '') {
            throw new Error('Empty response from API');
        }
        
        // Format advice with proper HTML
        var formattedAdvice = advice.replace(/\n/g, '<br>');
        
        content.innerHTML = '<div style="padding:16px;background:#f0fdf4;border-radius:12px;border-left:4px solid #10b981;line-height:1.6;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<span style="font-size:1.2rem;">✨</span>' +
            '<span style="font-size:0.85rem;color:#059669;font-weight:600;">' + msg.title + '</span>' +
            '</div>' +
            '<div style="white-space:pre-wrap;color:#1a202c;font-size:0.95rem;">' + formattedAdvice + '</div>' +
            '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #d1fae5;font-size:0.7rem;color:#6b7280;">' +
            msg.disclaimer +
            '</div>' +
            '</div>';
        
        resultCard.style.display = 'block';
        
    } catch (error) {
        console.error('❌ AI Error:', error.message);
        
        content.innerHTML = '<div style="padding:16px;background:#fef2f2;border-radius:12px;border-left:4px solid #ef4444;">' +
            '<div style="color:#dc2626;font-weight:600;margin-bottom:8px;">' + msg.errorTitle + '</div>' +
            '<p style="color:#991b1b;margin:0;font-size:0.9rem;">' + msg.errorMsg + '</p>' +
            '<p style="color:#b91c1c;margin:5px 0 0;font-size:0.8rem;">Error: ' + error.message.substring(0, 100) + '</p>' +
            '<button onclick="location.reload()" style="margin-top:12px;padding:8px 18px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">' + msg.tryAgain + '</button>' +
            '</div>';
        
        resultCard.style.display = 'block';
        
    } finally {
        loading.style.display = 'none';
        btn.style.display = 'inline-flex';
    }
}

// ========== INITIALIZATION ==========
function initAI() {
    var aiBtn = document.getElementById('getAiBtn');
    if (!aiBtn) {
        console.log('ℹ️ No AI button found - skipping AI setup');
        return;
    }
    
    // Detect language
    currentLanguage = detectLanguage();
    
    // Remove old event listeners and add new one
    var newBtn = aiBtn.cloneNode(true);
    aiBtn.parentNode.replaceChild(newBtn, aiBtn);
    newBtn.addEventListener('click', getAIAdvice);
    
    // Update button text based on language (optional)
    var btnText = newBtn.querySelector('span');
    if (btnText) {
        var langTexts = {
            en: 'Get Personalized Advice',
            hi: 'व्यक्तिगत सलाह लें',
            es: 'Obtener Consejos',
            fr: 'Obtenir des Conseils',
            de: 'Tipps Erhalten',
            ja: 'アドバイスを取得',
            ar: 'احصل على نصائح'
        };
        if (langTexts[currentLanguage]) {
            btnText.textContent = langTexts[currentLanguage];
        }
    }
    
    isInitialized = true;
    console.log('🤖 AI Health Tips ready! Language:', currentLanguage);
}

// ========== EXPORT ==========
window.AIHealthTips = {
    init: initAI,
    getAdvice: getAIAdvice,
    setLanguage: function(lang) {
        if (['en', 'hi', 'es', 'fr', 'de', 'ja', 'ar'].includes(lang)) {
            currentLanguage = lang;
            try { localStorage.setItem('healthcalc_language', lang); } catch(e) {}
            console.log('🌐 AI language set to:', lang);
        }
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAI);
} else {
    initAI();
}

console.log('✅ Advanced AI Health Tips Module Loaded v2.0');
console.log('🔑 API: ' + GEMINI_MODEL);
console.log('🌐 Default language: ' + currentLanguage);

})();
