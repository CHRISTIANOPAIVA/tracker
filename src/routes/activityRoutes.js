const express = require('express');
const {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    getOverviewStats,
} = require('../models/activityModel');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get(
    '/',
    asyncHandler(async (req, res) => {
        const filters = {
            userId: req.query.userId ? Number(req.query.userId) : undefined,
            type: req.query.type,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        };
        const activities = await getAllActivities(filters);
        res.json(activities);
    })
);

router.get(
    '/stats/overview',
    asyncHandler(async (req, res) => {
        const stats = await getOverviewStats();
        res.json(stats);
    })
);

router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const activity = await getActivityById(Number(req.params.id));
        if (!activity) {
            return res.status(404).json({ error: 'Atividade não encontrada' });
        }
        res.json(activity);
    })
);

router.post(
    '/',
    asyncHandler(async (req, res) => {
        const activity = await createActivity(req.body);
        res.status(201).json(activity);
    })
);

router.put(
    '/:id',
    asyncHandler(async (req, res) => {
        const updated = await updateActivity(Number(req.params.id), req.body);
        res.json(updated);
    })
);

router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
        await deleteActivity(Number(req.params.id));
        res.status(204).send();
    })
);

module.exports = router;
