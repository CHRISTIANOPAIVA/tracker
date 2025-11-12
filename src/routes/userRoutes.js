const express = require('express');
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserStats,
} = require('../models/userModel');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get(
    '/',
    asyncHandler(async (req, res) => {
        const users = await getAllUsers();
        res.json(users);
    })
);

router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const user = await getUserById(Number(req.params.id));
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(user);
    })
);

router.post(
    '/',
    asyncHandler(async (req, res) => {
        const user = await createUser(req.body);
        res.status(201).json(user);
    })
);

router.put(
    '/:id',
    asyncHandler(async (req, res) => {
        const updated = await updateUser(Number(req.params.id), req.body);
        res.json(updated);
    })
);

router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
        await deleteUser(Number(req.params.id));
        res.status(204).send();
    })
);

router.get(
    '/:id/stats',
    asyncHandler(async (req, res) => {
        const stats = await getUserStats(Number(req.params.id));
        res.json(stats);
    })
);

module.exports = router;
