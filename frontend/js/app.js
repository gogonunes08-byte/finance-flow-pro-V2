// frontend/js/app.js - Aplicação principal

class FinanceFlowApp {
    constructor() {
        this.isInitialized = false;
        this.autoRefreshInterval = null;
        this.systemStatus = {
            api: 'unknown',
            database: 'unknown',
            lastUpdate: null
        };
    }

    // Inicializar aplicação
    async initialize() {
        console.log('🚀 Inicializando Finance Flow Pro Dashboard...');
        
        try {
            // 1. Verificar conexão com a API
            await this.checkAPIHealth();
            
            // 2. Configurar event listeners globais
            this.setupGlobalEventListeners();
            
            // 3. Inicializar módulos
            await this.initializeModules();
            
            // 4. Carregar dados iniciais
            await this.loadInitialData();
            
            // 5. Configurar atualização automática
            this.setupAutoRefresh();
            
            // 6. Atualizar UI
            this.updateUI();
            
            this.isInitialized = true;
            console.log('✅ Finance Flow Pro inicializado com sucesso!');
            
            // Notificação de boas-vindas
            financeAPI.showNotification('Dashboard carregado com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar aplicação:', error);
            this.showErrorState('Falha ao inicializar o dashboard');
        }
    }

    // Verificar saúde da API
    async checkAPIHealth() {
    try {
        // Tenta a rota /health primeiro
        const health = await financeAPI.getHealth();
        this.systemStatus.api = 'healthy';
        this.systemStatus.lastUpdate = new Date();
        
        console.log('🏥 API Health:', health);
        return true;
    } catch (error) {
        console.log('⚠️ Rota /health não encontrada, tentando fallback...');
        
        // Fallback: tenta acessar a API de transações
        try {
            const test = await fetch('/api/transactions?limit=1');
            if (test.ok) {
                this.systemStatus.api = 'healthy';
                this.systemStatus.lastUpdate = new Date();
                console.log('✅ API funcional (fallback)');
                return true;
            }
            throw new Error('API não responde');
        } catch (fallbackError) {
            this.systemStatus.api = 'unhealthy';
            console.error('❌ API não responde:', error);
            
            // Notificação mais amigável
            setTimeout(() => {
                financeAPI.showNotification(
                    'Conectado ao servidor, mas algumas rotas podem não estar disponíveis',
                    'warning'
                );
            }, 1000);
            
            return false; // Mas não bloqueia a inicialização
        }
    }
}

    // Configurar event listeners globais
    setupGlobalEventListeners() {
        // Atualização manual
        const refreshBtn = document.getElementById('btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAll());
        }
        
        // Exportar dados
        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => financeTransactions.exportToCSV());
        }
        
        // Alternar tema
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
        
        // Atualizar hora atual
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000); // Atualizar a cada minuto
    }

    // Inicializar módulos
    async initializeModules() {
        // Os módulos já são inicializados automaticamente em seus construtores
        // Esta função é para garantir a ordem se necessário
        console.log('🔧 Inicializando módulos...');
        
        // 1. API já está inicializada
        // 2. Filtros já estão inicializando
        // 3. Transações já estão inicializando
        // 4. Gráficos serão inicializados após os dados
        
        // Aguardar filtros carregarem
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Carregar dados iniciais
    async loadInitialData() {
    try {
        console.log('📊 Carregando dados iniciais...');
        
        // Carregar estatísticas
        const stats = await financeAPI.getDashboardStats();
        if (stats.success) {
            this.updateStats(stats.stats);
        }
        
        // ✅ CORREÇÃO AQUI - Mude esta linha:
        await financeCharts.init(); // ← ERA .initialize()
        
        // Carregar transações
        await this.loadTransactions();
        
        console.log('✅ Dados iniciais carregados');
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        financeAPI.showNotification('Erro ao carregar dados do dashboard', 'error');
        return false;
    }
}

    // Carregar estatísticas
    async loadStats() {
        try {
            const stats = await financeAPI.getStats();
            
            if (stats.success) {
                this.updateStatsCards(stats.stats);
                this.updateRecentTransactions(stats.recent_transactions);
                this.updateTopCategories(stats.top_categories);
                
                // Atualizar última sincronização
                this.updateLastSync();
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // Atualizar cards de estatísticas
    updateStatsCards(stats) {
        // Estes são atualizados automaticamente pelo financeTransactions
        // Esta função é para dados adicionais
        
        // Atualizar tendências
        this.updateTrends(stats);
    }

    // Atualizar tendências
    updateTrends(stats) {
        const incomeTrend = document.getElementById('income-trend');
        const expenseTrend = document.getElementById('expense-trend');
        const balanceTrend = document.getElementById('balance-trend');
        const transactionsTrend = document.getElementById('transactions-trend');
        
        if (incomeTrend) {
            const todayIncome = stats.today?.income || 0;
            incomeTrend.innerHTML = `
                <i class="fas fa-calendar-day"></i>
                <span>Hoje: ${financeAPI.formatCurrency(todayIncome)}</span>
            `;
        }
        
        if (expenseTrend) {
            const todayExpense = stats.today?.expense || 0;
            expenseTrend.innerHTML = `
                <i class="fas fa-calendar-day"></i>
                <span>Hoje: ${financeAPI.formatCurrency(todayExpense)}</span>
            `;
        }
        
        if (balanceTrend) {
            const monthBalance = (stats.month?.income || 0) - (stats.month?.expense || 0);
            balanceTrend.innerHTML = `
                <i class="fas fa-chart-line"></i>
                <span>Este mês: ${financeAPI.formatCurrency(monthBalance)}</span>
            `;
        }
        
        if (transactionsTrend) {
            const todayCount = stats.today?.count || 0;
            transactionsTrend.innerHTML = `
                <i class="fas fa-calendar-day"></i>
                <span>Hoje: ${todayCount}</span>
            `;
        }
    }

    // Atualizar transações recentes (mini-visualização)
    updateRecentTransactions(transactions) {
        // Esta é uma visualização alternativa/adicional
        // A tabela principal é gerenciada pelo financeTransactions
        
        if (!transactions || transactions.length === 0) return;
        
        const container = document.getElementById('recent-transactions-mini');
        if (!container) return;
        
        const html = transactions.slice(0, 5).map(transaction => `
            <div class="mini-transaction">
                <div class="mini-transaction-icon">
                    <i class="fas fa-${transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i>
                </div>
                <div class="mini-transaction-details">
                    <div class="mini-transaction-description">${transaction.description || 'Sem descrição'}</div>
                    <div class="mini-transaction-info">
                        <span class="mini-transaction-category">${transaction.category}</span>
                        <span class="mini-transaction-amount ${transaction.type}">
                            ${financeAPI.formatCurrency(transaction.amount)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    // Atualizar categorias principais
    updateTopCategories(categories) {
        if (!categories || categories.length === 0) return;
        
        const container = document.getElementById('top-categories-mini');
        if (!container) return;
        
        const html = categories.map(category => `
            <div class="top-category">
                <div class="top-category-name">
                    <span class="category-icon">${financeAPI.getCategoryIcon(category.category)}</span>
                    <span>${category.category}</span>
                </div>
                <div class="top-category-stats">
                    <span class="top-category-amount">${financeAPI.formatCurrency(category.total)}</span>
                    <span class="top-category-count">(${category.count}x)</span>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    // Atualizar status do sistema
    async updateSystemStatus() {
        try {
            const status = await financeAPI.getSystemStatus();
            
            if (status.success) {
                this.systemStatus = {
                    api: 'healthy',
                    database: status.database.connected ? 'connected' : 'disconnected',
                    transactions: status.database.transactions,
                    lastUpdate: new Date()
                };
                
                this.updateSystemStatusUI();
            }
        } catch (error) {
            this.systemStatus.api = 'unhealthy';
            this.updateSystemStatusUI();
        }
    }

    // Atualizar UI do status do sistema
    updateSystemStatusUI() {
        const systemStatusElement = document.getElementById('system-status');
        const dbCountElement = document.getElementById('db-count');
        
        if (systemStatusElement) {
            systemStatusElement.textContent = this.systemStatus.api === 'healthy' ? 'Online' : 'Offline';
            systemStatusElement.className = this.systemStatus.api === 'healthy' ? 'status-online' : 'status-offline';
        }
        
        if (dbCountElement) {
            dbCountElement.textContent = this.systemStatus.transactions || '0';
        }
    }

    // Atualizar última sincronização
    updateLastSync() {
        const lastSyncElement = document.getElementById('last-sync');
        const lastUpdateElement = document.getElementById('last-update');
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (lastSyncElement) {
            lastSyncElement.textContent = timeString;
        }
        
        if (lastUpdateElement) {
            lastUpdateElement.querySelector('.time').textContent = timeString;
        }
        
        this.systemStatus.lastUpdate = now;
    }

    // Atualizar hora atual
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const dateString = now.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        // Atualizar em algum elemento se existir
        const currentTimeElement = document.getElementById('current-time');
        if (currentTimeElement) {
            currentTimeElement.textContent = `${dateString} - ${timeString}`;
        }
    }

    // Configurar atualização automática
    setupAutoRefresh() {
        // Limpar intervalo anterior se existir
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        // Configurar novo intervalo (a cada 30 segundos)
        this.autoRefreshInterval = setInterval(() => {
            this.autoRefresh();
        }, 30000);
        
        console.log('🔄 Atualização automática configurada (30s)');
    }

    // Atualização automática
    async autoRefresh() {
        if (this.systemStatus.api !== 'healthy') {
            console.log('⚠️ Pulando atualização automática - API não está saudável');
            return;
        }
        
        try {
            console.log('🔄 Executando atualização automática...');
            
            // Atualizar dados básicos
            await this.loadStats();
            
            // Atualizar transações se necessário
            await financeTransactions.refresh();
            
            // Atualizar status
            await this.updateSystemStatus();
            
            // Atualizar UI
            this.updateLastSync();
            
            console.log('✅ Atualização automática concluída');
            
        } catch (error) {
            console.error('❌ Erro na atualização automática:', error);
        }
    }

    // Atualizar toda a aplicação
    async refreshAll() {
        console.log('🔄 Atualizando toda a aplicação...');
        
        try {
            // Limpar caches
            financeAPI.clearCache();
            
            // Recarregar tudo
            await this.loadInitialData();
            
            // Atualizar UI
            this.updateUI();
            
            // Atualizar última sincronização
            this.updateLastSync();
            
            financeAPI.showNotification('Aplicação atualizada com sucesso', 'success');
            
            console.log('✅ Aplicação atualizada');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar aplicação:', error);
            financeAPI.showNotification('Erro ao atualizar aplicação', 'error');
        }
    }

    // Atualizar UI geral
    updateUI() {
        // Atualizar tema atual
        this.updateThemeUI();
        
        // Atualizar status
        this.updateSystemStatusUI();
        
        // Atualizar hora
        this.updateCurrentTime();
    }

    // Alternar tema claro/escuro
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('finance-flow-theme', newTheme);
        
        this.updateThemeUI();
        
        financeAPI.showNotification(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info');
    }

    // Atualizar UI do tema
    updateThemeUI() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const themeToggle = document.querySelector('.theme-toggle');
        
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            themeToggle.title = `Alternar para tema ${currentTheme === 'dark' ? 'claro' : 'escuro'}`;
        }
    }

    // Fechar modal aberto
    closeModal() {
        const modal = document.getElementById('transaction-modal');
        if (modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    }

    // Mostrar estado de erro
    showErrorState(message) {
        const container = document.querySelector('.container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Ops! Algo deu errado</h2>
                <p>${message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" id="btn-retry">
                        <i class="fas fa-redo"></i> Tentar novamente
                    </button>
                    <button class="btn btn-secondary" id="btn-check-api">
                        <i class="fas fa-server"></i> Verificar API
                    </button>
                </div>
                <div class="error-details">
                    <p><small>Certifique-se de que o servidor backend está rodando em http://localhost:3000</small></p>
                </div>
            </div>
        `;
        
        // Adicionar event listeners
        document.getElementById('btn-retry').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('btn-check-api').addEventListener('click', async () => {
            const isHealthy = await this.checkAPIHealth();
            if (isHealthy) {
                location.reload();
            }
        });
    }

    // Destruir aplicação (limpeza)
    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        financeCharts.destroy();
        
        console.log('👋 Finance Flow Pro finalizado');
    }
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    // Criar instância da aplicação
    window.financeFlowApp = new FinanceFlowApp();
    
    // Inicializar tema salvo
    const savedTheme = localStorage.getItem('finance-flow-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Inicializar aplicação
    try {
        await window.financeFlowApp.initialize();
    } catch (error) {
        console.error('Falha crítica na inicialização:', error);
    }
});

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.financeFlowApp) {
        window.financeFlowApp.destroy();
    }
});

// Expor para debugging
console.log('💰 Finance Flow Pro v2.0 - Backend Modularizado');
console.log('📊 Dashboard profissional carregado');