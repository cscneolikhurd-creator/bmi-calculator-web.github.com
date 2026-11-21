/* ============================================================
   HealthCalc Global — Region, Units & Disclaimer Engine
   Auto-detects user locale → sets units (metric/imperial)
   and clinical guideline (US/UK/EU/AU/CA/IN)
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'hc_user_prefs_v1';

  // Country → default guideline + units
  const COUNTRY_DEFAULTS = {
    US: { units: 'imperial', guideline: 'US' },
    GB: { units: 'metric',   guideline: 'UK' },
    UK: { units: 'metric',   guideline: 'UK' },
    IE: { units: 'metric',   guideline: 'UK' },
    CA: { units: 'metric',   guideline: 'CA' },
    AU: { units: 'metric',   guideline: 'AU' },
    NZ: { units: 'metric',   guideline: 'AU' },
    IN: { units: 'metric',   guideline: 'IN' },
    ZA: { units: 'metric',   guideline: 'UK' },
    SG: { units: 'metric',   guideline: 'UK' },
    AE: { units: 'metric',   guideline: 'EU' },
    SA: { units: 'metric',   guideline: 'EU' },
    // EU / most of world → metric + EU
  };

  const DEFAULT_PREFS = { units: 'metric', guideline: 'US' };

  function detectCountry() {
    try {
      const lang = navigator.language || navigator.userLanguage || 'en-US';
      const parts = lang.split('-');
      return (parts[1] || 'US').toUpperCase();
    } catch (e) { return 'US'; }
  }

  function loadPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (raw.units && raw.guideline) return raw;
    } catch (e) {}
    const country = detectCountry();
    const def = COUNTRY_DEFAULTS[country] || DEFAULT_PREFS;
    return { units: def.units, guideline: def.guideline, country, explicit: false };
  }

  function savePrefs(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
  }

  const prefs = loadPrefs();

  // ------- Public API -------
  window.HealthCalc = {
    prefs,
    getUnits:    () => prefs.units,
    getRegion:   () => prefs.guideline,
    getCountry:  () => prefs.country,
    isImperial:  () => prefs.units === 'imperial',

    setUnits: (u) => { prefs.units = u; prefs.explicit = true; savePrefs(prefs); renderWidget(); emit(); },
    setRegion: (r) => { prefs.guideline = r; prefs.explicit = true; savePrefs(prefs); renderWidget(); emit(); },

    // Conversion helpers (use in any tool)
    kgToLb: (kg) => kg * 2.20462262,
    lbToKg: (lb) => lb / 2.20462262,
    cmToIn: (cm) => cm / 2.54,
    inToCm: (i)  => i * 2.54,
    cmToFtIn: (cm) => {
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inch = Math.round(totalIn % 12);
      return { ft, inch };
    },
    ftInToCm: (ft, inch) => (ft * 12 + inch) * 2.54,

    // Display helpers
    displayWeight: (kg) => prefs.units === 'imperial'
      ? `${(kg * 2.20462262).toFixed(1)} lb`
      : `${kg.toFixed(1)} kg`,
    displayHeight: (cm) => {
      if (prefs.units === 'imperial') {
        const { ft, inch } = window.HealthCalc.cmToFtIn(cm);
        return `${ft}′ ${inch}″`;
      }
      return `${cm.toFixed(1)} cm`;
    },
    weightLabel: () => prefs.units === 'imperial' ? 'lb' : 'kg',
    heightLabel: () => prefs.units === 'imperial' ? 'ft / in' : 'cm',
  };

  function emit() {
    window.dispatchEvent(new CustomEvent('healthcalc:prefsChanged', { detail: prefs }));
  }

  // ------- Widget (top-right toggle) -------
  function renderWidget() {
    const old = document.getElementById('hc-prefs-widget');
    if (old) old.remove();

    const w = document.createElement('div');
    w.id = 'hc-prefs-widget';
    w.innerHTML = `
      <div class="hc-prefs-inner">
        <div class="hc-prefs-row">
          <span class="hc-prefs-label">Units</span>
          <div class="hc-seg">
            <button data-hc-units="metric" class="${prefs.units === 'metric' ? 'active' : ''}">Metric</button>
            <button data-hc-units="imperial" class="${prefs.units === 'imperial' ? 'active' : ''}">Imperial</button>
          </div>
        </div>
        <div class="hc-prefs-row">
          <span class="hc-prefs-label">Guidelines</span>
          <select id="hc-region-select" aria-label="Clinical guidelines region">
            <option value="US">US — ACC/AHA</option>
            <option value="UK">UK — NICE</option>
            <option value="EU">Europe — ESC</option>
            <option value="AU">Australia — CSANZ</option>
            <option value="CA">Canada — CCS</option>
            <option value="IN">India — CSI</option>
          </select>
        </div>
      </div>`;
    document.body.appendChild(w);
    w.querySelector('#hc-region-select').value = prefs.guideline;

    w.querySelectorAll('[data-hc-units]').forEach(btn => {
      btn.addEventListener('click', () => window.HealthCalc.setUnits(btn.dataset.hcUnits));
    });
    w.querySelector('#hc-region-select').addEventListener('change', e => {
      window.HealthCalc.setRegion(e.target.value);
    });
  }

  // ------- Region-specific disclaimer (auto-injected in footer) -------
  const DISCLAIMERS = {
    US: 'This calculator is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. It has not been evaluated by the U.S. Food and Drug Administration (FDA). Always consult a licensed healthcare provider before making medical decisions.',
    UK: 'This calculator is for educational and informational purposes only. It does not constitute medical advice and is not a substitute for professional medical guidance. Always consult your GP or a qualified healthcare professional. This tool is not a CE/UKCA-marked medical device.',
    EU: 'This tool is provided for educational purposes only. It is not a medical device under EU MDR 2017/745 and does not constitute medical advice. Consult a qualified healthcare professional in your country for personalised guidance.',
    AU: 'This calculator provides general information only and is not medical advice. It is not intended to replace consultation with a qualified healthcare professional. If you have concerns about your health, speak to your doctor or call healthdirect (1800 022 222).',
    CA: 'This calculator is for general information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider. If you think you may have a medical emergency, call 911 (or 988 for mental health support).',
    IN: 'This calculator is for educational purposes only and does not replace professional medical advice. Always consult a registered medical practitioner for diagnosis and treatment. In case of emergency, contact your nearest hospital or call 112.',
  };

  function injectDisclaimer() {
    // Don't inject if a page already has one
    if (document.getElementById('hc-global-disclaimer')) return;
    const footer = document.querySelector('footer') || document.body;
    const div = document.createElement('div');
    div.id = 'hc-global-disclaimer';
    div.className = 'hc-global-disclaimer';
    div.setAttribute('role', 'note');
    div.innerHTML = `<strong>Medical Disclaimer:</strong> ${DISCLAIMERS[prefs.guideline] || DISCLAIMERS.US}`;
    footer.appendChild(div);
  }

  // ------- Boot -------
  function boot() {
    renderWidget();
    injectDisclaimer();
    emit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
