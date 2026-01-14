const express = require('express');
const cors = require('cors');
const path = require('path');
const { db } = require('./database/db');

const app = express();
const PORT = 3000;

// Configurações
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'Finance Flow Pro API', version: '2.0' });
});

// Rota de saúde
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Rota para dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// API: Listar transações
app.get('/api/transactions', (req, res) => {
    try {
        const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API: Adicionar transação
app.post('/api/transactions', (req, res) => {
    try {
        const { type, amount, category, description, date, payment_method } = req.body;
        
        if (!type || !amount || !date) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: type, amount, date'
            });
        }
        
        const stmt = db.prepare(`
            INSERT INTO transactions (type, amount, category, description, date, payment_method)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(type, amount, category || 'Outros', description || '', date, payment_method || 'outro');
        
        res.json({
            success: true,
            message: 'Transação adicionada!',
            id: result.lastInsertRowid
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR INICIADO!`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`💾 Banco: database.sqlite (${db.prepare('SELECT COUNT(*) as count FROM transactions').get().count} transações)`);
});