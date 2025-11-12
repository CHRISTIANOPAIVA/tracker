const config = require('../../config');

const allowedActivityTypes = config.activities.types;

const toNumber = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const toInteger = (value) => {
    const number = toNumber(value);
    return number !== null ? Math.trunc(number) : null;
};

const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};

const validateUser = (payload = {}, options = { partial: false }) => {
    const errors = [];
    const sanitized = {};
    const { partial } = options;

    if (!partial || payload.name !== undefined) {
        const name = payload.name ? String(payload.name).trim() : '';
        if (name.length < 2) {
            errors.push('Nome deve ter ao menos 2 caracteres.');
        } else {
            sanitized.name = name;
        }
    }

    if (!partial || payload.email !== undefined) {
        const email = payload.email ? String(payload.email).trim().toLowerCase() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Email inválido.');
        } else {
            sanitized.email = email;
        }
    }

    if (payload.age !== undefined) {
        const age = toInteger(payload.age);
        if (age === null || age < 1 || age > 150) {
            errors.push('Idade deve estar entre 1 e 150.');
        } else {
            sanitized.age = age;
        }
    }

    if (payload.weight !== undefined) {
        const weight = toNumber(payload.weight);
        if (weight === null || weight < 1 || weight > 500) {
            errors.push('Peso deve estar entre 1 e 500 kg.');
        } else {
            sanitized.weight = weight;
        }
    }

    if (payload.height !== undefined) {
        const height = toNumber(payload.height);
        if (height === null || height < 50 || height > 300) {
            errors.push('Altura deve estar entre 50 e 300 cm.');
        } else {
            sanitized.height = height;
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        data: sanitized,
    };
};

const validateActivity = (payload = {}, options = { partial: false }) => {
    const errors = [];
    const sanitized = {};
    const { partial } = options;

    if (!partial || payload.userId !== undefined) {
        const userId = toInteger(payload.userId);
        if (!userId || userId <= 0) {
            errors.push('userId deve ser um inteiro positivo.');
        } else {
            sanitized.userId = userId;
        }
    }

    if (!partial || payload.type !== undefined) {
        const type = payload.type ? String(payload.type).trim() : '';
        if (!allowedActivityTypes.includes(type)) {
            errors.push(`Tipo de atividade inválido. Use: ${allowedActivityTypes.join(', ')}`);
        } else {
            sanitized.type = type;
        }
    }

    if (!partial || payload.duration !== undefined) {
        const duration = toInteger(payload.duration);
        if (!duration || duration <= 0) {
            errors.push('Duração deve ser um número inteiro positivo (minutos).');
        } else {
            sanitized.duration = duration;
        }
    }

    if (!partial || payload.startTime !== undefined) {
        const startTime = normalizeDate(payload.startTime);
        if (!startTime) {
            errors.push('startTime inválido.');
        } else {
            sanitized.startTime = startTime;
        }
    }

    if (payload.endTime !== undefined) {
        const endTime = normalizeDate(payload.endTime);
        if (!endTime) {
            errors.push('endTime inválido.');
        } else {
            sanitized.endTime = endTime;
        }
    }

    if (payload.distance !== undefined) {
        const distance = toNumber(payload.distance);
        if (distance === null || distance < 0) {
            errors.push('Distância deve ser um número positivo.');
        } else {
            sanitized.distance = distance;
        }
    }

    if (payload.caloriesBurned !== undefined) {
        const caloriesBurned = toNumber(payload.caloriesBurned);
        if (caloriesBurned === null || caloriesBurned < 0) {
            errors.push('Calorias devem ser um número positivo.');
        } else {
            sanitized.caloriesBurned = caloriesBurned;
        }
    }

    if (payload.heartRate !== undefined) {
        const heartRate = toInteger(payload.heartRate);
        if (heartRate === null || heartRate < 0) {
            errors.push('Frequência cardíaca deve ser um inteiro positivo.');
        } else {
            sanitized.heartRate = heartRate;
        }
    }

    if (payload.notes !== undefined) {
        sanitized.notes = String(payload.notes).trim();
    }

    if (sanitized.startTime && sanitized.endTime) {
        if (new Date(sanitized.endTime) < new Date(sanitized.startTime)) {
            errors.push('endTime não pode ser anterior ao startTime.');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        data: sanitized,
    };
};

module.exports = {
    validateUser,
    validateActivity,
};
