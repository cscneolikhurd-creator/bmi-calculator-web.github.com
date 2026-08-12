// ===============================================
//  HEALTHCALC.IN - GLOBAL.JS (Universal Premium)
//  Version: 4.0 (Enhanced)
//  Features: Theme, Country, Units, Toast, AI Chat, Analytics
//  Last Updated: 2026-08-12
//  Compatible with: All 30+ Health Calculator Tools
// ===============================================

(function() {
    'use strict';

    // ==============================================
    // CONFIGURATION
    // ==============================================
    const CONFIG = {
        version: '4.0',
        storagePrefix: 'hc_',
        defaultCountry: 'us',
        defaultTheme: 'light',
        defaultUnit: 'metric',
        toastDuration: 3000,
        apiEndpoint: 'https://bmi-calculator-web-github-com.vercel.app/api/chat',
        supportedLanguages: ['en', 'hi', 'es', 'fr', 'de', 'ja', 'ar'],
        countryUnits: {
            'us': 'imperial',
            'mm': 'imperial',
            'lr': 'imperial',
            'uk': 'metric',
            'ca': 'metric',
            'au': 'metric',
            'in': 'metric'
        }
    };

    // ==============================================
    // STORAGE HELPERS
    // ==============================================
    function getStorage(key, defaultValue) {
        try {
            const value = localStorage.getItem(CONFIG.storagePrefix + key);
            return value !== null ? value : defaultValue;
        } catch(e) {
            return defaultValue;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(CONFIG.storagePrefix + key, value);
            return true;
        } catch(e) {
            console.warn('Storage full or unavailable:', e);
            return false;
        }
    }

    function removeStorage(key) {
        try {
            localStorage.removeItem(CONFIG.storagePrefix + key);
            return true;
        } catch(e) {
            return false;
        }
    }

    // ==============================================
    // THEME MANAGEMENT (Dark/Light Mode)
    // ==============================================
    function initTheme() {
        const saved = getStorage('theme', CONFIG.defaultTheme);
        applyTheme(saved);
        updateAllThemeIcons(saved);
    }

    function setTheme(theme) {
        setStorage('theme', theme);
        applyTheme(theme);
        updateAllThemeIcons(theme);
    }

    function getTheme() {
        return getStorage('theme', CONFIG.defaultTheme);
    }

    function toggleTheme() {
        const current = getTheme();
        const next = current === 'light' ? 'dark' : 'light';
        setTheme(next);
        showToast(next === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled');
        return next;
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark', theme === 'dark');
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#0f172a' : '#ffffff';
        }
    }

    function updateAllThemeIcons(theme) {
        const themeBtns = document.querySelectorAll('#themeToggleBtn, .theme-toggle-btn, [data-theme-toggle]');
        themeBtns.forEach(btn => {
            btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }

    // ==============================================
    // COUNTRY & REGION MANAGEMENT
    // ==============================================
    function getCountry() {
        return getStorage('country', CONFIG.defaultCountry);
    }

    function setCountry(country) {
        setStorage('country', country);
        
        // Update all country selectors
        const selects = document.querySelectorAll('#countrySelect, [data-country-select]');
        selects.forEach(sel => {
            if (sel.tagName === 'SELECT') sel.value = country;
        });
        
        // Auto-set units based on country
        const unit = CONFIG.countryUnits[country] || CONFIG.defaultUnit;
        setSavedUnit(unit);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('countryChanged', { 
            detail: { country, unit } 
        }));
    }

    function getCountryName(countryCode) {
        const names = {
            'us': 'United States', 'uk': 'United Kingdom', 'ca': 'Canada',
            'au': 'Australia', 'in': 'India', 'de': 'Germany', 'fr': 'France',
            'es': 'Spain', 'jp': 'Japan', 'br': 'Brazil', 'mx': 'Mexico',
            'it': 'Italy', 'nl': 'Netherlands', 'se': 'Sweden', 'no': 'Norway',
            'dk': 'Denmark', 'fi': 'Finland', 'pt': 'Portugal', 'pl': 'Poland',
            'ie': 'Ireland', 'nz': 'New Zealand', 'sg': 'Singapore', 'my': 'Malaysia',
            'ph': 'Philippines', 'id': 'Indonesia', 'th': 'Thailand', 'vn': 'Vietnam',
            'kr': 'South Korea', 'cn': 'China', 'za': 'South Africa', 'ae': 'UAE',
            'sa': 'Saudi Arabia', 'eg': 'Egypt', 'ng': 'Nigeria', 'ke': 'Kenya'
        };
        return names[countryCode] || countryCode.toUpperCase();
    }

    // ==============================================
    // UNIT MANAGEMENT (Metric/Imperial)
    // ==============================================
    function detectUserUnit() {
        const saved = getStorage('units', null);
        if (saved) return saved;
        
        try {
            const language = navigator.language || 'en-US';
            if (language === 'en-US') return 'imperial';
        } catch(e) {}
        
        return CONFIG.defaultUnit;
    }

    function getSavedUnit() {
        return getStorage('units', null) || detectUserUnit();
    }

    function setSavedUnit(unit) {
        setStorage('units', unit);
        
        // Update unit toggle buttons
        document.querySelectorAll('.unit-btn, .unit-opt').forEach(btn => {
            const btnUnit = btn.getAttribute('data-unit') || 
                           btn.getAttribute('data-unitwhr') || 
                           btn.textContent.toLowerCase().includes('metric') ? 'metric' : 'imperial';
            btn.classList.toggle('active', btnUnit === unit);
        });
        
        document.dispatchEvent(new CustomEvent('unitChanged', { 
            detail: { unit } 
        }));
    }

    function toggleUnit() {
        const current = getSavedUnit();
        const next = current === 'metric' ? 'imperial' : 'metric';
        setSavedUnit(next);
        showToast(`Switched to ${next === 'metric' ? 'Metric (cm/kg)' : 'Imperial (in/lbs)'}`);
        return next;
    }

    // ==============================================
    // UNIT CONVERSION HELPERS
    // ==============================================
    const UnitConverter = {
        cmToInches: (cm) => cm / 2.54,
        inchesToCm: (inches) => inches * 2.54,
        kgToLbs: (kg) => kg * 2.20462,
        lbsToKg: (lbs) => lbs / 2.20462,
        cmToFeetInches: (cm) => {
            const totalInches = cm / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            return { feet, inches };
        },
        feetInchesToCm: (feet, inches) => ((feet * 12) + inches) * 2.54
    };

    // ==============================================
    // UI UTILITIES & TOAST NOTIFICATIONS
    // ==============================================
    function showToast(message, duration, type) {
        duration = duration || CONFIG.toastDuration;
        type = type || 'info';
        
        // Remove existing toast
        const existing = document.getElementById('healthcalc-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'healthcalc-toast';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        const bgColors = {
            'info': 'var(--text)',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        };
        
        const icons = {
            'info': '💬',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        
        toast.innerHTML = `${icons[type] || ''} ${message}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColors[type] || 'var(--text)'};
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            z-index: 999999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            white-space: nowrap;
            max-width: 90vw;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.bottom = '90px';
        });
        
        // Animate out
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.bottom = '50px';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 400);
        }, duration);
    }

    // ==============================================
    // SCROLL TO TOP BUTTON
    // ==============================================
    function initScrollTop() {
        const btn = document.getElementById('scrollTop') || document.querySelector('.scroll-top');
        if (!btn) return;
        
        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 500);
        });
        
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==============================================
    // AI CHAT HELPER (if AI chat exists on page)
    // ==============================================
    function initAIChat() {
        const chatInput = document.getElementById('aiChatInput');
        const sendBtn = document.querySelector('.ai-chat-send-btn, #aiChatSendBtn');
        
        if (!chatInput) return;
        
        // Enter key to send
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && typeof window.sendAIMessage === 'function') {
                window.sendAIMessage();
            }
        });
        
        // Send button click
        if (sendBtn && typeof window.sendAIMessage === 'function') {
            sendBtn.addEventListener('click', () => window.sendAIMessage());
        }
    }

    // ==============================================
    // TOOL SEARCH (for index pages)
    // ==============================================
    function initToolSearch() {
        const searchInput = document.getElementById('toolSearch');
        if (!searchInput) return;
        
        searchInput.addEventListener('keyup', function() {
            const query = this.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.tool-card, [data-keywords]');
            
            cards.forEach(card => {
                const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
                const title = (card.querySelector('.tool-title')?.textContent || '').toLowerCase();
                const desc = (card.querySelector('.tool-desc')?.textContent || '').toLowerCase();
                
                const match = keywords.includes(query) || 
                              title.includes(query) || 
                              desc.includes(query);
                
                card.style.display = match ? 'flex' : 'none';
            });
        });
    }

    // ==============================================
    // CATEGORY FILTER (for index pages)
    // ==============================================
    function initCategoryFilter() {
        const tabs = document.querySelectorAll('.cat-tab, [data-category-filter]');
        if (!tabs.length) return;
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.getAttribute('data-category') || 
                                this.textContent.toLowerCase().replace(/\s+/g, '-');
                const cards = document.querySelectorAll('.tool-card, [data-category]');
                
                cards.forEach(card => {
                    if (category === 'all' || category === 'all-tools') {
                        card.style.display = 'flex';
                    } else {
                        const cardCat = card.getAttribute('data-category');
                        card.style.display = cardCat === category ? 'flex' : 'none';
                    }
                });
            });
        });
    }

    // ==============================================
    // ANALYTICS (Privacy-Friendly)
    // ==============================================
    function trackPageView() {
        try {
            const page = window.location.pathname;
            const referrer = document.referrer || 'direct';
            
            // Only track page name, no personal data
            const data = {
                page: page.split('/').pop() || 'index',
                theme: getTheme(),
                country: getCountry(),
                unit: getSavedUnit(),
                timestamp: new Date().toISOString().split('T')[0]
            };
            
            // Store locally for insights (optional)
            const views = JSON.parse(getStorage('pageViews', '[]'));
            views.push(data);
            if (views.length > 100) views.shift();
            setStorage('pageViews', JSON.stringify(views));
            
        } catch(e) {
            // Silently fail
        }
    }

    // ==============================================
    // PERFORMANCE OPTIMIZATION
    // ==============================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ==============================================
    // INITIALIZATION
    // ==============================================
    function initialize() {
        // Theme
        initTheme();
        
        // Theme toggle button
        const themeBtn = document.getElementById('themeToggleBtn') || 
                        document.querySelector('.theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', toggleTheme);
        }
        
        // Country selector
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.value = getCountry();
            countrySelect.addEventListener('change', function(e) {
                setCountry(e.target.value);
                const name = getCountryName(e.target.value);
                showToast(`🌍 Region: ${name}`, 2000, 'success');
            });
        }
        
        // Unit toggle buttons
        document.querySelectorAll('.unit-btn, .unit-opt').forEach(btn => {
            btn.addEventListener('click', function() {
                const unit = this.getAttribute('data-unit') || 
                            this.getAttribute('data-unitwhr') ||
                            (this.textContent.toLowerCase().includes('metric') ? 'metric' : 'imperial');
                setSavedUnit(unit);
            });
        });
        
        // Initialize components
        initScrollTop();
        initAIChat();
        initToolSearch();
        initCategoryFilter();
        
        // Track page view
        trackPageView();
        
        // Log
        console.log(`✅ HealthCalc Global JS v${CONFIG.version} Loaded | Theme: ${getTheme()} | Country: ${getCountry()} | Unit: ${getSavedUnit()}`);
    }

    // ==============================================
    // STARTUP
    // ==============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // ==============================================
    // PUBLIC API
    // ==============================================
    window.HealthCalc = {
        // Version
        version: CONFIG.version,
        
        // Theme
        initTheme,
        setTheme,
        getTheme,
        toggleTheme,
        
        // Country
        getCountry,
        setCountry,
        getCountryName,
        
        // Units
        getSavedUnit,
        setSavedUnit,
        toggleUnit,
        detectUserUnit,
        
        // Conversion
        UnitConverter,
        
        // UI
        showToast,
        initScrollTop,
        initToolSearch,
        initCategoryFilter,
        
        // Storage
        getStorage,
        setStorage,
        removeStorage,
        
        // Utilities
        debounce,
        throttle,
        
        // Config
        CONFIG
    };

})();
