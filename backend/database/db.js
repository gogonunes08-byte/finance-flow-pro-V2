const Database = require('better-sqlite3');
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Configurar pragmas para melhor performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -2000'); // 2MB cache

// Criar tabela transactions se não existir
function criarTabelaTransactions() {
    console.log('🔧 Verificando/Criando tabela transactions...');
    
    db.prepare(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
            amount REAL NOT NULL CHECK(amount > 0),
            category TEXT NOT NULL DEFAULT 'Outros',
            description TEXT,
            date TEXT NOT NULL,
            payment_method TEXT DEFAULT 'outro',
            source TEXT DEFAULT 'web',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    
    // Criar índices para performance
    try {
        db.prepare('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(payment_method)').run();
        console.log('✅ Índices criados/verificados');
    } catch (error) {
        console.log('⚠️ Erro ao criar índices:', error.message);
    }
}

// Verificar e criar tabelas
criarTabelaTransactions();

// Verificar colunas faltantes
function verificarColunas() {
    console.log('🔍 Verificando colunas da tabela...');
    
    const columns = db.prepare('PRAGMA table_info(transactions)').all();
    const columnNames = columns.map(col => col.name);
    
    const colunasNecessarias = [
        'id', 'type', 'amount', 'category', 'description', 
        'date', 'payment_method', 'source', 'created_at', 'updated_at'
    ];
    
    colunasNecessarias.forEach(coluna => {
        if (!columnNames.includes(coluna)) {
            console.log(`   ⚠️ Coluna ${coluna} não encontrada`);
        }
    });
    
    console.log(`✅ Tabela possui ${columns.length} colunas`);
}

// Executar verificação
verificarColunas();

// Funções utilitárias
function formatarResultados(resultados) {
    if (!resultados || resultados.length === 0) {
        return [];
    }
    
    return resultados.map(row => ({
        ...row,
        amount: parseFloat(row.amount),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString()
    }));
}

module.exports = {
    db,
    formatarResultados,
    verificarColunas
};