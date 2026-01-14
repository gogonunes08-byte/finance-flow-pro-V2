// frontend/js/transactions.js - Gerenciamento da tabela de transações

class FinanceTransactions {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalTransactions = 0;
        this.itemsPerPage = 15;
        this.transactions = [];
        this.sortField = 'date';
        this.sortDirection = 'desc';
        
        this.initializeTable();
        this.setupEventListeners();
    }

    // Inicializar tabela
    initializeTable() {
        // Carregar transações iniciais
        this.loadTransactions();
        
        // Atualizar informações da tabela
        this.updateTableInfo();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Paginação
        document.getElementById('btn-prev')?.addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('btn-next')?.addEventListener('click', () => {
            this.nextPage();
        });

        // Ordenação
        document.querySelectorAll('#transactions-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                this.sortTable(field);
            });
        });

        // Atualização manual
        document.getElementById('btn-refresh')?.addEventListener('click', () => {
            this.refresh();
        });

        // Exportação
        document.getElementById('btn-export')?.addEventListener('click', () => {
            this.exportToCSV();
        });

        // Filtros alterados
        document.addEventListener('filtersChanged', (e) => {
            this.loadTransactions(1, e.detail.filters);
        });
    }

    // Carregar transações
    async loadTransactions(page = 1, filters = {}) {
        try {
            // Mostrar loading
            this.showLoading();
            
            // Carregar dados
            const data = await financeAPI.getCachedTransactions({
                ...filters,
                page: page,
                limit: this.itemsPerPage
            });
            
            if (data.success) {
                this.transactions = data.data;
                this.currentPage = data.pagination.page;
                this.totalPages = data.pagination.pages;
                this.totalTransactions = data.pagination.total;
                
                // Renderizar tabela
                this.renderTable();
                
                // Atualizar informações
                this.updateTableInfo();
                this.updatePagination();
                
                // Atualizar totais no dashboard
                this.updateDashboardTotals(data.totals);
                
                // Esconder loading
                this.hideLoading();
                
                return data;
            }
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
            this.showEmptyState('Erro ao carregar transações');
        }
    }

    // Renderizar tabela
    renderTable() {
        const tbody = document.getElementById('transactions-body');
        if (!tbody) return;
        
        if (this.transactions.length === 0) {
            this.showEmptyState('Nenhuma transação encontrada');
            return;
        }
        
        // Ordenar transações
        const sortedTransactions = this.sortTransactions([...this.transactions]);
        
        // Gerar HTML da tabela
        const html = sortedTransactions.map(transaction => this.createTransactionRow(transaction)).join('');
        
        tbody.innerHTML = html;
        
        // Adicionar event listeners para as linhas
        this.addRowEventListeners();
    }

    // Criar linha da tabela para uma transação
    createTransactionRow(transaction) {
        const typeClass = transaction.type === 'income' ? 'type-income' : 'type-expense';
        const typeIcon = transaction.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
        const typeText = transaction.type === 'income' ? 'Entrada' : 'Saída';
        
        const categoryIcon = financeAPI.getCategoryIcon(transaction.category);
        const formattedDate = financeAPI.formatDate(transaction.date);
        const formattedAmount = financeAPI.formatCurrency(transaction.amount);
        const paymentMethod = financeAPI.formatPaymentMethod(transaction.payment_method);
        
        return `
            <tr data-id="${transaction.id}" class="transaction-row">
                <td>
                    <div class="transaction-date">${formattedDate}</div>
                    <small class="transaction-time">${transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                </td>
                <td>
                    <div class="transaction-description">${transaction.description || 'Sem descrição'}</div>
                    ${transaction.source === 'whatsapp' ? '<span class="source-badge"><i class="fab fa-whatsapp"></i> WhatsApp</span>' : ''}
                </td>
                <td>
                    <span class="category-badge">
                        ${categoryIcon} ${transaction.category}
                    </span>
                </td>
                <td>
                    <span class="type-badge ${typeClass}">
                        <i class="fas ${typeIcon}"></i> ${typeText}
                    </span>
                </td>
                <td>
                    <div class="transaction-amount ${transaction.type}">
                        ${formattedAmount}
                    </div>
                </td>
                <td>
                    <span class="payment-badge">
                        <i class="fas fa-${this.getPaymentIcon(transaction.payment_method)}"></i> ${paymentMethod}
                    </span>
                </td>
                <td>
                    <div class="transaction-actions">
                        <button class="btn-icon btn-view" data-id="${transaction.id}" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-edit" data-id="${transaction.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" data-id="${transaction.id}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Obter ícone para forma de pagamento
    getPaymentIcon(method) {
        const icons = {
            'pix': 'qrcode',
            'dinheiro': 'money-bill-wave',
            'credito': 'credit-card',
            'debito': 'credit-card',
            'outro': 'wallet'
        };
        return icons[method] || 'credit-card';
    }

    // Adicionar event listeners para as linhas
    addRowEventListeners() {
        // Visualizar transação
        document.querySelectorAll('.btn-view').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.viewTransaction(id);
            });
        });
        
        // Editar transação
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editTransaction(id);
            });
        });
        
        // Excluir transação
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteTransaction(id);
            });
        });
        
        // Clicar na linha (visualização rápida)
        document.querySelectorAll('.transaction-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.transaction-actions')) {
                    const id = row.dataset.id;
                    this.viewTransaction(id);
                }
            });
        });
    }

    // Visualizar transação
    async viewTransaction(id) {
        try {
            const transaction = this.transactions.find(t => t.id == id);
            if (!transaction) return;
            
            this.showTransactionModal(transaction, 'view');
        } catch (error) {
            console.error('Erro ao visualizar transação:', error);
            financeAPI.showNotification('Erro ao visualizar transação', 'error');
        }
    }

    // Editar transação
    async editTransaction(id) {
        try {
            const transaction = this.transactions.find(t => t.id == id);
            if (!transaction) return;
            
            this.showTransactionModal(transaction, 'edit');
        } catch (error) {
            console.error('Erro ao editar transação:', error);
            financeAPI.showNotification('Erro ao editar transação', 'error');
        }
    }

    // Excluir transação
    async deleteTransaction(id) {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) {
            return;
        }
        
        try {
            const result = await financeAPI.deleteTransaction(id);
            
            if (result.success) {
                financeAPI.showNotification('Transação excluída com sucesso', 'success');
                financeAPI.clearCache(); // Limpar cache
                this.loadTransactions(this.currentPage, financeFilters.getFilters());
            }
        } catch (error) {
            console.error('Erro ao excluir transação:', error);
            financeAPI.showNotification('Erro ao excluir transação', 'error');
        }
    }

    // Mostrar modal de transação
    showTransactionModal(transaction, mode = 'view') {
        const modal = document.getElementById('transaction-modal');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !modalBody) return;
        
        const typeText = transaction.type === 'income' ? 'Entrada' : 'Saída';
        const formattedDate = financeAPI.formatDate(transaction.date);
        const formattedAmount = financeAPI.formatCurrency(transaction.amount);
        const categoryIcon = financeAPI.getCategoryIcon(transaction.category);
        const paymentMethod = financeAPI.formatPaymentMethod(transaction.payment_method);
        
        modalBody.innerHTML = `
            <div class="transaction-details">
                <div class="detail-row">
                    <span class="detail-label">Data:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Descrição:</span>
                    <span class="detail-value">${transaction.description || 'Sem descrição'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tipo:</span>
                    <span class="detail-value type-${transaction.type}">${typeText}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Categoria:</span>
                    <span class="detail-value">${categoryIcon} ${transaction.category}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Valor:</span>
                    <span class="detail-value amount-${transaction.type}">${formattedAmount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Forma de Pagamento:</span>
                    <span class="detail-value">${paymentMethod}</span>
                </div>
                ${transaction.source ? `
                <div class="detail-row">
                    <span class="detail-label">Origem:</span>
                    <span class="detail-value">${transaction.source === 'whatsapp' ? '<i class="fab fa-whatsapp"></i> WhatsApp' : 'Web'}</span>
                </div>` : ''}
                ${transaction.created_at ? `
                <div class="detail-row">
                    <span class="detail-label">Criado em:</span>
                    <span class="detail-value">${financeAPI.formatDateTime(transaction.created_at)}</span>
                </div>` : ''}
            </div>
            
            ${mode === 'edit' ? `
            <div class="modal-actions">
                <button class="btn btn-primary" id="btn-save-edit">
                    <i class="fas fa-save"></i> Salvar Alterações
                </button>
                <button class="btn btn-secondary" id="btn-cancel-edit">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            ` : ''}
        `;
        
        modal.style.display = 'flex';
        
        // Fechar modal
        document.getElementById('modal-close').onclick = () => {
            modal.style.display = 'none';
        };
        
        // Fechar ao clicar fora
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

    // Ordenar transações
    sortTransactions(transactions) {
        return transactions.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            // Converter datas para comparação
            if (this.sortField === 'date' || this.sortField === 'created_at') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            // Converter valores numéricos
            if (this.sortField === 'amount') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }
            
            // Ordenar
            if (this.sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    // Ordenar tabela por campo
    sortTable(field) {
        // Alternar direção se for o mesmo campo
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'desc';
        }
        
        // Atualizar indicadores visuais
        this.updateSortIndicators();
        
        // Re-renderizar tabela
        this.renderTable();
    }

    // Atualizar indicadores de ordenação
    updateSortIndicators() {
        // Remover todos os indicadores
        document.querySelectorAll('#transactions-table th i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        // Adicionar indicador no campo atual
        const currentTh = document.querySelector(`#transactions-table th[data-sort="${this.sortField}"]`);
        if (currentTh) {
            const icon = currentTh.querySelector('i');
            if (icon) {
                icon.className = this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            }
        }
    }

    // Página anterior
    previousPage() {
        if (this.currentPage > 1) {
            this.loadTransactions(this.currentPage - 1, financeFilters.getFilters());
        }
    }

    // Próxima página
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.loadTransactions(this.currentPage + 1, financeFilters.getFilters());
        }
    }

    // Atualizar informações da tabela
    updateTableInfo() {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalTransactions);
        
        const infoElement = document.getElementById('table-info');
        if (infoElement) {
            infoElement.textContent = `Mostrando ${start}-${end} de ${this.totalTransactions} transações`;
        }
        
        const pageInfoElement = document.getElementById('page-info');
        if (pageInfoElement) {
            pageInfoElement.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        }
    }

    // Atualizar controles de paginação
    updatePagination() {
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
    }

    // Atualizar totais do dashboard
    updateDashboardTotals(totals) {
        if (!totals) return;
        
        // Atualizar cards de estatísticas
        const totalIncome = document.getElementById('total-income');
        const totalExpense = document.getElementById('total-expense');
        const totalBalance = document.getElementById('total-balance');
        const totalTransactions = document.getElementById('total-transactions');
        
        if (totalIncome) totalIncome.textContent = financeAPI.formatCurrency(totals.income || 0);
        if (totalExpense) totalExpense.textContent = financeAPI.formatCurrency(totals.expense || 0);
        if (totalBalance) totalBalance.textContent = financeAPI.formatCurrency(totals.balance || 0);
        if (totalTransactions) totalTransactions.textContent = this.totalTransactions;
    }

    // Mostrar estado de loading
    showLoading() {
        const loadingElement = document.getElementById('table-loading');
        const emptyElement = document.getElementById('table-empty');
        const tableBody = document.getElementById('transactions-body');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (emptyElement) emptyElement.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';
    }

    // Esconder loading
    hideLoading() {
        const loadingElement = document.getElementById('table-loading');
        if (loadingElement) loadingElement.style.display = 'none';
    }

    // Mostrar estado vazio
    showEmptyState(message = 'Nenhuma transação encontrada') {
        const emptyElement = document.getElementById('table-empty');
        const tableBody = document.getElementById('transactions-body');
        const loadingElement = document.getElementById('table-loading');
        
        if (emptyElement) {
            emptyElement.innerHTML = `
                <i class="fas fa-inbox"></i>
                <p>${message}</p>
            `;
            emptyElement.style.display = 'block';
        }
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';
    }

    // Atualizar/recarregar
    async refresh() {
        financeAPI.clearCache();
        await this.loadTransactions(this.currentPage, financeFilters.getFilters());
        financeAPI.showNotification('Transações atualizadas', 'success');
    }

    // Exportar para CSV
    async exportToCSV() {
        try {
            const allData = await financeAPI.getTransactions({
                ...financeFilters.getFilters(),
                limit: 10000 // Pegar todas
            });
            
            if (allData.success && allData.data.length > 0) {
                const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Forma de Pagamento', 'Origem'];
                const rows = allData.data.map(t => [
                    t.date,
                    t.type === 'income' ? 'Entrada' : 'Saída',
                    t.category,
                    `"${(t.description || '').replace(/"/g, '""')}"`,
                    t.amount.toString().replace('.', ','),
                    financeAPI.formatPaymentMethod(t.payment_method),
                    t.source || 'web'
                ]);
                
                const csvContent = [
                    headers.join(';'),
                    ...rows.map(row => row.join(';'))
                ].join('\n');
                
                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(url);
                
                financeAPI.showNotification('CSV exportado com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            financeAPI.showNotification('Erro ao exportar CSV', 'error');
        }
    }
}

// Instância global das transações
const financeTransactions = new FinanceTransactions();