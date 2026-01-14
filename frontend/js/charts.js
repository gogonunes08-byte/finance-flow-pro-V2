// charts.js - VERSÃO COMPLETA E FUNCIONAL
class FinanceCharts {
    constructor() {
        this.pieChart = null;
        this.barChart = null;
        this.lineChart = null;
        this.isDarkTheme = false;
        console.log('📊 FinanceCharts inicializado');
    }

    // Método PRINCIPAL de inicialização (o app.js chama este)
    async init() {
        try {
            console.log('📊 Carregando dados para gráficos...');
            const response = await fetch('/api/dashboard/charts');
            
            if (!response.ok) {
                throw new Error(`API respondeu com ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderPieChart(data.pie || []);
                this.renderBarChart(data.bar || []);
                this.renderPaymentMethods(data);
                console.log('✅ Gráficos renderizados com sucesso');
                return true;
            } else {
                throw new Error(data.error || 'Erro na API');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar gráficos:', error);
            
            // Mostra mensagens amigáveis no lugar dos gráficos
            this.showErrorMessage('pie-chart-container', 'Não foi possível carregar gráfico de categorias');
            this.showErrorMessage('bar-chart-container', 'Não foi possível carregar gráfico mensal');
            this.showErrorMessage('payment-methods', 'Não foi possível carregar formas de pagamento');
            
            return false;
        }
    }

    // Gráfico de Pizza (Categorias)
    renderPieChart(pieData) {
        const container = document.getElementById('pie-chart-container');
        const canvas = document.getElementById('pie-chart');
        
        if (!pieData || pieData.length === 0) {
            container.innerHTML = '<div class="no-data-chart"><i class="fas fa-chart-pie"></i><p>Nenhuma transação para mostrar</p></div>';
            if (this.pieChart) this.pieChart.destroy();
            return;
        }

        if (this.pieChart) {
            this.pieChart.destroy();
        }

        const colors = this.generateColors(pieData.length);
        
        this.pieChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: pieData.map(item => item.category || 'Sem categoria'),
                datasets: [{
                    data: pieData.map(item => item.value || 0),
                    backgroundColor: colors,
                    borderColor: this.isDarkTheme ? '#2d3748' : '#ffffff',
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: this.isDarkTheme ? '#e2e8f0' : '#4a5568',
                            font: {
                                family: "'Inter', 'Segoe UI', sans-serif",
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                            }
                        },
                        backgroundColor: this.isDarkTheme ? '#2d3748' : '#ffffff',
                        titleColor: this.isDarkTheme ? '#e2e8f0' : '#4a5568',
                        bodyColor: this.isDarkTheme ? '#cbd5e0' : '#718096',
                        borderColor: this.isDarkTheme ? '#4a5568' : '#e2e8f0',
                        borderWidth: 1
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    // Gráfico de Barras (Receitas vs Despesas mensais)
    renderBarChart(barData) {
        const container = document.getElementById('bar-chart-container');
        const canvas = document.getElementById('bar-chart');
        
        if (!barData || barData.length === 0) {
            container.innerHTML = '<div class="no-data-chart"><i class="fas fa-chart-bar"></i><p>Nenhum dado mensal disponível</p></div>';
            if (this.barChart) this.barChart.destroy();
            return;
        }

        if (this.barChart) {
            this.barChart.destroy();
        }

        // Ordenar por mês
        const sortedData = [...barData].sort((a, b) => a.month.localeCompare(b.month));

        this.barChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: sortedData.map(item => this.formatMonth(item.month)),
                datasets: [
                    {
                        label: 'Receitas',
                        data: sortedData.map(item => item.income || 0),
                        backgroundColor: this.isDarkTheme ? 'rgba(72, 187, 120, 0.8)' : 'rgba(46, 204, 113, 0.8)',
                        borderColor: this.isDarkTheme ? '#48bb78' : '#2ecc71',
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.7
                    },
                    {
                        label: 'Despesas',
                        data: sortedData.map(item => item.expense || 0),
                        backgroundColor: this.isDarkTheme ? 'rgba(245, 101, 101, 0.8)' : 'rgba(231, 76, 60, 0.8)',
                        borderColor: this.isDarkTheme ? '#f56565' : '#e74c3c',
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: this.isDarkTheme ? '#e2e8f0' : '#4a5568',
                            font: {
                                family: "'Inter', 'Segoe UI', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                label += 'R$ ' + (context.raw || 0).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: this.isDarkTheme ? '#a0aec0' : '#718096',
                            font: {
                                family: "'Inter', 'Segoe UI', sans-serif"
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.isDarkTheme ? 'rgba(160, 174, 192, 0.1)' : 'rgba(203, 213, 224, 0.5)',
                            drawBorder: false
                        },
                        ticks: {
                            color: this.isDarkTheme ? '#a0aec0' : '#718096',
                            callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Formas de Pagamento - FUNÇÃO QUE FUNCIONA
    renderPaymentMethods(chartsData) {
        const container = document.getElementById('payment-methods');
        if (!container) {
            console.error('❌ Container de formas de pagamento não encontrado');
            return;
        }

        // Tenta obter os dados de várias formas possíveis
        let methods = [];
        
        if (chartsData.payment_methods && chartsData.payment_methods.length > 0) {
            methods = chartsData.payment_methods;
        } else if (chartsData.paymentMethods && chartsData.paymentMethods.length > 0) {
            methods = chartsData.paymentMethods;
        } else {
            // Se não veio nos gráficos, busca da API específica
            this.loadPaymentMethodsFromAPI();
            return;
        }

        if (methods.length === 0) {
            container.innerHTML = `
                <div class="no-payment-methods">
                    <i class="fas fa-credit-card"></i>
                    <p>Nenhuma forma de pagamento registrada</p>
                </div>
            `;
            return;
        }

        const html = methods.map(method => `
            <div class="payment-method-item">
                <div class="payment-method-info">
                    <div class="payment-method-icon">
                        <i class="fas fa-${this.getPaymentIcon(method.payment_method || method.paymentMethod)}"></i>
                    </div>
                    <div class="payment-method-details">
                        <div class="payment-method-name">
                            ${this.formatPaymentMethodName(method.payment_method || method.paymentMethod)}
                        </div>
                        <div class="payment-method-stats">
                            <span class="payment-method-count">${method.count || 0} transações</span>
                            <span class="payment-method-amount">${this.formatCurrency(method.total || method.amount || 0)}</span>
                        </div>
                    </div>
                </div>
                <div class="payment-method-percentage">
                    ${this.calculatePercentage(methods, method)}%
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async loadPaymentMethodsFromAPI() {
        try {
            const container = document.getElementById('payment-methods');
            const response = await fetch('/api/transactions/payment-methods');
            
            if (!response.ok) {
                throw new Error(`API respondeu com ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                // Reutiliza a mesma função de renderização
                this.renderPaymentMethods({ payment_methods: data.data });
            } else {
                container.innerHTML = `
                    <div class="no-payment-methods">
                        <i class="fas fa-credit-card"></i>
                        <p>Nenhuma forma de pagamento registrada</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar formas de pagamento:', error);
            const container = document.getElementById('payment-methods');
            if (container) {
                container.innerHTML = `
                    <div class="payment-methods-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar formas de pagamento</p>
                    </div>
                `;
            }
        }
    }

    // Utilitários
    getPaymentIcon(paymentMethod) {
        const icons = {
            'pix': 'qrcode',
            'dinheiro': 'money-bill-wave',
            'credito': 'credit-card',
            'debito': 'credit-card',
            'transferencia': 'exchange-alt',
            'boleto': 'barcode',
            'outro': 'wallet',
            'default': 'credit-card'
        };
        
        const key = (paymentMethod || '').toLowerCase();
        return icons[key] || icons.default;
    }

    formatPaymentMethodName(paymentMethod) {
        const names = {
            'pix': 'PIX',
            'dinheiro': 'Dinheiro',
            'credito': 'Cartão de Crédito',
            'debito': 'Cartão de Débito',
            'transferencia': 'Transferência',
            'boleto': 'Boleto',
            'outro': 'Outro'
        };
        
        const key = (paymentMethod || '').toLowerCase();
        return names[key] || paymentMethod || 'Desconhecido';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    }

    formatMonth(monthStr) {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthIndex = parseInt(month) - 1;
        return `${monthNames[monthIndex >= 0 ? monthIndex : 0]}/${year.substring(2)}`;
    }

    generateColors(count) {
        const colorPalettes = {
            light: [
                '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
                '#118AB2', '#EF476F', '#7B68EE', '#FF9A76',
                '#7209B7', '#3A86FF', '#FB5607', '#8338EC'
            ],
            dark: [
                '#FF8A8A', '#6BFFE4', '#FFE082', '#1DE9B6',
                '#29B6F6', '#FF4081', '#9575CD', '#FFAB91',
                '#9C27B0', '#448AFF', '#FF9800', '#7C4DFF'
            ]
        };
        
        const palette = this.isDarkTheme ? colorPalettes.dark : colorPalettes.light;
        return palette.slice(0, Math.min(count, palette.length));
    }

    calculatePercentage(allMethods, currentMethod) {
        const total = allMethods.reduce((sum, method) => sum + (method.total || method.amount || 0), 0);
        if (total === 0) return 0;
        return Math.round(((currentMethod.total || currentMethod.amount || 0) / total) * 100);
    }

    showErrorMessage(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Atualizar tema
    updateTheme(isDark) {
        this.isDarkTheme = isDark;
        
        // Atualiza gráficos existentes
        if (this.pieChart || this.barChart) {
            setTimeout(() => {
                this.init();
            }, 300);
        }
    }
}

// Criar instância GLOBAL (IMPORTANTE!)
window.financeCharts = new FinanceCharts();

// Auto-inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (window.financeCharts && window.financeCharts.init) {
        window.financeCharts.init().then(success => {
            if (success) {
                console.log('✅ FinanceCharts inicializado automaticamente');
            }
        });
    }
});