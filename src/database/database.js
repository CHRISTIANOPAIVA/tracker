const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../../config');

const dbFile = config.database.path;
const dbDir = path.dirname(dbFile);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
        throw err;
    }
});

const runStatement = (sql) =>
    new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });

let initialized = false;

const initializeDatabase = async () => {
    if (initialized) {
        return;
    }

    await runStatement('PRAGMA foreign_keys = ON');

    await runStatement(
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            age INTEGER,
            weight REAL,
            height REAL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    );

    await runStatement(
        `CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            type TEXT NOT NULL,
            duration INTEGER NOT NULL,
            distance REAL DEFAULT 0,
            caloriesBurned REAL DEFAULT 0,
            heartRate INTEGER,
            startTime DATETIME NOT NULL,
            endTime DATETIME,
            notes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`
    );

    await runStatement(`CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(userId)`);
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type)`);
    await runStatement(
        `CREATE INDEX IF NOT EXISTS idx_activities_startTime ON activities(startTime)`
    );

    initialized = true;
};

module.exports = {
    db,
    initializeDatabase,
};
