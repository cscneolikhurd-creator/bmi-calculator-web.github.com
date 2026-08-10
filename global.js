// ===============================================
//  HEALTHCALC.IN - GLOBAL.JS (Universal)
//  Version: 3.0 (Premium UI & Groq AI Integrated)
//  Features: LocalStorage Preferences, AI Chat Engine, Unit Conversions
//  Last Updated: 2026-08-10
// ===============================================

(function() {
    'use strict';

    // ==============================================
    // 🔥 SECURE AI CHAT CONFIGURATION (Cloudflare Proxy for Groq)
    // ==============================================
    var WORKER_PROXY_URL = 'https://groq-proxy.cscneolikhurd.workers.dev/';

    // ==============================================
    // THEME MANAGEMENT (Dark/Light Mode)
    // ==============================================
    function initTheme() {
        var saved = localStorage.getItem('healthcalc_theme') || 'light';
        document.body.classList.toggle('dark', saved === 'dark');
        updateThemeIcon(saved);
    }

    function setTheme(theme) {
        localStorage.setItem('healthcalc_theme', theme);
        document.body.classList.toggle('dark', theme === 'dark');
        updateThemeIcon(theme);
    }

    function getTheme() {
        return localStorage.getItem('healthcalc_theme') || 'light';
    }

    function updateThemeIcon(theme) {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    // ==============================================
    // COUNTRY & UNIT MANAGEMENT
    // ==============================================
    function getCountry() {
        return localStorage.getItem('healthcalc_country') || 'us';
    }

    function setCountry(country) {
        localStorage.setItem('healthcalc_country', country);
        var selects = document.querySelectorAll('#countrySelect, [data-country-select]');
        selects.forEach(function(sel) {
            if (sel.tagName === 'SELECT') sel.value = country;
        });
        
        // Auto-set units based on country
        if (['us', 'mm'].includes(country)) { // mm = Myanmar uses imperial roughly
            setSavedUnit('imperial');
        } else {
            setSavedUnit('metric');
        }
    }

    function detectUserUnit() {
        var saved = localStorage.getItem('healthcalc_units');
        if (saved) return saved;
        
        try {
            var language = navigator.language || 'en-US';
            if (language === 'en-US') {
                return 'imperial';
            }
        } catch(e) {}
        
        return 'metric';
    }

    function getSavedUnit() {
        return localStorage.getItem('healthcalc_units') || detectUserUnit();
    }

    function setSavedUnit(unit) {
        localStorage.setItem('healthcalc_units', unit);
        document.dispatchEvent(new CustomEvent('unitChanged', { detail: { unit: unit } }));
    }

    // ==============================================
    // UNIT CONVERSION HELPERS
    // ==============================================
    var UNIT_CONVERSION = {
        cmToInch: function(cm) { return cm / 2.54; },
        inchToCm: function(inch) { return inch * 2.54; },
        kgToLbs: function(kg) { return kg * 2.20462; },
        lbsToKg: function(lbs) { return lbs / 2.20462; },
        celsiusToFahrenheit: function(c) { return (c * 9/5) + 32; },
        fahrenheitToCelsius: function(f) { return (f - 32) * 5/9; },
        mgdlToMmol: function(mgdl) { return parseFloat((mgdl / 38.67).toFixed(2)); },
        mmolToMgdl: function(mmol) { return Math.round(mmol * 38.67); }
    };

    // ==============================================
    // BMI CATEGORY (Global Utility)
    // ==============================================
    function getBMICategory(bmi, ethnicity) {
        ethnicity = ethnicity || 'general';
        var isAsian = (ethnicity === 'asian' || ethnicity === 'south_asian' || ethnicity === 'indian');
        
        if (bmi < 18.5) {
            return { category: 'Underweight', class: 'underweight', color: '#3b82f6', risk: 'Nutritional deficiency risk' };
        }
        if (bmi < (isAsian ? 23 : 25)) {
            return { category: 'Normal', class: 'normal', color: '#10b981', risk: 'Low risk' };
        }
        if (bmi < (isAsian ? 25 : 30)) {
            return { 
                category: isAsian ? 'Overweight (Asian)' : 'Overweight', 
                class: 'overweight', 
                color: '#f59e0b', 
                risk: isAsian ? 'Increased diabetes & heart risk' : 'Moderate risk'
            };
        }
        return { 
            category: isAsian && bmi < 30 ? 'Obese (Asian)' : 'Obese', 
            class: 'obese', 
            color: '#ef4444', 
            risk: 'High cardiovascular risk'
        };
    }

    // ==============================================
    // UI UTILITIES
    // ==============================================
    function showToast(message, duration) {
        duration = duration || 3000;
        
        // Remove existing toast if any
        var existingToast = document.getElementById('healthcalc-toast');
        if (existingToast) {
            existingToast.remove();
        }

        var toast = document.createElement('div');
        toast.id = 'healthcalc-toast';
        toast.textContent = message;
        // Premium Toast Styling
        toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--text);color:var(--card-bg);padding:12px 24px;border-radius:50px;font-size:14px;font-weight:600;z-index:999999;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);opacity:0;bottom:50px;';
        
        document.body.appendChild(toast);
        
        // Animate In
        setTimeout(function() { 
            toast.style.opacity = '1'; 
            toast.style.bottom = '90px';
        }, 10);

        // Animate Out
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.bottom = '50px';
            setTimeout(function() { if(toast.parentNode) document.body.removeChild(toast); }, 400);
        }, duration);
    }

    function shareResults(title, text) {
        var url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: title || document.title,
                text: text || 'Check out my health metrics on HealthCalc.in',
                url: url
            }).catch(function() {});
        } else {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url);
                showToast('Link copied to clipboard!');
            }
        }
    }

    // ==============================================
    // 🤖 PREMIUM AI ADVICE ENGINE (Groq / Llama 3)
    // ==============================================
    async function getAIAdvice(toolName, userInputs) {
        var prompt = "You are a highly advanced Medical & Health AI Assistant for HealthCalc.in. The user just calculated their metrics using the '" + toolName + "' tool. Their data is: " + JSON.stringify(userInputs) + ". Provide 3 clear, actionable bullet points of health advice based on these specific numbers. Keep it under 100 words. Always end with: '⚠️ Consult a doctor for personal medical advice.'";

        try {
            var response = await fetch(WORKER_PROXY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: prompt }
                    ] 
                })
            });

            var data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                throw new Error("Invalid structure");
            }
        } catch (error) {
            console.error("AI Fetch Error:", error);
            return "🏥 Focus on a balanced diet, regular exercise, and adequate sleep. <br><br>⚠️ Consult a doctor for personal medical advice.";
        }
    }

    // ==============================================
    // INITIALIZATION (DOM READY)
    // ==============================================
    function initialize() {
        initTheme();
        
        // Listen to Theme Toggle Button (Defined in Index/Tool pages)
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', function() {
                var current = getTheme();
                var next = current === 'light' ? 'dark' : 'light';
                setTheme(next);
                showToast(next === 'dark' ? "Dark Mode Enabled" : "Light Mode Enabled");
            });
        }
        
        // Listen to Country Selectors
        var countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.value = getCountry();
            countrySelect.addEventListener('change', function(e) {
                setCountry(e.target.value);
                let regionText = e.target.options[e.target.selectedIndex].text;
                showToast(`Region updated to: ${regionText.split(' ')[1]}`);
            });
        }
        
        console.log('✅ HealthCalc Global JS v3.0 (Premium) Loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // ==============================================
    // EXPOSE GLOBALLY
    // ==============================================
    window.HealthCalc = {
        initTheme: initTheme,
        setTheme: setTheme,
        getTheme: getTheme,
        getCountry: getCountry,
        setCountry: setCountry,
        getSavedUnit: getSavedUnit,
        setSavedUnit: setSavedUnit,
        UNIT_CONVERSION: UNIT_CONVERSION,
        getBMICategory: getBMICategory,
        shareResults: shareResults,
        showToast: showToast,
        getAIAdvice: getAIAdvice
    };

})();
