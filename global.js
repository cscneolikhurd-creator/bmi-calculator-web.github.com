// global.js – Unit Toggle, Ethnicity, Country, Language

// ---------- Unit Toggle ----------
function setUnit(unit) {
const metricFields = document.querySelectorAll('.metric-fields');
const imperialFields = document.querySelectorAll('.imperial-fields');
if (unit === 'metric') {
metricFields.forEach(el => el.style.display = 'block');
imperialFields.forEach(el => el.style.display = 'none');
} else {
metricFields.forEach(el => el.style.display = 'none');
imperialFields.forEach(el => el.style.display = 'block');
}
document.querySelectorAll('.unit-toggle-btn').forEach(btn => {
btn.classList.toggle('active', btn.dataset.unit === unit);
});
localStorage.setItem('preferredUnit', unit);
if (typeof calculateBMI === 'function') calculateBMI();
if (typeof calculateSleep === 'function') calculateSleep();
}

// ---------- Ethnicity + Indian Warning ----------
function initEthnicity() {
const ethnicitySelect = document.getElementById('ethnicity');
if (!ethnicitySelect) return;
const warningDiv = document.getElementById('indianWarning');
function updateWarning() {
const isAsian = ethnicitySelect.value === 'asian';
if (warningDiv) warningDiv.style.display = isAsian ? 'flex' : 'none';
if (typeof calculateBMI === 'function') calculateBMI();
}
ethnicitySelect.addEventListener('change', updateWarning);
updateWarning();
}

// ---------- Country Selector (Health Authority & Default Unit) ----------
const countryData = {
us: { name: 'USA', authority: 'CDC', unit: 'imperial', link: 'https://www.cdc.gov/healthyweight/assessing/bmi/' },
uk: { name: 'UK', authority: 'NHS', unit: 'metric', link: 'https://www.nhs.uk/live-well/healthy-weight/bmi-calculator/' },
ca: { name: 'Canada', authority: 'Health Canada', unit: 'metric', link: 'https://www.canada.ca/en/health-canada.html' },
au: { name: 'Australia', authority: 'Australian Dept of Health', unit: 'metric', link: 'https://www.health.gov.au/health-topics/overweight-and-obesity' }
};
function setCountry(countryCode) {
const data = countryData[countryCode];
if (!data) return;
localStorage.setItem('healthcalc_country', countryCode);
// set default unit
if (data.unit === 'imperial') setUnit('imperial');
else setUnit('metric');
// update health authority note
const authDiv = document.getElementById('healthAuthorityNote');
if (authDiv) {
authDiv.innerHTML = `📋 Based on <strong>${data.authority}</strong> guidelines. <a href="${data.link}" target="_blank">Learn more</a>`;
}
if (typeof calculateBMI === 'function') calculateBMI();
if (typeof calculateSleep === 'function') calculateSleep();
}
function loadCountry() {
const saved = localStorage.getItem('healthcalc_country') || 'us';
const select = document.getElementById('countrySelect');
if (select) select.value = saved;
setCountry(saved);
}

// ---------- Language Switcher (Demo) ----------
function setLanguage(lang) {
localStorage.setItem('healthcalc_lang', lang);
document.querySelectorAll('.lang-btn').forEach(btn => {
btn.classList.toggle('active', btn.dataset.lang === lang);
});
// You can implement full translation here
alert('Language switched to ' + lang + ' (full translation coming soon)');
}
function initLanguage() {
const saved = localStorage.getItem('healthcalc_lang') || 'en';
setLanguage(saved);
}

// ---------- Dark/Light Theme (if not already present) ----------
function initTheme() {
const savedTheme = localStorage.getItem('healthcalc_theme') || 'light';
if (savedTheme === 'dark') document.body.classList.add('dark');
else document.body.classList.remove('dark');
document.querySelectorAll('.theme-option').forEach(opt => {
opt.classList.toggle('active', opt.dataset.theme === savedTheme);
});
}
function setTheme(theme) {
localStorage.setItem('healthcalc_theme', theme);
if (theme === 'dark') document.body.classList.add('dark');
else document.body.classList.remove('dark');
document.querySelectorAll('.theme-option').forEach(opt => {
opt.classList.toggle('active', opt.dataset.theme === theme);
});
}

// ---------- Auto-run on every page ----------
document.addEventListener('DOMContentLoaded', () => {
initTheme();
initEthnicity();
loadCountry();
initLanguage();
// Attach unit toggle buttons if present
document.querySelectorAll('.unit-toggle-btn').forEach(btn => {
btn.addEventListener('click', () => setUnit(btn.dataset.unit));
});
// Attach country select if present
const countrySelect = document.getElementById('countrySelect');
if (countrySelect) countrySelect.addEventListener('change', (e) => setCountry(e.target.value));
// Attach language buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});
// Attach theme buttons
document.querySelectorAll('.theme-option').forEach(btn => {
btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});
});
