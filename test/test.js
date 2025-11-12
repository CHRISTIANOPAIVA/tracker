const assert = require('assert');
const {
    calculateCalories,
    calculateDistance,
    calculateBMI,
    getBMICategory,
} = require('../src/utils/calculations');

const run = () => {
    const calories = calculateCalories('running', 30, 70);
    assert(calories > 0, 'Calorias devem ser maiores que zero para running');

    const distance = calculateDistance('cycling', 60);
    assert.strictEqual(distance, 20, 'Ciclismo por 60 minutos deve resultar em 20km');

    const bmi = calculateBMI(70, 175);
    assert(Number.isFinite(bmi) && bmi > 0, 'BMI deve ser um número positivo');

    const category = getBMICategory(bmi);
    assert(['underweight', 'normal', 'overweight', 'obesity'].includes(category));
};

try {
    run();
    console.log('✅ Todos os testes passaram!');
} catch (error) {
    console.error('❌ Teste falhou:', error.message);
    process.exit(1);
}
