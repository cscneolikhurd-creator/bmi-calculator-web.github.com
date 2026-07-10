// ===============================================
//  HEALTHCALC.IN - GLOBAL.JS (Universal)
//  Version: 2.0
//  Features: Theme, Country, Language, Units, AI Chat
//  API Key: rsk_01KX30NR2A1988J2N3GWG1KF5F
//  Last Updated: 2026-07-10
//  Total Tools: 35+ Health Calculators
//  International: USA, UK, Canada, Australia
// ===============================================

(function() {
    'use strict';

    // ==============================================
    // 🔥 AI CHAT API CONFIGURATION
    // ==============================================
    var AI_API_KEY = 'rsk_01KX30NR2A1988J2N3GWG1KF5F';
    var AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + AI_API_KEY;

    // ==============================================
    // THEME MANAGEMENT
    // ==============================================
    function initTheme() {
        var saved = localStorage.getItem('healthcalc_theme') || 'light';
        document.body.classList.toggle('dark', saved === 'dark');
    }

    function setTheme(theme) {
        localStorage.setItem('healthcalc_theme', theme);
        document.body.classList.toggle('dark', theme === 'dark');
    }

    function getTheme() {
        return localStorage.getItem('healthcalc_theme') || 'light';
    }

    // ==============================================
    // COUNTRY MANAGEMENT
    // ==============================================
    function getCountry() {
        return localStorage.getItem('healthcalc_country') || 'us';
    }

    function setCountry(country) {
        localStorage.setItem('healthcalc_country', country);
        // Update any country selectors on the page
        var selects = document.querySelectorAll('#countrySelect, [data-country-select]');
        selects.forEach(function(sel) {
            if (sel.tagName === 'SELECT') sel.value = country;
        });
    }

    // Country health authority data
    var countryAuthorities = {
        us: { name: 'CDC', fullName: 'Centers for Disease Control', flag: '🇺🇸' },
        uk: { name: 'NHS', fullName: 'National Health Service', flag: '🇬🇧' },
        ca: { name: 'Health Canada', fullName: 'Health Canada', flag: '🇨🇦' },
        au: { name: 'Australian DoH', fullName: 'Australian Department of Health', flag: '🇦🇺' }
    };

    function getCountryAuthority() {
        var country = getCountry();
        return countryAuthorities[country] || countryAuthorities['us'];
    }

    // ==============================================
    // UNIT MANAGEMENT
    // ==============================================
    function detectUserUnit() {
        var saved = localStorage.getItem('healthcalc_units');
        if (saved) return saved;
        
        try {
            var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            var language = navigator.language || 'en-US';
            
            // US, Liberia, Myanmar use imperial
            if (timezone.startsWith('America/') || language === 'en-US') {
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
    }

    // ==============================================
    // LANGUAGE MANAGEMENT
    // ==============================================
    function getLanguage() {
        return localStorage.getItem('healthcalc_lang') || 'en';
    }

    function setLanguage(lang) {
        localStorage.setItem('healthcalc_lang', lang);
        // Trigger custom event for page-specific handlers
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }

    // ==============================================
    // UNIT CONVERSION HELPERS
    // ==============================================
    var UNIT_CONVERSION = {
        // Length
        cmToInch: function(cm) { return cm / 2.54; },
        inchToCm: function(inch) { return inch * 2.54; },
        metersToFeet: function(m) { return m * 3.28084; },
        feetToMeters: function(ft) { return ft / 3.28084; },
        
        // Weight
        kgToLbs: function(kg) { return kg * 2.20462; },
        lbsToKg: function(lbs) { return lbs / 2.20462; },
        
        // Volume
        litersToOz: function(l) { return l * 33.814; },
        ozToLiters: function(oz) { return oz / 33.814; },
        litersToCups: function(l) { return l * 4.227; },
        
        // Temperature
        celsiusToFahrenheit: function(c) { return (c * 9/5) + 32; },
        fahrenheitToCelsius: function(f) { return (f - 32) * 5/9; },
        
        // Cholesterol
        mgdlToMmol: function(mgdl) { return parseFloat((mgdl / 38.67).toFixed(2)); },
        mmolToMgdl: function(mmol) { return Math.round(mmol * 38.67); },
        
        // Blood Alcohol
        bacPercentToPermille: function(pct) { return pct * 10; }
    };

    // ==============================================
    // LOCAL STORAGE HELPERS
    // ==============================================
    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch(e) {
            console.warn('LocalStorage full or unavailable:', e.message);
            return false;
        }
    }

    function loadFromStorage(key) {
        try {
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch(e) {
            return null;
        }
    }

    function removeFromStorage(key) {
        localStorage.removeItem(key);
    }

    // ==============================================
    // BMI CATEGORY (Global Utility)
    // ==============================================
    function getBMICategory(bmi, ethnicity) {
        ethnicity = ethnicity || 'general';
        var isAsian = (ethnicity === 'asian' || ethnicity === 'south_asian' || ethnicity === 'indian');
        
        if (bmi < 18.5) {
            return { category: 'Underweight', class: 'underweight', color: '#3b82f6', risk: 'Nutritional deficiency risk', riskLevel: 'moderate' };
        }
        if (bmi < (isAsian ? 23 : 25)) {
            return { category: 'Normal', class: 'normal', color: '#10b981', risk: 'Low risk', riskLevel: 'low' };
        }
        if (bmi < (isAsian ? 25 : 30)) {
            return { 
                category: isAsian ? 'Overweight (Asian)' : 'Overweight', 
                class: 'overweight', 
                color: '#f59e0b', 
                risk: isAsian ? 'Increased diabetes & heart risk' : 'Moderate risk',
                riskLevel: 'high'
            };
        }
        return { 
            category: isAsian && bmi < 30 ? 'Obese (Asian)' : 'Obese', 
            class: 'obese', 
            color: '#ef4444', 
            risk: 'High cardiovascular risk',
            riskLevel: 'critical'
        };
    }

    // ==============================================
    // FORMATTING HELPERS
    // ==============================================
    function formatNumber(num, decimals) {
        decimals = decimals !== undefined ? decimals : 1;
        return Number(num).toFixed(decimals);
    }

    function formatDate(date, format) {
        date = new Date(date);
        var options = {};
        
        if (format === 'short') {
            options = { year: 'numeric', month: 'short', day: 'numeric' };
        } else if (format === 'long') {
            options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        } else {
            options = { year: 'numeric', month: 'long', day: 'numeric' };
        }
        
        return date.toLocaleDateString('en-US', options);
    }

    function formatTime(minutes) {
        if (minutes < 60) return minutes + ' min';
        var hrs = Math.floor(minutes / 60);
        var mins = minutes % 60;
        return hrs + 'h' + (mins > 0 ? ' ' + mins + 'm' : '');
    }

    // ==============================================
    // SCROLL TO TOP
    // ==============================================
    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function initScrollToTop() {
        var scrollBtn = document.getElementById('scrollTop') || document.getElementById('scrollTopBtn');
        if (scrollBtn) {
            window.addEventListener('scroll', function() {
                var isVisible = window.scrollY > 500;
                if (scrollBtn.classList) {
                    scrollBtn.classList.toggle('visible', isVisible);
                } else {
                    scrollBtn.style.display = isVisible ? 'flex' : 'none';
                }
            });
            
            scrollBtn.addEventListener('click', scrollToTop);
        }
    }

    // ==============================================
    // SHARE FUNCTIONALITY
    // ==============================================
    function shareResults(title, text) {
        var url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: title || document.title,
                text: text || '',
                url: url
            }).catch(function() {});
        } else {
            // Fallback: copy to clipboard
            copyToClipboard(url);
            showToast('Link copied to clipboard!');
        }
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    // ==============================================
    // TOAST NOTIFICATION
    // ==============================================
    function showToast(message, duration) {
        duration = duration || 3000;
        
        var toast = document.createElement('div');
        toast.className = 'healthcalc-toast';
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:12px 24px;border-radius:50px;font-size:14px;font-weight:600;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.3);transition:all 0.3s;opacity:0;';
        
        document.body.appendChild(toast);
        
        setTimeout(function() { toast.style.opacity = '1'; }, 100);
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { document.body.removeChild(toast); }, 300);
        }, duration);
    }

    // ==============================================
    // DEBOUNCE UTILITY
    // ==============================================
    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    // ==============================================
    // INITIALIZATION (DOM READY)
    // ==============================================
    function initialize() {
        // Theme
        initTheme();
        
        // Theme toggle buttons
        document.querySelectorAll('.theme-option').forEach(function(btn) {
            btn.addEventListener('click', function() {
                setTheme(btn.dataset.theme);
            });
        });
        
        // Country selector
        var countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            var savedCountry = getCountry();
            countrySelect.value = savedCountry;
            countrySelect.addEventListener('change', function(e) {
                setCountry(e.target.value);
                // Trigger custom event for page-specific handlers
                document.dispatchEvent(new CustomEvent('countryChanged', { detail: { country: e.target.value } }));
            });
        }
        
        // Language buttons
        document.querySelectorAll('.lang-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var lang = btn.dataset.lang;
                setLanguage(lang);
            });
        });
        
        // Scroll to top
        initScrollToTop();
        
        // Log initialization
        console.log('✅ HealthCalc Global JS v2.0 Loaded');
        console.log('🌐 Country:', getCountry(), '(' + (getCountryAuthority().name) + ')');
        console.log('📏 Units:', getSavedUnit());
        console.log('🌙 Theme:', getTheme());
        console.log('🗣️ Language:', getLanguage());
        console.log('💬 AI Chat API: Active (rsk_01KX30...)');
        console.log('📊 35+ Health Calculators Ready');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // ==============================================
    // EXPOSE GLOBALLY
    // ==============================================
    window.HealthCalc = {
        // Theme
        initTheme: initTheme,
        setTheme: setTheme,
        getTheme: getTheme,
        
        // Country
        getCountry: getCountry,
        setCountry: setCountry,
        getCountryAuthority: getCountryAuthority,
        countryAuthorities: countryAuthorities,
        
        // Units
        detectUserUnit: detectUserUnit,
        getSavedUnit: getSavedUnit,
        setSavedUnit: setSavedUnit,
        UNIT_CONVERSION: UNIT_CONVERSION,
        
        // Language
        getLanguage: getLanguage,
        setLanguage: setLanguage,
        
        // Storage
        saveToStorage: saveToStorage,
        loadFromStorage: loadFromStorage,
        removeFromStorage: removeFromStorage,
        
        // BMI
        getBMICategory: getBMICategory,
        
        // Formatting
        formatNumber: formatNumber,
        formatDate: formatDate,
        formatTime: formatTime,
        
        // UI
        scrollToTop: scrollToTop,
        shareResults: shareResults,
        copyToClipboard: copyToClipboard,
        showToast: showToast,
        
        // Utility
        debounce: debounce,
        
        // AI Chat
        AI_API_KEY: AI_API_KEY,
        AI_API_URL: AI_API_URL
    };

})();
