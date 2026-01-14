const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Estatísticas do dashboard
router.get('/stats', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
        
        // Estatísticas gerais
        const generalStats = db.prepare(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                AVG(CASE WHEN type = 'expense' THEN amount END) as avg_expense,
                AVG(CASE WHEN type = 'income' THEN amount END) as avg_income,
                MIN(date) as first_date,
                MAX(date) as last_date
            FROM transactions
        `).get();
        
        // Hoje
        const todayStats = db.prepare(`
            SELECT 
                COUNT(*) as count,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            WHERE date = ?
        `).get(today);
        
        // Este mês
        const monthStats = db.prepare(`
            SELECT 
                COUNT(*) as count,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            WHERE date >= ?
        `).get(firstDayStr);
        
        // Categorias mais comuns
        const topCategories = db.prepare(`
            SELECT category, COUNT(*) as count, SUM(amount) as total
            FROM transactions 
            WHERE type = 'expense'
            GROUP BY category 
            ORDER BY total DESC 
            LIMIT 6
        `).all();
        
        // Formas de pagamento
        const paymentMethods = db.prepare(`
            SELECT payment_method, COUNT(*) as count, SUM(amount) as total
            FROM transactions 
            GROUP BY payment_method 
            ORDER BY count DESC
        `).all();
        
        // Últimas transações
        const recentTransactions = db.prepare(`
            SELECT id, type, amount, category, description, date, payment_method
            FROM transactions
            ORDER BY date DESC, id DESC
            LIMIT 10
        `).all();
        
        // Gastos por dia (últimos 30 dias)
        const dailyExpenses = db.prepare(`
            SELECT date, SUM(amount) as total
            FROM transactions
            WHERE type = 'expense' AND date >= date('now', '-30 days')
            GROUP BY date
            ORDER BY date
        `).all();
        
        res.json({
            success: true,
            stats: {
                general: {
                    ...generalStats,
                    balance: (generalStats.total_income || 0) - (generalStats.total_expense || 0)
                },
                today: todayStats || { count: 0, income: 0, expense: 0 },
                month: monthStats || { count: 0, income: 0, expense: 0 }
            },
            top_categories: topCategories,
            payment_methods: paymentMethods,
            recent_transactions: recentTransactions,
            daily_expenses: dailyExpenses,
            periods: {
                today,
                first_day_of_month: firstDayStr
            }
        });
        
    } catch (error) {
        console.error('❌ Erro em /dashboard/stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Dados para gráficos
router.get('/charts', (req, res) => {
    try {
        // Dados para gráfico de pizza (categorias)
        const pieData = db.prepare(`
            SELECT category, SUM(amount) as value, COUNT(*) as count
            FROM transactions
            WHERE type = 'expense'
            GROUP BY category
            ORDER BY value DESC
        `).all();
        
        // Dados para gráfico de barras (entradas vs saídas por mês)
        const barData = db.prepare(`
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month DESC
            LIMIT 6
        `).all();
        
        // Dados para linha (evolução do saldo)
        const lineData = db.prepare(`
            SELECT 
                date,
                SUM(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)) OVER (ORDER BY date) as running_balance
            FROM transactions
            GROUP BY date
            ORDER BY date
        `).all();
        
        res.json({
            success: true,
            pie: pieData,
            bar: barData,
            line: lineData
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota de status do sistema
router.get('/status', (req, res) => {
    try {
        const dbInfo = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
        const uptime = process.uptime();
        
        res.json({
            success: true,
            system: {
                status: 'operational',
                uptime: Math.floor(uptime),
                uptime_human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
                timestamp: new Date().toISOString()
            },
            database: {
                transactions: dbInfo.count,
                connected: true
            },
            services: {
                api: 'running',
                whatsapp_bot: 'enabled',
                frontend: 'serving'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;