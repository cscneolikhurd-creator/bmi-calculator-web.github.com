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

// Sync sliders with number inputs
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

// Gender selection
let selectedGender = 'male';

genderButtons.forEach(button => {
    button.addEventListener('click', () => {
        genderButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedGender = button.getAttribute('data-gender');
    });
});

// Calculate BMI
function calculateBMI(height, weight) {
    // Convert height from cm to meters
    const heightInMeters = height / 100;
    // BMI formula: weight(kg) / (height(m) * height(m))
    return weight / (heightInMeters * heightInMeters);
}

// Get BMI category
function getBMICategory(bmi) {
    if (bmi < 18.5) {
        return {
            category: 'Underweight',
            colorClass: 'underweight',
            advice: 'You should consider gaining some weight. Eat nutritious foods and consult a dietitian.',
            color: '#3b82f6'
        };
    } else if (bmi >= 18.5 && bmi < 25) {
        return {
            category: 'Normal',
            colorClass: 'normal',
            advice: 'Great! Maintain your current weight with a balanced diet and regular exercise.',
            color: '#10b981'
        };
    } else if (bmi >= 25 && bmi < 30) {
        return {
            category: 'Overweight',
            colorClass: 'overweight',
            advice: 'Consider regular exercise and a balanced diet to reach a healthy weight.',
            color: '#f59e0b'
        };
    } else {
        return {
            category: 'Obese',
            colorClass: 'obese',
            advice: 'Consult with a healthcare provider for a personalized weight management plan.',
            color: '#ef4444'
        };
    }
}

// Calculate ideal weight range
function calculateIdealWeight(height) {
    // Based on BMI range 18.5-24.9
    const minHeightM = height / 100;
    const minWeight = 18.5 * (minHeightM * minHeightM);
    const maxWeight = 24.9 * (minHeightM * minHeightM);
    
    return {
        min: Math.round(minWeight),
        max: Math.round(maxWeight)
    };
}

// Update category highlighting
function updateCategoryHighlight(categoryClass) {
    // Remove active class from all categories
    document.querySelectorAll('.category').forEach(cat => {
        cat.classList.remove('active');
    });
    
    // Add active class to current category
    document.getElementById(`category-${categoryClass}`).classList.add('active');
}

// Update circle color based on BMI
function updateCircleColor(bmi) {
    const circle = document.querySelector('.circle');
    let color;
    
    if (bmi < 18.5) color = '#3b82f6';
    else if (bmi < 25) color = '#10b981';
    else if (bmi < 30) color = '#f59e0b';
    else color = '#ef4444';
    
    circle.style.background = `conic-gradient(
        ${color} 0% 100%,
        #e5e7eb 100% 100%
    )`;
}

// Format BMI value
function formatBMI(bmi) {
    return bmi.toFixed(1);
}

// Main calculate function
function handleCalculate() {
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    const age = ageInput.value ? parseInt(ageInput.value) : null;
    
    // Validate inputs
    if (!height || !weight || height < 50 || height > 250 || weight < 20 || weight > 200) {
        alert('Please enter valid height (50-250 cm) and weight (20-200 kg) values.');
        return;
    }
    
    // Calculate BMI
    const bmi = calculateBMI(height, weight);
    const category = getBMICategory(bmi);
    const idealWeightRange = calculateIdealWeight(height);
    
    // Update UI
    bmiValue.textContent = formatBMI(bmi);
    categoryText.textContent = category.category;
    adviceText.textContent = category.advice;
    idealWeight.textContent = `${idealWeightRange.min} - ${idealWeightRange.max} kg`;
    
    // Update category highlighting
    updateCategoryHighlight(category.colorClass);
    
    // Update circle color
    updateCircleColor(bmi);
    
    // Add some animation
    bmiValue.style.transform = 'scale(1.1)';
    setTimeout(() => {
        bmiValue.style.transform = 'scale(1)';
    }, 300);
    
    // Scroll to result
    document.getElementById('result-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Reset function
function handleReset() {
    heightInput.value = 170;
    heightSlider.value = 170;
    weightInput.value = 70;
    weightSlider.value = 70;
    ageInput.value = '';
    
    // Reset gender to male
    genderButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-gender') === 'male') {
            btn.classList.add('active');
        }
    });
    selectedGender = 'male';
    
    // Reset results
    bmiValue.textContent = '00.0';
    categoryText.textContent = 'Enter values to calculate';
    adviceText.textContent = 'Calculate BMI to get personalized advice';
    idealWeight.textContent = '-- kg';
    
    // Reset category highlighting
    document.querySelectorAll('.category').forEach(cat => {
        cat.classList.remove('active');
    });
    
    // Reset circle color
    const circle = document.querySelector('.circle');
    circle.style.background = `conic-gradient(
        #3b82f6 0% 25%,
        #10b981 25% 50%,
        #f59e0b 50% 75%,
        #ef4444 75% 100%
    )`;
}

// Event Listeners
calculateBtn.addEventListener('click', handleCalculate);
resetBtn.addEventListener('click', handleReset);

// Allow Enter key to trigger calculation
heightInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleCalculate();
});

weightInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleCalculate();
});

// Initialize with some default calculation
window.addEventListener('load', () => {
    // Calculate default values
    const defaultBMI = calculateBMI(170, 70);
    bmiValue.textContent = formatBMI(defaultBMI);
    const category = getBMICategory(defaultBMI);
    const idealWeightRange = calculateIdealWeight(170);
    
    categoryText.textContent = category.category;
    adviceText.textContent = category.advice;
    idealWeight.textContent = `${idealWeightRange.min} - ${idealWeightRange.max} kg`;
    
    updateCategoryHighlight(category.colorClass);
    updateCircleColor(defaultBMI);
});

// Add input validation
heightInput.addEventListener('input', () => {
    if (heightInput.value > 250) heightInput.value = 250;
    if (heightInput.value < 50) heightInput.value = 50;
});

weightInput.addEventListener('input', () => {
    if (weightInput.value > 200) weightInput.value = 200;
    if (weightInput.value < 20) weightInput.value = 20;
});

// Add tooltips
const tooltips = {
    'height': 'Enter your height in centimeters (cm)',
    'weight': 'Enter your weight in kilograms (kg)',
    'age': 'Age helps provide more personalized results',
    'gender': 'Gender can affect BMI interpretation'
};

// Add tooltip functionality
Object.keys(tooltips).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltips[id];
            tooltip.style.position = 'absolute';
            tooltip.style.background = 'var(--dark-color)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '5px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '0.9rem';
            tooltip.style.zIndex = '1000';
            tooltip.style.top = (e.target.offsetTop - 40) + 'px';
            tooltip.style.left = e.target.offsetLeft + 'px';
            
            document.body.appendChild(tooltip);
            
            e.target.addEventListener('mouseleave', () => {
                document.body.removeChild(tooltip);
            }, { once: true });
        });
    }
});
