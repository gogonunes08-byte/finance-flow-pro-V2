const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { obterCategoria, formatarData } = require('../utils/categorization');

// Rota para receber dados do WhatsApp bot
router.post('/atualizar_dados', (req, res) => {
    try {
        const { tipo, valor, descricao, data: dataRecebida, forma_pagamento } = req.body;
        
        console.log('\n📱 Dados recebidos do WhatsApp:');
        console.log(`   📝 Descrição: ${descricao}`);
        console.log(`   💰 Valor: R$ ${valor}`);
        console.log(`   📊 Tipo: ${tipo === 'gasto' ? 'Despesa' : 'Receita'}`);
        
        // Validar dados
        if (!tipo || !valor || !descricao) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: tipo, valor, descricao'
            });
        }
        
        // Converter formato
        const type = tipo === 'gasto' ? 'expense' : 'income';
        const amount = parseFloat(valor);
        const description = descricao.trim();
        
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valor inválido'
            });
        }
        
        // Determinar data
        let date;
        if (dataRecebida) {
            const partes = dataRecebida.split('/');
            if (partes.length === 3) {
                date = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            } else {
                date = new Date().toISOString().split('T')[0];
            }
        } else {
            date = new Date().toISOString().split('T')[0];
        }
        
        // Determinar categoria e forma de pagamento
        const category = obterCategoria(description);
        const payment_method = forma_pagamento || 'outro';
        
        console.log(`   🏷️  Categoria: ${category}`);
        console.log(`   💳 Pagamento: ${payment_method}`);
        console.log(`   📅 Data: ${date}`);
        
        // Inserir no banco
        const stmt = db.prepare(`
            INSERT INTO transactions (type, amount, category, description, date, payment_method, source)
            VALUES (?, ?, ?, ?, ?, ?, 'whatsapp')
        `);
        
        const result = stmt.run(type, amount, category, description, date, payment_method);
        
        console.log(`   ✅ Salvo no banco com ID: ${result.lastInsertRowid}`);
        
        res.json({
            success: true,
            message: 'Transação do WhatsApp salva com sucesso!',
            id: result.lastInsertRowid,
            category: category,
            payment_method: payment_method,
            date: date,
            origem: 'whatsapp-bot'
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar dados do WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para status do bot
router.get('/status', (req, res) => {
    res.json({
        whatsappBot: 'integrated',
        status: 'ready',
        lastUpdate: new Date().toISOString(),
        endpoints: {
            post: '/api/whatsapp/atualizar_dados',
            get: '/api/whatsapp/status'
        }
    });
});

module.exports = router;