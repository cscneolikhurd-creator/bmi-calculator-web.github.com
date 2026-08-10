// ===============================================
//  HEALTHCALC.IN - GLOBAL.JS (Universal)
//  Version: 3.0 (Premium UI)
//  Features: LocalStorage Preferences, Unit Conversions, Theme
//  Last Updated: 2026-08-10
// ===============================================

(function() {
    'use strict';

    // ==============================================
    // THEME MANAGEMENT (Dark/Light Mode)
    // ==============================================
    function initTheme() {
        var saved = localStorage.getItem('hc_theme') || 'light';
        document.body.classList.toggle('dark', saved === 'dark');
        updateThemeIcon(saved);
    }

    function setTheme(theme) {
        localStorage.setItem('hc_theme', theme);
        document.body.classList.toggle('dark', theme === 'dark');
        updateThemeIcon(theme);
    }

    function getTheme() {
        return localStorage.getItem('hc_theme') || 'light';
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
        return localStorage.getItem('hc_country') || 'us';
    }

    function setCountry(country) {
        localStorage.setItem('hc_country', country);
        var selects = document.querySelectorAll('#countrySelect, [data-country-select]');
        selects.forEach(function(sel) {
            if (sel.tagName === 'SELECT') sel.value = country;
        });
        
        // Auto-set units based on country
        if (['us', 'mm'].includes(country)) { 
            setSavedUnit('imperial');
        } else {
            setSavedUnit('metric');
        }
    }

    function detectUserUnit() {
        var saved = localStorage.getItem('hc_units');
        if (saved) return saved;
        try {
            var language = navigator.language || 'en-US';
            if (language === 'en-US') return 'imperial';
        } catch(e) {}
        return 'metric';
    }

    function getSavedUnit() {
        return localStorage.getItem('hc_units') || detectUserUnit();
    }

    function setSavedUnit(unit) {
        localStorage.setItem('hc_units', unit);
        document.dispatchEvent(new CustomEvent('unitChanged', { detail: { unit: unit } }));
    }

    // ==============================================
    // UI UTILITIES & TOAST ALERTS
    // ==============================================
    function showToast(message, duration) {
        duration = duration || 3000;
        var existingToast = document.getElementById('healthcalc-toast');
        if (existingToast) existingToast.remove();

        var toast = document.createElement('div');
        toast.id = 'healthcalc-toast';
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--text);color:var(--card-bg);padding:12px 24px;border-radius:50px;font-size:14px;font-weight:600;z-index:999999;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);opacity:0;bottom:50px;';
        
        document.body.appendChild(toast);
        
        setTimeout(function() { toast.style.opacity = '1'; toast.style.bottom = '90px'; }, 10);
        setTimeout(function() {
            toast.style.opacity = '0'; toast.style.bottom = '50px';
            setTimeout(function() { if(toast.parentNode) document.body.removeChild(toast); }, 400);
        }, duration);
    }

    // ==============================================
    // INITIALIZATION ON LOAD
    // ==============================================
    function initialize() {
        initTheme();
        
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', function() {
                var next = getTheme() === 'light' ? 'dark' : 'light';
                setTheme(next);
                showToast(next === 'dark' ? "Dark Mode Enabled" : "Light Mode Enabled");
            });
        }
        
        var countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.value = getCountry();
            countrySelect.addEventListener('change', function(e) {
                setCountry(e.target.value);
                let regionText = e.target.options[e.target.selectedIndex].text;
                showToast(`Region updated to: ${regionText.split(' ')[1]}`);
            });
        }
        console.log('✅ HealthCalc Global JS (Premium) Loaded successfully!');
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
        showToast: showToast
    };
})();
