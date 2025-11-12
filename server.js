const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const { initializeDatabase } = require('./src/database/database');

const userRoutes = require('./src/routes/userRoutes');
const activityRoutes = require('./src/routes/activityRoutes');

const app = express();

app.use(cors(config.security.cors));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor',
        details: err.details || null,
    });
});

const startServer = async () => {
    try {
        await initializeDatabase();
        const { port, host } = config;
        app.listen(port, () => {
            console.log(`Servidor FitTrack Pro rodando em http://${host}:${port}`);
        });
    } catch (error) {
        console.error('Falha ao inicializar o banco de dados:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
