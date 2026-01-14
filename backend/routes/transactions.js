const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { obterCategoria } = require('../utils/categorization');

// GET todas transações
router.get('/', (req, res) => {
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

// POST nova transação
router.post('/', (req, res) => {
    try {
        const { type, amount, category, description, date, payment_method } = req.body;
        
        if (!type || !amount || !date) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: type, amount, date'
            });
        }
        
        const finalCategory = category || obterCategoria(description || '');
        const finalPaymentMethod = payment_method || 'outro';
        
        const stmt = db.prepare(`
            INSERT INTO transactions (type, amount, category, description, date, payment_method)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(type, amount, finalCategory, description || '', date, finalPaymentMethod);
        
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

module.exports = router;