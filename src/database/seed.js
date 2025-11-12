const { initializeDatabase } = require('./database');
const { runAsync } = require('./query');
const { calculateCalories, calculateDistance } = require('../utils/calculations');

const users = [
    {
        name: 'Ana Silva',
        email: 'ana.silva@example.com',
        age: 29,
        weight: 65,
        height: 168,
    },
    {
        name: 'Bruno Costa',
        email: 'bruno.costa@example.com',
        age: 34,
        weight: 82,
        height: 178,
    },
    {
        name: 'Carla Mendes',
        email: 'carla.mendes@example.com',
        age: 41,
        weight: 72,
        height: 165,
    },
];

const activityTemplates = [
    { type: 'running', duration: 45, heartRate: 150 },
    { type: 'cycling', duration: 60, heartRate: 140 },
    { type: 'yoga', duration: 30, heartRate: 95 },
    { type: 'walking', duration: 40, heartRate: 110 },
    { type: 'swimming', duration: 50, heartRate: 145 },
];

const seed = async () => {
    await initializeDatabase();

    await runAsync('DELETE FROM activities');
    await runAsync('DELETE FROM users');

    const userIds = [];
    for (const user of users) {
        const result = await runAsync(
            `INSERT INTO users (name, email, age, weight, height) VALUES (?, ?, ?, ?, ?)`,
            [user.name, user.email, user.age, user.weight, user.height]
        );
        userIds.push({ id: result.id, ...user });
    }

    const now = new Date();
    for (const { id, weight } of userIds) {
        for (let index = 0; index < activityTemplates.length; index += 1) {
            const activity = activityTemplates[index];
            const startTime = new Date(now.getTime() - index * 86400000).toISOString();
            const distance = calculateDistance(activity.type, activity.duration);
            const calories = calculateCalories(activity.type, activity.duration, weight);
            const endTime = new Date(
                new Date(startTime).getTime() + activity.duration * 60000
            ).toISOString();

            await runAsync(
                `INSERT INTO activities (userId, type, duration, distance, caloriesBurned, heartRate, startTime, endTime, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    activity.type,
                    activity.duration,
                    distance,
                    calories,
                    activity.heartRate,
                    startTime,
                    endTime,
                    `Treino ${activity.type}`,
                ]
            );
        }
    }
};

seed()
    .then(() => {
        console.log('Seed concluído com sucesso 🚀');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Erro ao rodar seed:', error);
        process.exit(1);
    });
