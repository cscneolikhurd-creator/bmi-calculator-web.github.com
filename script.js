// ===============================================
//  HEALTHCALC.IN - GLOBAL + INDIAN BMI CALCULATOR
//  Features: Metric/Imperial Toggle, Indian BMI Cutoffs, Ethnicity Selector
// ===============================================

// DOM Elements
const heightInput = document.getElementById('height');
const heightSlider = document.getElementById('height-slider');
const weightInput = document.getElementById('weight');
const weightSlider = document.getElementById('weight-slider');
const ageInput = document.getElementById('age');
const genderButtons = document.querySelectorAll('.gender-btn');
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const bmiValue = document.getElementById('bmi-value');
const categoryText = document.getElementById('category-text');
const adviceText = document.getElementById('advice-text');
const idealWeight = document.getElementById('ideal-weight');

// ========== GLOBAL UNIT SYSTEM ==========
let currentUnit = 'metric'; // 'metric' or 'imperial'
let userEthnicity = 'asian'; // 'asian', 'caucasian', 'african'

// Unit conversion
const UNIT = {
    metric: { weightLabel: 'kg', heightLabel: 'cm', weightFactor: 1, heightFactor: 1 },
    imperial: { weightLabel: 'lbs', heightLabel: "ft'in\"", weightFactor: 2.20462, heightFactor: 0.393701 }
};

// Detect user location for default unit
function detectUserUnit() {
    const saved = localStorage.getItem('healthcalc_units');
    if (saved) return saved;
    
    // Check timezone/browser language for US/UK default
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    if (timezone.startsWith('America/') || language === 'en-US') {
        return 'imperial';
    }
    return 'metric';
}

// Set units and update UI
function setUnits(unit) {
    currentUnit = unit;
    localStorage.setItem('healthcalc_units', unit);
    
    // Update input placeholders
    const heightPlaceholder = unit === 'metric' ? 'cm' : "e.g. 5'10\"";
    const weightPlaceholder = unit === 'metric' ? 'kg' : 'lbs';
    
    heightInput.placeholder = heightPlaceholder;
    weightInput.placeholder = weightPlaceholder;
    
    // Update slider ranges
    if (unit === 'metric') {
        heightSlider.min = 100; heightSlider.max = 250; heightSlider.value = 170;
        weightSlider.min = 30; weightSlider.max = 200; weightSlider.value = 70;
        heightInput.min = 100; heightInput.max = 250; heightInput.value = 170;
        weightInput.min = 30; weightInput.max = 200; weightInput.value = 70;
    } else {
        heightSlider.min = 39; heightSlider.max = 98; heightSlider.value = 67;
        weightSlider.min = 66; weightSlider.max = 440; weightSlider.value = 154;
        heightInput.min = 39; heightInput.max = 98; heightInput.value = 67;
        weightInput.min = 66; weightInput.max = 440; weightInput.value = 154;
    }
    
    // Update labels
    document.querySelectorAll('.unit-label').forEach(el => el.remove());
    const heightLabel = document.createElement('span');
    heightLabel.className = 'unit-label';
    heightLabel.textContent = UNIT[unit].heightLabel;
    heightInput.parentNode.appendChild(heightLabel);
    
    const weightLabel = document.createElement('span');
    weightLabel.className = 'unit-label';
    weightLabel.textContent = UNIT[unit].weightLabel;
    weightInput.parentNode.appendChild(weightLabel);
    
    // Recalculate if values exist
    if (bmiValue.textContent !== '00.0') handleCalculate();
}

// Convert height to cm for internal calculation
function getHeightInCm() {
    let value = parseFloat(heightInput.value) || 0;
    if (currentUnit === 'imperial') {
        // Handle feet'inches" format
        const ftMatch = heightInput.value.match(/(\d+)'?\s*(\d*)"?/);
        if (ftMatch) {
            value = (parseInt(ftMatch[1]) * 12 + (parseInt(ftMatch[2]) || 0)) * 2.54;
        } else {
            value = value * 2.54; // assume inches
        }
    }
    return value;
}

// Convert weight to kg for internal calculation
function getWeightInKg() {
    let value = parseFloat(weightInput.value) || 0;
    if (currentUnit === 'imperial') {
        value = value / 2.20462;
    }
    return value;
}

// Format height for display
function formatHeightDisplay(cm) {
    if (currentUnit === 'metric') return cm.toFixed(1) + ' cm';
    const inches = cm * 0.393701;
    const feet = Math.floor(inches / 12);
    const inch = Math.round(inches % 12);
    return feet + "'" + inch + '"';
}

// Format weight for display
function formatWeightDisplay(kg) {
    if (currentUnit === 'metric') return kg.toFixed(1) + ' kg';
    return (kg * 2.20462).toFixed(1) + ' lbs';
}

// ========== INDIAN + GLOBAL BMI CATEGORIES ==========
function getBMICategory(bmi, ethnicity = 'asian') {
    // Indian/Asian cutoff: Overweight starts at 23, Obese at 25
    // Standard WHO: Overweight starts at 25, Obese at 30
    
    const isIndianOrAsian = (ethnicity === 'asian' || ethnicity === 'indian');
    
    if (bmi < 18.5) {
        return {
            category: 'Underweight',
            colorClass: 'underweight',
            advice: 'आपका वज़न कम है। पौष्टिक आहार लें और डॉक्टर से सलाह लें। (Consider gaining weight with nutritious food.)',
            color: '#3b82f6',
            healthRisk: 'Nutritional deficiency risk'
        };
    } else if (bmi >= 18.5 && bmi < (isIndianOrAsian ? 23 : 25)) {
        return {
            category: 'Normal',
            colorClass: 'normal',
            advice: 'बहुत अच्छा! संतुलित आहार और नियमित व्यायाम जारी रखें। (Great! Maintain your healthy lifestyle.)',
            color: '#10b981',
            healthRisk: 'Low risk'
        };
    } else if (bmi >= (isIndianOrAsian ? 23 : 25) && bmi < (isIndianOrAsian ? 25 : 30)) {
        return {
            category: isIndianOrAsian ? 'Overweight (Indian Standards)' : 'Overweight',
            colorClass: 'overweight',
            advice: isIndianOrAsian 
                ? 'भारतीय मानकों के अनुसार आपका वज़न अधिक है। डायबिटीज़ और हृदय रोग का खतरा बढ़ जाता है। नियमित व्यायाम शुरू करें।'
                : 'Consider regular exercise and a balanced diet to reach a healthy weight.',
            color: '#f59e0b',
            healthRisk: isIndianOrAsian ? 'Increased diabetes & heart risk' : 'Moderate risk'
        };
    } else {
        return {
            category: isIndianOrAsian && bmi < 30 ? 'Obese (Indian Standards)' : 'Obese',
            colorClass: 'obese',
            advice: isIndianOrAsian
                ? 'भारतीय मानकों के अनुसार यह मोटापे की श्रेणी है। कृपया डॉक्टर से परामर्श लें।'
                : 'Consult with a healthcare provider for a personalized weight management plan.',
            color: '#ef4444',
            healthRisk: 'High cardiovascular risk'
        };
    }
}

// ========== IDEAL WEIGHT (INDIAN ADJUSTED) ==========
function calculateIdealWeight(heightCm, ethnicity = 'asian') {
    const heightM = heightCm / 100;
    let minBMI, maxBMI;
    
    if (ethnicity === 'asian' || ethnicity === 'indian') {
        minBMI = 18.5;
        maxBMI = 22.9; // Indian ideal upper limit
    } else {
        minBMI = 18.5;
        maxBMI = 24.9; // WHO standard
    }
    
    const minWeight = minBMI * (heightM * heightM);
    const maxWeight = maxBMI * (heightM * heightM);
    
    return {
        min: Math.round(minWeight),
        max: Math.round(maxWeight),
        minBMI: minBMI,
        maxBMI: maxBMI
    };
}

// ========== SYNC SLIDERS ==========
heightSlider.addEventListener('input', () => {
    heightInput.value = heightSlider.value;
});

heightInput.addEventListener('input', () => {
    heightSlider.value = heightInput.value;
});

weightSlider.addEventListener('input', () => {
    weightInput.value = weightSlider.value;
});

weightInput.addEventListener('input', () => {
    weightSlider.value = weightInput.value;
});

// ========== GENDER & ETHNICITY ==========
let selectedGender = 'male';

genderButtons.forEach(button => {
    button.addEventListener('click', () => {
        genderButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedGender = button.getAttribute('data-gender');
    });
});

// Ethnicity selector (add this to HTML: <select id="ethnicity-select">)
const ethnicitySelect = document.getElementById('ethnicity-select');
if (ethnicitySelect) {
    ethnicitySelect.addEventListener('change', (e) => {
        userEthnicity = e.target.value;
        if (bmiValue.textContent !== '00.0') handleCalculate();
    });
}

// ========== CALCULATE BMI ==========
function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

// Update category highlight
function updateCategoryHighlight(categoryClass) {
    document.querySelectorAll('.category').forEach(cat => {
        cat.classList.remove('active');
    });
    const activeCat = document.getElementById(`category-${categoryClass}`);
    if (activeCat) activeCat.classList.add('active');
}

// Update circle color
function updateCircleColor(bmi) {
    const circle = document.querySelector('.circle');
    let color;
    
    if (bmi < 18.5) color = '#3b82f6';
    else if (bmi < (userEthnicity === 'asian' ? 23 : 25)) color = '#10b981';
    else if (bmi < (userEthnicity === 'asian' ? 25 : 30)) color = '#f59e0b';
    else color = '#ef4444';
    
    if (circle) {
        circle.style.background = `conic-gradient(${color} 0% 100%, #e5e7eb 100% 100%)`;
    }
}

// Format BMI
function formatBMI(bmi) {
    return bmi.toFixed(1);
}

// ========== MAIN CALCULATE ==========
function handleCalculate() {
    const heightCm = getHeightInCm();
    const weightKg = getWeightInKg();
    const age = ageInput.value ? parseInt(ageInput.value) : null;
    
    // Validation
    const minH = currentUnit === 'metric' ? 100 : 39;
    const maxH = currentUnit === 'metric' ? 250 : 98;
    const minW = currentUnit === 'metric' ? 30 : 66;
    const maxW = currentUnit === 'metric' ? 200 : 440;
    
    if (!heightCm || !weightKg || heightCm < 100 || heightCm > 250 || weightKg < 20 || weightKg > 200) {
        alert(`कृपया मान्य मान डालें:\nऊंचाई: ${formatHeightDisplay(minH)} - ${formatHeightDisplay(maxH)}\nवज़न: ${formatWeightDisplay(minW)} - ${formatWeightDisplay(maxW)}`);
        return;
    }
    
    const bmi = calculateBMI(weightKg, heightCm);
    const category = getBMICategory(bmi, userEthnicity);
    const idealWeightRange = calculateIdealWeight(heightCm, userEthnicity);
    
    // Update UI
    bmiValue.textContent = formatBMI(bmi);
    categoryText.textContent = category.category;
    
    // Build advice with Indian context
    let fullAdvice = category.advice;
    if (category.healthRisk) {
        fullAdvice += ` (${category.healthRisk})`;
    }
    if (userEthnicity === 'asian' && bmi >= 23) {
        fullAdvice += ' ⚠️ भारतीयों में 23+ BMI से डायबिटीज़ का खतरा दोगुना हो जाता है।';
    }
    adviceText.textContent = fullAdvice;
    
    // Display ideal weight with unit
    idealWeight.textContent = `${formatWeightDisplay(idealWeightRange.min)} - ${formatWeightDisplay(idealWeightRange.max)}`;
    
    updateCategoryHighlight(category.colorClass);
    updateCircleColor(bmi);
    
    // Animation
    bmiValue.style.transform = 'scale(1.1)';
    setTimeout(() => bmiValue.style.transform = 'scale(1)', 300);
    
    document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========== RESET ==========
function handleReset() {
    if (currentUnit === 'metric') {
        heightInput.value = 170; heightSlider.value = 170;
        weightInput.value = 70; weightSlider.value = 70;
    } else {
        heightInput.value = 67; heightSlider.value = 67;
        weightInput.value = 154; weightSlider.value = 154;
    }
    ageInput.value = '';
    
    genderButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-gender') === 'male') btn.classList.add('active');
    });
    selectedGender = 'male';
    
    if (ethnicitySelect) ethnicitySelect.value = 'asian';
    userEthnicity = 'asian';
    
    bmiValue.textContent = '00.0';
    categoryText.textContent = 'Enter values to calculate';
    adviceText.textContent = 'Calculate BMI to get personalized advice';
    idealWeight.textContent = '--';
    
    document.querySelectorAll('.category').forEach(cat => cat.classList.remove('active'));
    
    const circle = document.querySelector('.circle');
    if (circle) {
        circle.style.background = `conic-gradient(#3b82f6 0% 25%, #10b981 25% 50%, #f59e0b 50% 75%, #ef4444 75% 100%)`;
    }
}

// ========== EVENT LISTENERS ==========
calculateBtn.addEventListener('click', handleCalculate);
resetBtn.addEventListener('click', handleReset);

heightInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleCalculate(); });
weightInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleCalculate(); });

// Input validation with unit awareness
heightInput.addEventListener('input', () => {
    const max = currentUnit === 'metric' ? 250 : 98;
    const min = currentUnit === 'metric' ? 100 : 39;
    if (parseFloat(heightInput.value) > max) heightInput.value = max;
    if (parseFloat(heightInput.value) < min) heightInput.value = min;
});

weightInput.addEventListener('input', () => {
    const max = currentUnit === 'metric' ? 200 : 440;
    const min = currentUnit === 'metric' ? 30 : 66;
    if (parseFloat(weightInput.value) > max) weightInput.value = max;
    if (parseFloat(weightInput.value) < min) weightInput.value = min;
});

// ========== INITIALIZE ==========
window.addEventListener('load', () => {
    const savedUnit = detectUserUnit();
    setUnits(savedUnit);
    
    // Add ethnicity selector dynamically if not present
    if (!document.getElementById('ethnicity-select')) {
        const inputGroup = document.querySelector('.input-group, .gender-group')?.parentNode;
        if (inputGroup) {
            const ethnicityDiv = document.createElement('div');
            ethnicityDiv.className = 'ethnicity-group';
            ethnicityDiv.innerHTML = `
                <label for="ethnicity-select">🌍 Ethnicity (BMI Cutoff)</label>
                <select id="ethnicity-select" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <option value="asian" selected>🇮🇳 Indian / Asian (23+ = Overweight)</option>
                    <option value="caucasian">🇺🇸 Caucasian / White (25+ = Overweight)</option>
                    <option value="african">🌍 African / Black</option>
                </select>
                <small style="display:block; margin-top:4px; color:#64748b;">भारतीयों के लिए BMI कट-ऑफ 23 है</small>
            `;
            inputGroup.appendChild(ethnicityDiv);
            
            document.getElementById('ethnicity-select').addEventListener('change', (e) => {
                userEthnicity = e.target.value;
                if (bmiValue.textContent !== '00.0') handleCalculate();
            });
        }
    }
    
    // Initial calculation with default values
    setTimeout(() => handleCalculate(), 100);
});

// Expose setUnits globally for toggle buttons
window.setUnits = setUnits;
