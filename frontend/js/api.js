// frontend/js/api.js - VERSÃO 100% CORRETA
class FinanceAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        console.log(`📊 Conectando à API em: ${this.baseURL || 'mesma origem'}`);
    }

    async request(endpoint, method = 'GET', data = null) {
        const url = this.baseURL + endpoint;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success && result.error) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            
            this.showNotification(
                `Erro na conexão: ${error.message}`,
                'error'
            );
            
            throw error;
        }
    }

    // ===== DASHBOARD =====
    async getDashboardStats() {
        return this.request('/api/dashboard/stats', 'GET');
    }

    async getDashboardCharts() {
        return this.request('/api/dashboard/charts', 'GET');
    }

    async getDashboardStatus() {
        return this.request('/api/dashboard/status', 'GET');
    }

    async getHealth() {
        return this.request('/health', 'GET');
    }

    // ===== TRANSAÇÕES =====
    async getTransactions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/api/transactions${queryString ? '?' + queryString : ''}`;
        return this.request(endpoint, 'GET');
    }

    async addTransaction(transaction) {
        return this.request('/api/transactions', 'POST', transaction);
    }

    async getCategories() {
        return this.request('/api/transactions/categories', 'GET');
    }

    async getPaymentMethods() {
        return this.request('/api/transactions/payment-methods', 'GET');
    }

    // ===== UTILITÁRIOS =====
    formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    }

    formatPaymentMethod(method) {
        const methods = {
            'pix': 'PIX',
            'dinheiro': 'Dinheiro',
            'credito': 'Cartão de Crédito',
            'debito': 'Cartão de Débito',
            'transferencia': 'Transferência',
            'boleto': 'Boleto',
            'outro': 'Outro'
        };
        return methods[method?.toLowerCase()] || method || 'Outro';
    }

    formatCategory(category) {
        const categories = {
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'moradia': 'Moradia',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'vestuario': 'Vestuário',
            'trabalho': 'Trabalho',
            'outros': 'Outros'
        };
        return categories[category?.toLowerCase()] || category || 'Outros';
    }

    getCategoryIcon(category) {
        const icons = {
            'alimentacao': 'fas fa-utensils',
            'transporte': 'fas fa-car',
            'moradia': 'fas fa-home',
            'lazer': 'fas fa-film',
            'saude': 'fas fa-heartbeat',
            'educacao': 'fas fa-graduation-cap',
            'vestuario': 'fas fa-tshirt',
            'trabalho': 'fas fa-briefcase',
            'outros': 'fas fa-ellipsis-h'
        };
        return icons[category?.toLowerCase()] || 'fas fa-ellipsis-h';
    }

    getTypeIcon(type) {
        return type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up';
    }

    getTypeColor(type) {
        return type === 'income' ? 'success' : 'danger';
    }

    getTypeLabel(type) {
        return type === 'income' ? 'Receita' : 'Despesa';
    }

    // ===== NOTIFICAÇÕES =====
    showNotification(message, type = 'info', duration = 5000) {
        const existing = document.querySelector('.api-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `api-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        const autoClose = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoClose);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // ===== CACHE =====
    clearCache() {
        console.log('✅ Cache limpo');
        return true;
    }

    // ===== VALIDAÇÃO =====
    validateTransaction(transaction) {
        const errors = [];

        if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
            errors.push('Tipo deve ser "income" ou "expense"');
        }

        if (!transaction.amount || isNaN(parseFloat(transaction.amount)) || parseFloat(transaction.amount) <= 0) {
            errors.push('Valor deve ser um número positivo');
        }

        if (!transaction.date) {
            errors.push('Data é obrigatória');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async getStats() {
        return this.getDashboardStats();
    }

    async getSystemStatus() {
        return this.getDashboardStatus();
    }

    async deleteTransaction(id) {
        return this.request(`/api/transactions/${id}`, 'DELETE');
    }
}

// Criar instância global
window.financeAPI = new FinanceAPI();