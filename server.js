const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { initializeDatabase } = require('./db');
const apiRoutes = require('./routes/api');
const pageRoutes = require('./routes/pages');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-default-jwt-secret-key-for-planner') {
    console.error('FATAL ERROR: JWT_SECRET не установлен или используется небезопасное значение по умолчанию.');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

console.log("LOG: server.js: Запуск сервера...");
app.set('trust proxy', 1);

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "cdn.jsdelivr.net"], // Разрешаем CDN для Chart.js
            styleSrc: ["'self'", "fonts.googleapis.com"],
            fontSrc: ["fonts.gstatic.com"],
            connectSrc: ["'self'", "script.google.com", "script.googleusercontent.com"], // ИСПРАВЛЕНИЕ
            imgSrc: ["'self'", "data:", "lh3.googleusercontent.com"],
            frameSrc: ["'self'"],
        },
    })
);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', pageRoutes);
app.use('/api', apiRoutes);

console.log("LOG: server.js: Middleware и маршруты настроены.");

app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました。`);
    initializeDatabase().catch(err => {
        console.error("Не удалось инициализировать базу данных:", err);
        process.exit(1);
    });
});