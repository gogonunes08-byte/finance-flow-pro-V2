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

// ===== ROTAS PRINCIPAIS =====

// Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Health check (CRÍTICO - frontend precisa)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'finance-flow-pro',
        timestamp: new Date().toISOString(),
        version: '2.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ===== API DE TRANSAÇÕES =====

// Listar transações
app.get('/api/transactions', (req, res) => {
    try {
        const { type, category, payment_method, search, page = 1, limit = 15 } = req.query;
        
        let query = 'SELECT * FROM transactions WHERE 1=1';
        const params = [];
        
        // Filtros
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (payment_method) {
            query += ' AND payment_method = ?';
            params.push(payment_method);
        }
        
        if (search) {
            query += ' AND description LIKE ?';
            params.push(`%${search}%`);
        }
        
        // Contar total
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const totalResult = db.prepare(countQuery).get(...params);
        const total = totalResult ? totalResult.total : 0;
        
        // Paginação
        const offset = (page - 1) * limit;
        query += ' ORDER BY date DESC, id DESC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        // Executar
        const transactions = db.prepare(query).all(...params);
        
        // Calcular totais
        const totalsQuery = `
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
            FROM transactions
            WHERE 1=1
            ${type ? ' AND type = ?' : ''}
        `;
        
        const totals = db.prepare(totalsQuery).get(
            ...params.slice(0, type ? 1 : 0)
        ) || { total_income: 0, total_expense: 0 };
        
        res.json({
            success: true,
            data: transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            },
            totals: {
                income: totals.total_income || 0,
                expense: totals.total_expense || 0,
                balance: (totals.total_income || 0) - (totals.total_expense || 0)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Adicionar transação
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
        
        const result = stmt.run(
            type, 
            parseFloat(amount), 
            category || 'Outros', 
            description || '', 
            date, 
            payment_method || 'outro'
        );
        
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

// ===== API DO DASHBOARD =====

// Estatísticas
app.get('/api/dashboard/stats', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const generalStats = db.prepare(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                MIN(date) as first_date,
                MAX(date) as last_date
            FROM transactions
        `).get();
        
        const todayStats = db.prepare(`
            SELECT 
                COUNT(*) as count,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            WHERE date = ?
        `).get(today) || { count: 0, income: 0, expense: 0 };
        
        const topCategories = db.prepare(`
            SELECT category, COUNT(*) as count, SUM(amount) as total
            FROM transactions 
            WHERE type = 'expense'
            GROUP BY category 
            ORDER BY total DESC 
            LIMIT 6
        `).all();
        
        const recentTransactions = db.prepare(`
            SELECT * FROM transactions
            ORDER BY date DESC, id DESC
            LIMIT 10
        `).all();
        
        res.json({
            success: true,
            stats: {
                general: generalStats,
                today: todayStats,
                recent_transactions: recentTransactions,
                top_categories: topCategories
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Gráficos
app.get('/api/dashboard/charts', (req, res) => {
    try {
        const pieData = db.prepare(`
            SELECT category, SUM(amount) as value, COUNT(*) as count
            FROM transactions
            WHERE type = 'expense'
            GROUP BY category
            ORDER BY value DESC
        `).all();
        
        const barData = db.prepare(`
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            WHERE date >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month
        `).all();
        
        const paymentMethods = db.prepare(`
            SELECT payment_method, COUNT(*) as count, SUM(amount) as total
            FROM transactions 
            GROUP BY payment_method 
            ORDER BY count DESC
        `).all();
        
        res.json({
            success: true,
            pie: pieData,
            bar: barData,
            paymentMethods: paymentMethods
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Status
app.get('/api/dashboard/status', (req, res) => {
    try {
        const dbInfo = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
        
        res.json({
            success: true,
            system: {
                status: 'operational',
                timestamp: new Date().toISOString()
            },
            database: {
                transactions: dbInfo.count,
                connected: true
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Categorias
app.get('/api/transactions/categories', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT category, COUNT(*) as count
            FROM transactions
            GROUP BY category
            ORDER BY count DESC
        `).all();
        
        res.json({
            success: true,
            data: categories
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Formas de pagamento
app.get('/api/transactions/payment-methods', (req, res) => {
    try {
        const methods = db.prepare(`
            SELECT payment_method, COUNT(*) as count
            FROM transactions
            GROUP BY payment_method
            ORDER BY count DESC
        `).all();
        
        res.json({
            success: true,
            data: methods
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== INICIAR SERVIDOR =====

app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR RODANDO!`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`💾 Transações: ${db.prepare('SELECT COUNT(*) as count FROM transactions').get().count}`);
    console.log(`✨ Tema escuro: Disponível (clique no ícone lua)`);
});