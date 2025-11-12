const { runAsync, getAsync, allAsync } = require('../database/query');
const { validateUser } = require('../utils/validators');
const { calculateBMI, getBMICategory } = require('../utils/calculations');
const { AppError } = require('../utils/errors');

const formatUser = (user) =>
    user
        ? {
              ...user,
              age: user.age !== null ? Number(user.age) : null,
              weight: user.weight !== null ? Number(user.weight) : null,
              height: user.height !== null ? Number(user.height) : null,
          }
        : null;

const getAllUsers = async () => {
    const users = await allAsync(`SELECT * FROM users ORDER BY createdAt DESC`);
    return users.map(formatUser);
};

const getUserById = async (id) => {
    const user = await getAsync(`SELECT * FROM users WHERE id = ?`, [id]);
    return formatUser(user);
};

const createUser = async (payload) => {
    const { valid, errors, data } = validateUser(payload);
    if (!valid) {
        throw new AppError(400, 'Dados de usuário inválidos', errors);
    }

    const result = await runAsync(
        `INSERT INTO users (name, email, age, weight, height) VALUES (?, ?, ?, ?, ?)`,
        [data.name, data.email, data.age ?? null, data.weight ?? null, data.height ?? null]
    );

    return getUserById(result.id);
};

const updateUser = async (id, payload) => {
    const existing = await getUserById(id);
    if (!existing) {
        throw new AppError(404, 'Usuário não encontrado');
    }

    const merged = { ...existing, ...payload };
    const { valid, errors, data } = validateUser(merged);
    if (!valid) {
        throw new AppError(400, 'Dados de usuário inválidos', errors);
    }

    await runAsync(
        `UPDATE users SET name = ?, email = ?, age = ?, weight = ?, height = ? WHERE id = ?`,
        [data.name, data.email, data.age ?? null, data.weight ?? null, data.height ?? null, id]
    );

    return getUserById(id);
};

const deleteUser = async (id) => {
    const existing = await getUserById(id);
    if (!existing) {
        throw new AppError(404, 'Usuário não encontrado');
    }

    await runAsync(`DELETE FROM users WHERE id = ?`, [id]);
    return { success: true };
};

const getUserStats = async (id) => {
    const user = await getUserById(id);
    if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
    }

    const stats = await getAsync(
        `SELECT 
            COUNT(*) AS totalActivities,
            COALESCE(SUM(duration), 0) AS totalDuration,
            COALESCE(SUM(distance), 0) AS totalDistance,
            COALESCE(SUM(caloriesBurned), 0) AS totalCalories,
            COALESCE(AVG(heartRate), 0) AS averageHeartRate
        FROM activities
        WHERE userId = ?`,
        [id]
    );

    const recentActivities = await allAsync(
        `SELECT * FROM activities WHERE userId = ? ORDER BY startTime DESC LIMIT 5`,
        [id]
    );

    const bmi = calculateBMI(user.weight, user.height);

    return {
        user: {
            ...user,
            bmi,
            bmiCategory: getBMICategory(bmi),
        },
        stats: {
            totalActivities: Number(stats.totalActivities) || 0,
            totalDuration: Number(stats.totalDuration) || 0,
            totalDistance: Number(stats.totalDistance) || 0,
            totalCalories: Number(stats.totalCalories) || 0,
            averageHeartRate: Number(stats.averageHeartRate) || 0,
        },
        recentActivities,
    };
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserStats,
};
