const path = require('path');
const os = require('os');

module.exports = {
    // Server Configuration
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    
    // Database Configuration
    database: {
        path: (() => {
            if (process.env.DATABASE_PATH) {
                return path.resolve(process.env.DATABASE_PATH);
            }

            if (process.env.VERCEL) {
                return path.join(os.tmpdir(), 'fitness_monitor.db');
            }

            return path.join(__dirname, 'src', 'database', 'fitness_monitor.db');
        })(),
        options: {
            verbose: console.log
        }
    },
    
    // Application Settings
    app: {
        name: 'FitTrack Pro',
        version: '1.0.0',
        description: 'Monitor de Atividade Física',
        timezone: 'America/Sao_Paulo'
    },
    
    // Security Settings
    security: {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }
    },
    
    // Activity Settings
    activities: {
        types: ['running', 'cycling', 'swimming', 'walking', 'gym', 'yoga', 'other'],
        calorieFactors: {
            running: 12,
            cycling: 8,
            swimming: 10,
            walking: 4,
            gym: 6,
            yoga: 3,
            other: 5
        },
        averageSpeeds: {
            running: 10,
            cycling: 20,
            swimming: 2,
            walking: 5,
            gym: 0,
            yoga: 0,
            other: 0
        }
    },
    
    // Chart Settings
    charts: {
        colors: [
            '#2563eb', // primary
            '#10b981', // success
            '#f59e0b', // warning
            '#ef4444', // danger
            '#8b5cf6', // purple
            '#06b6d4', // cyan
            '#84cc16'  // lime
        ]
    }
};
