// frontend/js/filters.js - Gerenciamento de filtros

class FinanceFilters {
    constructor() {
        this.currentFilters = {};
        this.availableCategories = [];
        this.availablePaymentMethods = [];
        
        this.initializeFilters();
        this.setupEventListeners();
    }

    // Inicializar filtros
    async initializeFilters() {
        try {
            // Carregar categorias disponíveis
            const categoriesData = await financeAPI.getCategories();
            if (categoriesData.success) {
                this.availableCategories = categoriesData.data;
                this.populateCategoryFilter();
            }

            // Carregar formas de pagamento
            const paymentData = await financeAPI.getPaymentMethods();
            if (paymentData.success) {
                this.availablePaymentMethods = paymentData.data;
                this.populatePaymentFilter();
            }
        } catch (error) {
            console.error('Erro ao carregar filtros:', error);
        }
    }

    // Popular filtro de categorias
    populateCategoryFilter() {
        const select = document.getElementById('filter-category');
        if (!select) return;

        // Limpar opções existentes (exceto a primeira)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Adicionar categorias
        this.availableCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category;
            option.textContent = `${category.category} (${category.count})`;
            select.appendChild(option);
        });
    }

    // Popular filtro de formas de pagamento
    populatePaymentFilter() {
        const select = document.getElementById('filter-payment');
        if (!select) return;

        while (select.options.length > 1) {
            select.remove(1);
        }

        this.availablePaymentMethods.forEach(method => {
            const option = document.createElement('option');
            option.value = method.payment_method;
            option.textContent = `${financeAPI.formatPaymentMethod(method.payment_method)} (${method.count})`;
            select.appendChild(option);
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Aplicar filtros
        document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Limpar filtros
        document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Busca em tempo real
        const searchInput = document.getElementById('filter-search');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.applyFilters();
                }, 500);
            });
        }

        // Filtros de período
        const periodSelect = document.getElementById('filter-date');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    this.showCustomDatePicker();
                } else {
                    this.applyFilters();
                }
            });
        }

        // Filtros de tipo e categoria
        document.getElementById('filter-type')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filter-category')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filter-payment')?.addEventListener('change', () => {
            this.applyFilters();
        });
    }

    // Aplicar filtros
    async applyFilters() {
        const filters = this.getCurrentFilters();
        
        // Atualizar estado
        this.currentFilters = filters;
        
        // Disparar evento de filtros alterados
        this.dispatchFilterChange(filters);
        
        // Mostrar filtros ativos
        this.showActiveFilters();
        
        // Carregar transações com filtros
        await financeTransactions.loadTransactions(1, filters);
        
        // Atualizar gráficos com filtros
        await financeCharts.refresh();
        
        financeAPI.showNotification('Filtros aplicados', 'success');
    }

    // Limpar todos os filtros
    clearFilters() {
        // Resetar selects
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-payment').value = '';
        document.getElementById('filter-date').value = '';
        document.getElementById('filter-search').value = '';
        
        // Limpar filtros personalizados se existirem
        const customDateContainer = document.getElementById('custom-date-container');
        if (customDateContainer) {
            customDateContainer.remove();
        }
        
        // Aplicar filtros limpos
        this.applyFilters();
        
        financeAPI.showNotification('Filtros limpos', 'info');
    }

    // Obter filtros atuais do formulário
    getCurrentFilters() {
        const filters = {};
        
        // Tipo (income/expense)
        const type = document.getElementById('filter-type').value;
        if (type) filters.type = type;
        
        // Categoria
        const category = document.getElementById('filter-category').value;
        if (category) filters.category = category;
        
        // Forma de pagamento
        const payment = document.getElementById('filter-payment').value;
        if (payment) filters.payment_method = payment;
        
        // Período
        const period = document.getElementById('filter-date').value;
        if (period && period !== 'custom') {
            this.applyPeriodFilter(filters, period);
        }
        
        // Busca por texto
        const search = document.getElementById('filter-search').value.trim();
        if (search) filters.search = search;
        
        return filters;
    }

    // Aplicar filtro de período
    applyPeriodFilter(filters, period) {
        const today = new Date();
        
        switch(period) {
            case 'today':
                const todayStr = today.toISOString().split('T')[0];
                filters.start_date = todayStr;
                filters.end_date = todayStr;
                break;
                
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                filters.start_date = weekAgo.toISOString().split('T')[0];
                filters.end_date = today.toISOString().split('T')[0];
                break;
                
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                filters.start_date = monthAgo.toISOString().split('T')[0];
                filters.end_date = today.toISOString().split('T')[0];
                break;
                
            case 'current-month':
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                filters.start_date = firstDay.toISOString().split('T')[0];
                filters.end_date = today.toISOString().split('T')[0];
                break;
        }
    }

    // Mostrar seletor de datas personalizado
    showCustomDatePicker() {
        // Remover se já existir
        const existingContainer = document.getElementById('custom-date-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Criar container
        const container = document.createElement('div');
        container.id = 'custom-date-container';
        container.className = 'custom-date-container';
        container.innerHTML = `
            <div class="date-inputs">
                <div class="date-group">
                    <label for="custom-start-date">Data Inicial</label>
                    <input type="date" id="custom-start-date" class="filter-input">
                </div>
                <div class="date-group">
                    <label for="custom-end-date">Data Final</label>
                    <input type="date" id="custom-end-date" class="filter-input">
                </div>
                <button class="btn btn-primary" id="btn-apply-custom-date">
                    <i class="fas fa-check"></i> Aplicar
                </button>
            </div>
        `;
        
        // Inserir após o select de período
        const periodSelect = document.getElementById('filter-date');
        periodSelect.parentNode.appendChild(container);
        
        // Configurar data inicial padrão (30 dias atrás)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        document.getElementById('custom-start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('custom-end-date').value = endDate.toISOString().split('T')[0];
        
        // Event listener para aplicar datas personalizadas
        document.getElementById('btn-apply-custom-date').addEventListener('click', () => {
            const startDate = document.getElementById('custom-start-date').value;
            const endDate = document.getElementById('custom-end-date').value;
            
            if (startDate && endDate) {
                const filters = this.getCurrentFilters();
                filters.start_date = startDate;
                filters.end_date = endDate;
                this.currentFilters = filters;
                this.dispatchFilterChange(filters);
                financeTransactions.loadTransactions(1, filters);
            }
        });
    }

    // Mostrar filtros ativos
    showActiveFilters() {
        const activeFilters = Object.entries(this.currentFilters)
            .filter(([key, value]) => value && !['page', 'limit'].includes(key))
            .map(([key, value]) => {
                let label = key;
                let displayValue = value;
                
                // Traduzir chaves
                const translations = {
                    'type': 'Tipo',
                    'category': 'Categoria',
                    'payment_method': 'Pagamento',
                    'start_date': 'Data inicial',
                    'end_date': 'Data final',
                    'search': 'Busca'
                };
                
                label = translations[key] || key;
                
                // Formatar valores
                if (key === 'type') {
                    displayValue = value === 'income' ? 'Entrada' : 'Saída';
                } else if (key === 'payment_method') {
                    displayValue = financeAPI.formatPaymentMethod(value);
                }
                
                return { label, value: displayValue };
            });
        
        // Atualizar UI com filtros ativos
        this.updateActiveFiltersUI(activeFilters);
    }

    // Atualizar UI dos filtros ativos
    updateActiveFiltersUI(filters) {
        const container = document.getElementById('active-filters');
        if (!container) return;
        
        if (filters.length === 0) {
            container.innerHTML = '<p class="no-filters">Nenhum filtro ativo</p>';
            return;
        }
        
        const html = filters.map(filter => `
            <div class="active-filter">
                <span class="filter-label">${filter.label}:</span>
                <span class="filter-value">${filter.value}</span>
                <button class="filter-remove" data-filter="${filter.label.toLowerCase()}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Adicionar event listeners para remover filtros
        document.querySelectorAll('.filter-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const filterKey = e.target.closest('.filter-remove').dataset.filter;
                this.removeFilter(filterKey);
            });
        });
    }

    // Remover filtro específico
    removeFilter(filterKey) {
        const translations = {
            'tipo': 'type',
            'categoria': 'category',
            'pagamento': 'payment_method',
            'data inicial': 'start_date',
            'data final': 'end_date',
            'busca': 'search'
        };
        
        const actualKey = translations[filterKey];
        if (actualKey && this.currentFilters[actualKey]) {
            delete this.currentFilters[actualKey];
            
            // Atualizar UI
            const select = document.getElementById(`filter-${actualKey}`);
            if (select) select.value = '';
            
            const input = document.getElementById(`filter-${actualKey}`);
            if (input) input.value = '';
            
            // Reaplicar filtros
            this.applyFilters();
        }
    }

    // Disparar evento de alteração de filtros
    dispatchFilterChange(filters) {
        const event = new CustomEvent('filtersChanged', {
            detail: { filters }
        });
        document.dispatchEvent(event);
    }

    // Obter filtros atuais (para uso externo)
    getFilters() {
        return { ...this.currentFilters };
    }

    // Atualizar filtros programaticamente
    setFilter(key, value) {
        this.currentFilters[key] = value;
        this.applyFilters();
    }
}

// Instância global dos filtros
const financeFilters = new FinanceFilters();