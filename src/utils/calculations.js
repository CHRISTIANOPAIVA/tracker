const config = require('../../config');

const { calorieFactors, averageSpeeds } = config.activities;

const DEFAULT_WEIGHT = 70;

const roundNumber = (value) => Number((value || 0).toFixed(2));

const calculateCalories = (type, durationMinutes, weightKg = DEFAULT_WEIGHT) => {
    if (!durationMinutes || durationMinutes <= 0) {
        return 0;
    }

    const factor = calorieFactors[type] || calorieFactors.other;
    const weightFactor = weightKg > 0 ? weightKg / DEFAULT_WEIGHT : 1;
    const calories = factor * durationMinutes * weightFactor;
    return roundNumber(calories);
};

const calculateDistance = (type, durationMinutes) => {
    if (!durationMinutes || durationMinutes <= 0) {
        return 0;
    }

    const speed = averageSpeeds[type] ?? averageSpeeds.walking;
    if (!speed) {
        return 0;
    }

    const distance = (speed * durationMinutes) / 60;
    return roundNumber(distance);
};

const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm) {
        return null;
    }

    const heightMeters = heightCm / 100;
    if (heightMeters <= 0) {
        return null;
    }

    const bmi = weightKg / (heightMeters * heightMeters);
    return roundNumber(bmi);
};

const getBMICategory = (bmi) => {
    if (bmi === null || bmi === undefined) {
        return 'unknown';
    }

    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obesity';
};

module.exports = {
    calculateCalories,
    calculateDistance,
    calculateBMI,
    getBMICategory,
};
