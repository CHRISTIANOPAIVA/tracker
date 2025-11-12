const { runAsync, getAsync, allAsync } = require('../database/query');
const { AppError } = require('../utils/errors');
const { validateActivity } = require('../utils/validators');
const { calculateCalories, calculateDistance } = require('../utils/calculations');
const { getUserById } = require('./userModel');

const formatActivity = (activity) =>
    activity
        ? {
              ...activity,
              duration: Number(activity.duration),
              distance: Number(activity.distance),
              caloriesBurned: Number(activity.caloriesBurned),
              heartRate: activity.heartRate !== null ? Number(activity.heartRate) : null,
          }
        : null;

const getAllActivities = async (filters = {}) => {
    const conditions = [];
    const params = [];

    if (filters.userId) {
        conditions.push('userId = ?');
        params.push(filters.userId);
    }

    if (filters.type) {
        conditions.push('type = ?');
        params.push(filters.type);
    }

    if (filters.startDate) {
        conditions.push('date(startTime) >= date(?)');
        params.push(filters.startDate);
    }

    if (filters.endDate) {
        conditions.push('date(startTime) <= date(?)');
        params.push(filters.endDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const activities = await allAsync(
        `SELECT * FROM activities ${whereClause} ORDER BY startTime DESC`,
        params
    );

    return activities.map(formatActivity);
};

const getActivityById = async (id) => {
    const activity = await getAsync(`SELECT * FROM activities WHERE id = ?`, [id]);
    return formatActivity(activity);
};

const inferEndTime = (startTime, durationMinutes, endTime) => {
    if (endTime) return endTime;
    if (!startTime || !durationMinutes) return null;
    const start = new Date(startTime);
    const inferred = new Date(start.getTime() + durationMinutes * 60000);
    return inferred.toISOString();
};

const createActivity = async (payload) => {
    const { valid, errors, data } = validateActivity(payload);
    if (!valid) {
        throw new AppError(400, 'Dados de atividade inválidos', errors);
    }

    const user = await getUserById(data.userId);
    if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
    }

    const distance = data.distance ?? calculateDistance(data.type, data.duration);
    const calories =
        data.caloriesBurned ?? calculateCalories(data.type, data.duration, user.weight);
    const endTime = inferEndTime(data.startTime, data.duration, data.endTime);

    const result = await runAsync(
        `INSERT INTO activities 
            (userId, type, duration, distance, caloriesBurned, heartRate, startTime, endTime, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.userId,
            data.type,
            data.duration,
            distance,
            calories,
            data.heartRate ?? null,
            data.startTime,
            endTime ?? null,
            data.notes ?? null,
        ]
    );

    return getActivityById(result.id);
};

const updateActivity = async (id, payload) => {
    const existing = await getActivityById(id);
    if (!existing) {
        throw new AppError(404, 'Atividade não encontrada');
    }

    const merged = { ...existing, ...payload };
    const { valid, errors, data } = validateActivity(merged);
    if (!valid) {
        throw new AppError(400, 'Dados de atividade inválidos', errors);
    }

    const user = await getUserById(data.userId);
    if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
    }

    const duration = data.duration ?? existing.duration;
    const type = data.type ?? existing.type;
    const distance = data.distance ?? calculateDistance(type, duration);
    const calories =
        data.caloriesBurned ?? calculateCalories(type, duration, user.weight ?? undefined);
    const endTime = inferEndTime(data.startTime, duration, data.endTime);

    await runAsync(
        `UPDATE activities
         SET userId = ?, type = ?, duration = ?, distance = ?, caloriesBurned = ?, heartRate = ?, startTime = ?, endTime = ?, notes = ?
         WHERE id = ?`,
        [
            data.userId,
            type,
            duration,
            distance,
            calories,
            data.heartRate ?? null,
            data.startTime,
            endTime ?? null,
            data.notes ?? null,
            id,
        ]
    );

    return getActivityById(id);
};

const deleteActivity = async (id) => {
    const existing = await getActivityById(id);
    if (!existing) {
        throw new AppError(404, 'Atividade não encontrada');
    }
    await runAsync(`DELETE FROM activities WHERE id = ?`, [id]);
    return { success: true };
};

const getOverviewStats = async () => {
    const totals = await getAsync(
        `SELECT 
            COUNT(*) AS totalActivities,
            COUNT(DISTINCT userId) AS activeUsers,
            COALESCE(SUM(duration), 0) AS totalDuration,
            COALESCE(SUM(distance), 0) AS totalDistance,
            COALESCE(SUM(caloriesBurned), 0) AS totalCalories
        FROM activities`
    );

    const caloriesByType = await allAsync(
        `SELECT type, COALESCE(SUM(caloriesBurned), 0) AS calories
         FROM activities
         GROUP BY type`
    );

    const durationByType = await allAsync(
        `SELECT type, COALESCE(SUM(duration), 0) AS duration
         FROM activities
         GROUP BY type`
    );

    const weeklyCalories = await allAsync(
        `SELECT strftime('%Y-%m-%d', startTime) AS day, COALESCE(SUM(caloriesBurned), 0) AS calories
         FROM activities
         WHERE date(startTime) >= date('now', '-6 days')
         GROUP BY day
         ORDER BY day ASC`
    );

    return {
        totals: {
            totalActivities: Number(totals.totalActivities) || 0,
            activeUsers: Number(totals.activeUsers) || 0,
            totalDuration: Number(totals.totalDuration) || 0,
            totalDistance: Number(totals.totalDistance) || 0,
            totalCalories: Number(totals.totalCalories) || 0,
        },
        caloriesByType: caloriesByType.map((row) => ({
            type: row.type,
            calories: Number(row.calories) || 0,
        })),
        durationByType: durationByType.map((row) => ({
            type: row.type,
            duration: Number(row.duration) || 0,
        })),
        weeklyCalories: weeklyCalories.map((row) => ({
            day: row.day,
            calories: Number(row.calories) || 0,
        })),
    };
};

module.exports = {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    getOverviewStats,
};
