class ExpensoUI {
    constructor() {
        this.currentView = 'dashboard';
        this.transactions = [];
        this.balance = { total: 0, income: 0, expense: 0, savings: 0 };
        this.userSplit = { ashi: { income: 0, expense: 0, savings: 0 }, sanju: { income: 0, expense: 0, savings: 0 } };
        this.budgets = JSON.parse(localStorage.getItem('budgets') || '{}');
        this.settings = JSON.parse(localStorage.getItem('settings') || '{}');
        this.smartInsights = null;
        this.categories = [];
        this.selectedMonth = new Date().getMonth() + 1; // Current month (1-12)
        this.selectedYear = new Date().getFullYear(); // Current year
        this.monthlyTrends = null;
        this.yearlyData = null;
        this.netWorth = null;
        this.incomeVisible = false; // Privacy toggle for income amounts
        this.selectedUserFilter = 'all'; // Filter for transactions: 'all', 'ashi', 'sanju'
        this.eventsBound = false; // Track if events are already bound
        this.setupEventListeners();
        this.init();
    }

    showNotification(text, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${text}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 18px;">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    async init() {
        await this.loadTransactions();
        this.updateBalance();
        this.render();
        this.bindEvents();
    }

    render() {
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="header">
                <div class="container">
                    <div class="header-content">
                        <h1 class="header-title">Finance Manager</h1>
                        <div class="header-actions">
                            <button class="btn btn-sm btn-secondary" onclick="expensoUI.showSettings()">
                                <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="main-content">
                <div class="container">
                    ${this.renderCurrentView()}
                </div>
            </div>

            ${this.renderBottomNav()}
            ${this.renderModals()}
        `;
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                return this.renderDashboard();
            case 'transactions':
                return this.renderTransactions();
            case 'insights':
                return this.renderInsights();
            case 'reports':
                return this.renderReports();
            case 'charts':
                return this.renderCharts();
            case 'smart':
                return this.renderSmartFeatures();
            case 'historical':
                return this.renderHistoricalView();
            case 'analytics':
                return this.renderAnalytics();
            default:
                return this.renderDashboard();
        }
    }

    renderDashboard() {
        const recentTransactions = this.transactions.slice(0, 5);
        
        return `
            <!-- Compact Month Selector -->
            <div class="compact-month-bar">
                <div class="month-display" onclick="expensoUI.toggleMonthPicker()">
                    <span class="month-text">${this.getMonthName(this.selectedMonth)} ${this.selectedYear}</span>
                    <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
                <div class="quick-nav">
                    <button class="nav-btn" onclick="expensoUI.showHistoricalView()" title="Historical Data">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </button>
                    <button class="nav-btn" onclick="expensoUI.showAnalytics()" title="Analytics">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Hidden Month Picker -->
            <div id="monthPicker" class="month-picker-dropdown" style="display: none;">
                <div class="month-picker-content">
                    <div class="month-grid">
                        ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => `
                            <button class="month-btn ${this.selectedMonth === index + 1 ? 'active' : ''}" onclick="expensoUI.selectMonth(${index + 1})">${month}</button>
                        `).join('')}
                    </div>
                    <div class="year-picker">
                        <button class="year-btn ${this.selectedYear === 2024 ? 'active' : ''}" onclick="expensoUI.selectYear(2024)">2024</button>
                        <button class="year-btn ${this.selectedYear === 2025 ? 'active' : ''}" onclick="expensoUI.selectYear(2025)">2025</button>
                    </div>
                </div>
            </div>

            <!-- Balance Card -->
            <div class="balance-card">
                <div class="balance-title">Total Balance</div>
                <div class="balance-amount">₹${this.formatAmount(this.balance.total)}</div>
                <div class="balance-stats">
                    <div class="balance-stat income">
                        <div class="balance-stat-label">
                            Income 
                            <button class="eye-toggle" onclick="expensoUI.toggleIncomeVisibility()" title="${this.incomeVisible ? 'Hide' : 'Show'} income amounts">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                    ${this.incomeVisible 
                                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>'
                                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>'
                                    }
                                </svg>
                            </button>
                        </div>
                        <div class="balance-stat-value">₹${this.formatIncomeAmount(this.balance.income)}</div>
                    </div>
                    <div class="balance-stat expense">
                        <div class="balance-stat-label">Expense</div>
                        <div class="balance-stat-value">₹${this.formatAmount(this.balance.expense)}</div>
                    </div>
                </div>
            </div>

            <!-- User Split Cards -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); margin: var(--space-md) 0;">
                <div class="user-split-card ashi">
                    <div class="user-split-header">
                        <div class="user-avatar">A</div>
                        <div class="user-name">Ashi</div>
                    </div>
                    <div class="user-split-amounts">
                        <div class="user-split-income">+₹${this.formatIncomeAmount(this.userSplit.ashi?.income || 0)}</div>
                        <div class="user-split-expense">-₹${this.formatAmount(this.userSplit.ashi?.expense || 0)}</div>
                    </div>
                    <div class="user-split-net">₹${this.incomeVisible ? this.formatAmount((this.userSplit.ashi?.income || 0) - (this.userSplit.ashi?.expense || 0)) : '••••••'}</div>
                </div>
                
                <div class="user-split-card sanju">
                    <div class="user-split-header">
                        <div class="user-avatar">S</div>
                        <div class="user-name">Sanju</div>
                    </div>
                    <div class="user-split-amounts">
                        <div class="user-split-income">+₹${this.formatIncomeAmount(this.userSplit.sanju?.income || 0)}</div>
                        <div class="user-split-expense">-₹${this.formatAmount(this.userSplit.sanju?.expense || 0)}</div>
                    </div>
                    <div class="user-split-net">₹${this.incomeVisible ? this.formatAmount((this.userSplit.sanju?.income || 0) - (this.userSplit.sanju?.expense || 0)) : '••••••'}</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <button class="quick-action-btn" onclick="expensoUI.showAddTransaction('income')">
                    <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span class="quick-action-label">Add Income</span>
                </button>
                
                <button class="quick-action-btn" onclick="expensoUI.showAddTransaction('expense')">
                    <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                    </svg>
                    <span class="quick-action-label">Add Expense</span>
                </button>
                
                <button class="quick-action-btn" onclick="expensoUI.switchView('budget')">
                    <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span class="quick-action-label">Budget</span>
                </button>
                
                <button class="quick-action-btn" onclick="expensoUI.switchView('reports')">
                    <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span class="quick-action-label">Reports</span>
                </button>
            </div>

            <!-- Recent Transactions -->
            <div class="section-header">
                <h2 class="section-title">Recent Transactions</h2>
                <a href="#" class="section-action" onclick="expensoUI.switchView('transactions')">See All</a>
            </div>

            ${recentTransactions.length > 0 ? `
                <div class="transaction-list">
                    ${recentTransactions.map(transaction => this.renderTransactionCard(transaction)).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <h3 class="empty-state-title">No transactions yet</h3>
                    <p class="empty-state-description">Start by adding your first income or expense</p>
                    <button class="btn btn-primary" onclick="expensoUI.showAddTransaction('expense')">Add Transaction</button>
                </div>
            `}
        `;
    }

    renderTransactions() {
        const filteredTransactions = this.getFilteredTransactions();
        
        return `
            <div class="section-header">
                <h2 class="section-title">Transactions</h2>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-secondary" onclick="expensoUI.showSearch()">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        Search
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="expensoUI.showAddTransaction('expense')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add
                    </button>
                </div>
            </div>

            <!-- User Filter -->
            <div class="user-filter-container">
                <div class="user-filter-label">Filter by user:</div>
                <div class="user-filter-buttons">
                    <button class="filter-btn ${this.selectedUserFilter === 'all' ? 'active' : ''}" onclick="expensoUI.setUserFilter('all')">All</button>
                    <button class="filter-btn ${this.selectedUserFilter === 'ashi' ? 'active' : ''}" onclick="expensoUI.setUserFilter('ashi')">Ashi</button>
                    <button class="filter-btn ${this.selectedUserFilter === 'sanju' ? 'active' : ''}" onclick="expensoUI.setUserFilter('sanju')">Sanju</button>
                </div>
                <div class="filter-count">${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''}</div>
            </div>

            ${filteredTransactions.length > 0 ? `
                <div class="transaction-list">
                    ${filteredTransactions.map(transaction => this.renderTransactionCard(transaction)).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <h3 class="empty-state-title">No transactions found</h3>
                    <p class="empty-state-description">${this.selectedUserFilter === 'all' ? 'Add your first transaction to get started' : `No transactions found for ${this.selectedUserFilter}`}</p>
                    <button class="btn btn-primary" onclick="expensoUI.showAddTransaction('expense')">Add Transaction</button>
                </div>
            `}
        `;
    }

    renderInsights() {
        return `
            <div class="section-header">
                <h2 class="section-title">Financial Insights & Savings Optimization</h2>
                <button class="btn btn-sm btn-primary" onclick="expensoUI.loadFinancialInsights()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh Insights
                </button>
            </div>

            <div id="financialInsightsContainer">
                <div class="loading-state" style="text-align: center; padding: var(--space-xxl);">
                    <svg class="loading-spinner" style="width: 48px; height: 48px; animation: spin 1s linear infinite; color: var(--primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <h3 style="margin-top: var(--space-lg); color: var(--text-primary);">Analyzing Your Financial Data...</h3>
                    <p style="color: var(--text-secondary); margin-top: var(--space-sm);">Applying insights from financial experts...</p>
                </div>
            </div>
        `;
    }

    renderSmartFeatures() {
        return `
            <div class="section-header">
                <h2 class="section-title">Smart Finance Manager</h2>
                <button class="btn btn-sm btn-primary" onclick="expensoUI.refreshSmartInsights()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh
                </button>
            </div>

            <!-- Smart Insights Section -->
            <div class="card mb-lg">
                <div class="card-header">
                    <h3 class="card-title">AI Predictions & Insights</h3>
                </div>
                <div class="card-body" id="smartInsightsContent">
                    <div class="empty-state">
                        <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        <h3 class="empty-state-title">AI Insights Loading...</h3>
                        <p class="empty-state-description">Click refresh to get smart predictions and spending analysis</p>
                    </div>
                </div>
            </div>

            <!-- Recurring Transactions -->
            <div class="card mb-lg">
                <div class="card-header">
                    <h3 class="card-title">Recurring Transaction Suggestions</h3>
                </div>
                <div class="card-body" id="recurringTransactionsContent">
                    <div class="empty-state">
                        <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 class="empty-state-title">No Recurring Patterns Yet</h3>
                        <p class="empty-state-description">Add more transactions to detect recurring patterns</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderTransactionCard(transaction) {
        const isIncome = transaction.type === 'income';
        const amount = parseFloat(transaction.amount) || 0;
        
        return `
            <div class="transaction-card" data-transaction-id="${transaction.id}" style="cursor: pointer;">
                <div class="transaction-icon ${transaction.type}">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${isIncome ? 
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>' :
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>'
                        }
                    </svg>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-meta">${transaction.category} • ${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${isIncome ? '+' : '-'}₹${this.formatAmount(Math.abs(amount))}
                </div>
            </div>
        `;
    }

    renderBudget() {
        const budgetEntries = Object.entries(this.budgets);
        
        return `
            <div class="section-header">
                <h2 class="section-title">Budget Management</h2>
                <button class="btn btn-sm btn-primary" onclick="expensoUI.showAddBudget()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Budget
                </button>
            </div>

            ${budgetEntries.length > 0 ? `
                <div class="transaction-list">
                    ${budgetEntries.map(([category, budget]) => this.renderBudgetCard(category, budget)).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <h3 class="empty-state-title">No budgets set</h3>
                    <p class="empty-state-description">Create budgets to track your spending</p>
                    <button class="btn btn-primary" onclick="expensoUI.showAddBudget()">Add Budget</button>
                </div>
            `}
        `;
    }

    renderBudgetCard(category, budget) {
        const spent = this.calculateCategorySpent(category);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        return `
            <div class="card">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 18px; font-weight: 600; color: var(--text-primary);">${category}</h3>
                        <span style="font-size: 16px; font-weight: 600; color: var(--text-primary);">₹${this.formatAmount(spent)} / ₹${this.formatAmount(budget.amount)}</span>
                    </div>
                    <div style="background: var(--bg-secondary); border-radius: 8px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                        <div style="background: ${percentage > 90 ? 'var(--danger)' : percentage > 70 ? 'var(--warning)' : 'var(--success)'}; height: 100%; width: ${Math.min(percentage, 100)}%; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary);">
                        ${percentage.toFixed(0)}% used • ₹${this.formatAmount(budget.amount - spent)} remaining
                    </div>
                </div>
            </div>
        `;
    }

    renderReports() {
        return `
            <div class="section-header">
                <h2 class="section-title">Financial Reports</h2>
                <button class="btn btn-sm btn-primary" onclick="expensoUI.generateReport()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    Generate
                </button>
            </div>

            <div class="quick-actions">
                <button class="quick-action-btn" onclick="expensoUI.showMonthlyReport()">
                    <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span class="quick-action-label">Monthly</span>
                </button>
                
                <button class="quick-action-btn" onclick="expensoUI.showCategoryReport()">
                    <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span class="quick-action-label">Category</span>
                </button>
                
                <button class="quick-action-btn" onclick="expensoUI.showSummaryReport()">
                    <svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span class="quick-action-label">Summary</span>
                </button>
            </div>

            <div id="reportContent" class="mt-lg"></div>
        `;
    }

    renderCharts() {
        return `
            <div class="section-header">
                <h2 class="section-title">Financial Charts</h2>
                <button class="btn btn-sm btn-secondary" onclick="expensoUI.refreshCharts()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh
                </button>
            </div>

            ${this.transactions.length > 0 ? `
                <div class="chart-container">
                    <h3 class="chart-title">Monthly Trends</h3>
                    <div style="position: relative; height: 300px;">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>

                <div class="chart-container">
                    <h3 class="chart-title">Category Breakdown</h3>
                    <div style="position: relative; height: 300px;">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>

                <div class="chart-container">
                    <h3 class="chart-title">Income vs Expense</h3>
                    <div style="position: relative; height: 300px;">
                        <canvas id="incomeExpenseChart"></canvas>
                    </div>
                </div>
            ` : `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="empty-state-title">No data for charts</h3>
                    <p class="empty-state-description">Add some transactions to see beautiful charts</p>
                    <button class="btn btn-primary" onclick="expensoUI.showAddTransaction('expense')">Add Transaction</button>
                </div>
            `}
        `;
    }

    renderBottomNav() {
        return `
            <div class="bottom-nav">
                <div class="bottom-nav-content">
                    <a href="#" class="bottom-nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" onclick="expensoUI.switchView('dashboard')">
                        <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                        <span class="bottom-nav-label">Home</span>
                    </a>
                    
                    <a href="#" class="bottom-nav-item ${this.currentView === 'transactions' ? 'active' : ''}" onclick="expensoUI.switchView('transactions')">
                        <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <span class="bottom-nav-label">Transactions</span>
                    </a>
                    
                    <a href="#" class="bottom-nav-item ${this.currentView === 'insights' ? 'active' : ''}" onclick="expensoUI.switchView('insights')">
                        <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <span class="bottom-nav-label">Insights</span>
                    </a>
                    
                    <a href="#" class="bottom-nav-item ${this.currentView === 'reports' ? 'active' : ''}" onclick="expensoUI.switchView('reports')">
                        <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span class="bottom-nav-label">Reports</span>
                    </a>
                    
                    <a href="#" class="bottom-nav-item ${this.currentView === 'charts' ? 'active' : ''}" onclick="expensoUI.switchView('charts')">
                        <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span class="bottom-nav-label">Charts</span>
                    </a>
                    
                    <a href="#" class="bottom-nav-item ${this.currentView === 'smart' ? 'active' : ''}" onclick="expensoUI.switchView('smart')">
                        <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        <span class="bottom-nav-label">Smart</span>
                    </a>
                </div>
            </div>
        `;
    }

    renderModals() {
        return `
            <!-- Add Transaction Modal -->
            <div id="addTransactionModal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Add Transaction</h3>
                        <button class="modal-close" onclick="expensoUI.hideModal('addTransactionModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addTransactionForm" onsubmit="expensoUI.addTransaction(event)">
                            <div class="form-group">
                                <label class="form-label">Type</label>
                                <select class="form-select" name="type" required>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">User</label>
                                <select class="form-select" name="user" required>
                                    <option value="Ashi">Ashi</option>
                                    <option value="Sanju">Sanju</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Amount</label>
                                <input type="number" class="form-input" name="amount" step="0.01" inputmode="decimal" pattern="[0-9]*" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <input type="text" class="form-input" name="description" inputmode="text" autocomplete="off" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select class="form-select" name="category" required>
                                    <option value="">Select Category</option>
                                    <option value="Food">Food</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Bills">Bills</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Education">Education</option>
                                    <option value="Salary">Salary</option>
                                    <option value="Freelance">Freelance</option>
                                    <option value="Investment">Investment</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date</label>
                                <input type="date" class="form-input" name="date" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="expensoUI.hideModal('addTransactionModal')">Cancel</button>
                        <button type="submit" form="addTransactionForm" class="btn btn-primary">Add Transaction</button>
                    </div>
                </div>
            </div>

            <!-- Transaction Details Modal -->
            <div id="transactionDetailsModal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Transaction Details</h3>
                        <button class="modal-close" onclick="expensoUI.hideModal('transactionDetailsModal')">&times;</button>
                    </div>
                    <div class="modal-body" id="transactionDetailsContent">
                        <!-- Content will be populated dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" onclick="expensoUI.deleteCurrentTransaction()">Delete</button>
                        <button type="button" class="btn btn-primary" onclick="expensoUI.editCurrentTransaction()">Edit</button>
                    </div>
                </div>
            </div>

            <!-- Search Modal -->
            <div id="searchModal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Search Transactions</h3>
                        <button class="modal-close" onclick="expensoUI.hideModal('searchModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="searchForm" onsubmit="expensoUI.performSearch(event)">
                            <div class="form-group">
                                <label class="form-label">Search Term</label>
                                <input type="text" class="form-input" name="searchTerm" inputmode="text" autocomplete="off" placeholder="Enter description, category, or amount">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date Range</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <input type="date" class="form-input" name="startDate">
                                    <input type="date" class="form-input" name="endDate">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="expensoUI.hideModal('searchModal')">Cancel</button>
                        <button type="submit" form="searchForm" class="btn btn-primary">Search</button>
                    </div>
                </div>
            </div>

            <!-- Add Budget Modal -->
            <div id="addBudgetModal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Add Budget</h3>
                        <button class="modal-close" onclick="expensoUI.hideModal('addBudgetModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addBudgetForm" onsubmit="expensoUI.addBudget(event)">
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select class="form-select" name="category" required>
                                    <option value="">Select Category</option>
                                    <option value="Food">Food</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Bills">Bills</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Education">Education</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Budget Amount</label>
                                <input type="number" class="form-input" name="amount" step="0.01" inputmode="decimal" pattern="[0-9]*" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Period</label>
                                <select class="form-select" name="period" required>
                                    <option value="monthly">Monthly</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="expensoUI.hideModal('addBudgetModal')">Cancel</button>
                        <button type="submit" form="addBudgetForm" class="btn btn-primary">Add Budget</button>
                    </div>
                </div>
            </div>

            <!-- Settings Modal -->
            <div id="settingsModal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Settings</h3>
                        <button class="modal-close" onclick="expensoUI.hideModal('settingsModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Currency</label>
                            <select class="form-select" id="currencySetting">
                                <option value="INR">Indian Rupee (₹)</option>
                                <option value="USD">US Dollar ($)</option>
                                <option value="EUR">Euro (€)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Theme</label>
                            <select class="form-select" id="themeSetting">
                                <option value="auto">Auto</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="expensoUI.hideModal('settingsModal')">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="expensoUI.saveSettings()">Save</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Navigation and UI methods
    switchView(view) {
        this.currentView = view;
        this.render();
        
        // Load charts if switching to charts view
        if (view === 'charts') {
            setTimeout(() => this.loadCharts(), 100);
        }
        
        // Load financial insights if switching to insights view
        if (view === 'insights') {
            setTimeout(() => this.loadFinancialInsights(), 100);
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        
        // Set today's date as default for transaction forms
        if (modalId === 'addTransactionModal') {
            const dateInput = document.querySelector('#addTransactionForm input[name="date"]');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        
        if (modalId === 'addTransactionModal') {
            document.getElementById('addTransactionForm').reset();
        }
    }

    showAddTransaction(type = 'expense') {
        this.showModal('addTransactionModal');
        const typeSelect = document.querySelector('#addTransactionForm select[name="type"]');
        if (typeSelect) {
            typeSelect.value = type;
        }
    }

    showTransactionDetails(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        this.currentTransactionId = transactionId;
        const content = document.getElementById('transactionDetailsContent');
        const isIncome = transaction.type === 'income';
        
        content.innerHTML = `
            <div class="transaction-details-card">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <div class="transaction-icon ${transaction.type}" style="width: 64px; height: 64px;">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${isIncome ? 
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>' :
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>'
                            }
                        </svg>
                    </div>
                    <div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                            ${transaction.description}
                        </h3>
                        <p style="color: var(--text-secondary);">
                            ${transaction.category} • ${this.formatDate(transaction.date)}
                        </p>
                    </div>
                </div>
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 36px; font-weight: 700; color: ${isIncome ? 'var(--success)' : 'var(--danger)'};">
                        ${isIncome ? '+' : '-'}₹${this.formatAmount(Math.abs(parseFloat(transaction.amount)))}
                    </div>
                </div>
                
                <div style="background: var(--bg-secondary); border-radius: 12px; padding: 16px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Type</div>
                            <div style="font-weight: 500; text-transform: capitalize;">${transaction.type}</div>
                        </div>
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Category</div>
                            <div style="font-weight: 500;">${transaction.category}</div>
                        </div>
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Date</div>
                            <div style="font-weight: 500;">${this.formatDate(transaction.date)}</div>
                        </div>
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">ID</div>
                            <div style="font-weight: 500; font-family: monospace; font-size: 12px;">${transaction.id}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('transactionDetailsModal');
    }

    showSearch() {
        this.showModal('searchModal');
    }

    showAddBudget() {
        this.showModal('addBudgetModal');
    }

    showSettings() {
        this.showModal('settingsModal');
        
        // Load current settings
        const currencySelect = document.getElementById('currencySetting');
        const themeSelect = document.getElementById('themeSetting');
        
        if (currencySelect) currencySelect.value = this.settings.currency || 'INR';
        if (themeSelect) themeSelect.value = this.settings.theme || 'auto';
    }

    // Transaction management
    async addTransaction(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const transactionData = {
            selection: formData.get('user'), // User selection
            type: formData.get('category'), // Category
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date') // Include the selected date
        };

        const transactionType = formData.get('type'); // 'income' or 'expense'
        const endpoint = transactionType === 'income' ? '/add-income' : '/add-expense';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
            });

            if (response.ok) {
                const result = await response.json();
                // Create transaction object for local state
                const transaction = {
                    id: Date.now().toString(),
                    type: transactionType,
                    amount: transactionData.amount,
                    description: transactionData.description,
                    category: transactionData.type, // Category is in 'type' field for server
                    date: transactionData.date, // Use the selected date from the form
                    user: transactionData.selection // Store user info
                };
                
                this.transactions.unshift(transaction);
                this.updateBalance();
                this.hideModal('addTransactionModal');
                this.render();
                this.showNotification(result.message || 'Transaction added successfully!', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add transaction');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            this.showNotification(error.message || 'Failed to add transaction', 'error');
        }
    }

    async deleteCurrentTransaction() {
        if (!this.currentTransactionId) return;
        
        if (confirm('Are you sure you want to delete this transaction?')) {
            try {
                const response = await fetch(`/delete-transaction/${this.currentTransactionId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.transactions = this.transactions.filter(t => t.id !== this.currentTransactionId);
                    this.updateBalance();
                    this.hideModal('transactionDetailsModal');
                    this.render();
                    this.showNotification('Transaction deleted successfully!', 'success');
                } else {
                    throw new Error('Failed to delete transaction');
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                this.showNotification('Failed to delete transaction', 'error');
            }
        }
    }

    editCurrentTransaction() {
        // Implementation for editing transactions
        this.hideModal('transactionDetailsModal');
        // Show edit form with current transaction data
        this.showNotification('Edit functionality coming soon!', 'info');
    }

    async performSearch(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const searchParams = {
            searchTerm: formData.get('searchTerm'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate')
        };

        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`/search-transactions?${queryString}`);
            
            if (response.ok) {
                const results = await response.json();
                this.transactions = results;
                this.hideModal('searchModal');
                this.switchView('transactions');
                this.showNotification(`Found ${results.length} transactions`, 'success');
            } else {
                throw new Error('Search failed');
            }
        } catch (error) {
            console.error('Error searching transactions:', error);
            this.showNotification('Search failed', 'error');
        }
    }

    async addBudget(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const budget = {
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            period: formData.get('period')
        };

        this.budgets[budget.category] = budget;
        localStorage.setItem('budgets', JSON.stringify(this.budgets));
        
        this.hideModal('addBudgetModal');
        this.render();
        this.showNotification('Budget added successfully!', 'success');
    }

    saveSettings() {
        const currency = document.getElementById('currencySetting').value;
        const theme = document.getElementById('themeSetting').value;
        
        this.settings = { ...this.settings, currency, theme };
        localStorage.setItem('settings', JSON.stringify(this.settings));
        
        this.hideModal('settingsModal');
        this.showNotification('Settings saved!', 'success');
    }

    // Data management
    async loadTransactions(cacheBust = null) {
        try {
            // Use selected month and year instead of current date
            const month = this.selectedMonth;
            const year = this.selectedYear;
            
            console.log(`Loading transactions for month: ${month}, year: ${year}`);
            
            // Load transactions for both users
            const users = ['Ashi', 'Sanju'];
            let allTransactions = [];
            
            for (const user of users) {
                try {
                    const cacheBustParam = cacheBust ? `&_t=${cacheBust}` : '';
                    const response = await fetch(`/summary?month=${month}&year=${year}&user=${user}${cacheBustParam}`);
                    if (response.ok) {
                        const summaryData = await response.json();
                        if (summaryData.success !== false && summaryData.data && summaryData.ids) {
                            // Convert summary data to transaction format using actual row IDs
                            const userTransactions = summaryData.data.map((row, index) => ({
                                id: summaryData.ids[index], // Use actual Google Sheets row number
                                type: row[4] === 'income' ? 'income' : 'expense', // Entry type is in column 4
                                amount: Math.abs(parseFloat(row[3]) || 0), // Amount is in column 3
                                description: row[2] || 'No description', // Description is in column 2
                                category: row[1] || 'Other', // Category is in column 1
                                date: row[0] || new Date().toISOString().split('T')[0], // Date is in column 0
                                user: user,
                                isSaving: row[6] === 'YES' // Is saving flag
                            }));
                            console.log(`Loaded ${userTransactions.length} transactions for ${user}:`, userTransactions);
                            allTransactions = allTransactions.concat(userTransactions);
                        }
                    }
                } catch (userError) {
                    console.log(`Error loading data for ${user}:`, userError);
                }
            }
            
            // Sort by date (newest first)
            this.transactions = allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log('Loaded transactions:', this.transactions.length);
            
            // Update balance after loading transactions
            this.updateBalance();
            
            // Re-render to show updated balance and transactions
            if (this.currentView === 'dashboard') {
                this.render();
            }
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.transactions = [];
            this.updateBalance(); // Update balance even if no transactions
            
            // Re-render to show updated (empty) state
            if (this.currentView === 'dashboard') {
                this.render();
            }
        }
    }

    updateBalance() {
        let income = 0;
        let expense = 0;
        
        // Reset user splits
        this.userSplit = {
            ashi: { income: 0, expense: 0 },
            sanju: { income: 0, expense: 0 }
        };

        this.transactions.forEach(transaction => {
            const amount = Math.abs(parseFloat(transaction.amount) || 0);
            const user = transaction.user?.toLowerCase() === 'ashi' ? 'ashi' : 'sanju';
            
            if (transaction.type === 'income') {
                income += amount;
                this.userSplit[user].income += amount;
            } else {
                expense += amount;
                this.userSplit[user].expense += amount;
            }
        });

        this.balance = {
            income,
            expense,
            total: income - expense
        };
        
        console.log('Updated balance:', this.balance, 'User split:', this.userSplit, 'from', this.transactions.length, 'transactions');
    }

    async loadCategories() {
        try {
            // Calculate category statistics from current transactions
            const categoryStats = {};
            
            this.transactions.forEach(transaction => {
                if (transaction.type === 'expense' && transaction.category) {
                    if (!categoryStats[transaction.category]) {
                        categoryStats[transaction.category] = {
                            category: transaction.category,
                            totalAmount: 0,
                            transactionCount: 0
                        };
                    }
                    categoryStats[transaction.category].totalAmount += Math.abs(parseFloat(transaction.amount) || 0);
                    categoryStats[transaction.category].transactionCount += 1;
                }
            });
            
            // Convert to array and sort by total amount descending
            this.categories = Object.values(categoryStats).sort((a, b) => b.totalAmount - a.totalAmount);
            console.log('Category statistics:', this.categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadMonthlyTrends() {
        try {
            // Load trends for both users and combine
            const users = ['Ashi', 'Sanju'];
            let allTrends = [];
            
            for (const user of users) {
                const response = await fetch(`/monthly-trends?year=${this.selectedYear}&user=${user}`);
                if (response.ok) {
                    const trends = await response.json();
                    if (trends && Array.isArray(trends)) {
                        allTrends = allTrends.concat(trends.map(trend => ({ ...trend, user })));
                    }
                }
            }
            
            this.monthlyTrends = allTrends;
        } catch (error) {
            console.error('Error loading monthly trends:', error);
        }
    }

    async loadYearlyData() {
        try {
            // Load yearly data for both users and combine
            const users = ['Ashi', 'Sanju'];
            let combinedData = {
                totalIncome: 0,
                totalExpense: 0,
                savings: 0,
                monthlyBreakdown: {}
            };
            
            for (const user of users) {
                const response = await fetch(`/yearly-summary?year=${this.selectedYear}&user=${user}`);
                if (response.ok) {
                    const yearlyData = await response.json();
                    console.log(`Yearly data for ${user}:`, yearlyData); // Debug log
                    if (yearlyData && yearlyData.success !== false) {
                        combinedData.totalIncome += yearlyData.totalIncome || 0;
                        combinedData.totalExpense += yearlyData.totalExpense || 0;
                        combinedData.savings += yearlyData.totalSavings || 0;
                        
                        // Merge monthly breakdown - it's an object, not an array
                        if (yearlyData.monthlyBreakdown && typeof yearlyData.monthlyBreakdown === 'object') {
                            Object.keys(yearlyData.monthlyBreakdown).forEach(monthKey => {
                                const monthData = yearlyData.monthlyBreakdown[monthKey];
                                if (!combinedData.monthlyBreakdown[monthKey]) {
                                    combinedData.monthlyBreakdown[monthKey] = {
                                        month: monthKey,
                                        income: 0,
                                        expense: 0,
                                        savings: 0,
                                        net: 0
                                    };
                                }
                                combinedData.monthlyBreakdown[monthKey].income += monthData.income || 0;
                                combinedData.monthlyBreakdown[monthKey].expense += monthData.expense || 0;
                                combinedData.monthlyBreakdown[monthKey].savings += monthData.savings || 0;
                                combinedData.monthlyBreakdown[monthKey].net += monthData.net || 0;
                            });
                        }
                    }
                } else {
                    console.error(`Failed to load yearly data for ${user}:`, await response.text());
                }
            }
            
            // Convert monthlyBreakdown object to array for easier rendering
            combinedData.monthlyBreakdownArray = Object.values(combinedData.monthlyBreakdown);
            
            this.yearlyData = combinedData;
            console.log('Combined yearly data:', this.yearlyData);
        } catch (error) {
            console.error('Error loading yearly data:', error);
        }
    }

    async loadNetWorth() {
        try {
            // Load net worth for both users and combine
            const users = ['Ashi', 'Sanju'];
            let combinedNetWorth = {
                totalSavings: 0,
                totalInvestments: 0,
                netWorth: 0,
                monthlyNetWorth: {}
            };
            
            for (const user of users) {
                const response = await fetch(`/net-worth?user=${user}`);
                if (response.ok) {
                    const netWorth = await response.json();
                    console.log(`Net worth for ${user}:`, netWorth); // Debug log
                    if (netWorth && netWorth.success !== false) {
                        combinedNetWorth.totalSavings += netWorth.totalSavings || 0;
                        combinedNetWorth.totalInvestments += netWorth.totalInvestments || 0;
                        combinedNetWorth.netWorth += netWorth.netWorth || 0;
                        
                        // Merge monthly net worth data - it's an object, not an array
                        if (netWorth.monthlyNetWorth && typeof netWorth.monthlyNetWorth === 'object') {
                            Object.keys(netWorth.monthlyNetWorth).forEach(monthKey => {
                                const monthData = netWorth.monthlyNetWorth[monthKey];
                                if (!combinedNetWorth.monthlyNetWorth[monthKey]) {
                                    combinedNetWorth.monthlyNetWorth[monthKey] = {
                                        month: monthKey,
                                        savings: 0,
                                        investments: 0,
                                        netWorth: 0,
                                        growth: 0
                                    };
                                }
                                combinedNetWorth.monthlyNetWorth[monthKey].savings += monthData.savings || 0;
                                combinedNetWorth.monthlyNetWorth[monthKey].investments += monthData.investments || 0;
                                combinedNetWorth.monthlyNetWorth[monthKey].netWorth += (monthData.savings || 0) + (monthData.investments || 0);
                            });
                        }
                    }
                } else {
                    console.error(`Failed to load net worth for ${user}:`, await response.text());
                }
            }
            
            // Convert monthlyNetWorth object to array and calculate growth
            const monthlyArray = Object.values(combinedNetWorth.monthlyNetWorth);
            monthlyArray.forEach((month, index) => {
                if (index > 0) {
                    month.growth = month.netWorth - monthlyArray[index - 1].netWorth;
                } else {
                    month.growth = month.netWorth;
                }
            });
            combinedNetWorth.monthlyGrowth = monthlyArray;
            
            this.netWorth = combinedNetWorth;
            console.log('Combined net worth:', this.netWorth);
        } catch (error) {
            console.error('Error loading net worth:', error);
        }
    }

    toggleMonthPicker() {
        const picker = document.getElementById('monthPicker');
        if (picker) {
            picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
        }
    }

    async selectMonth(month) {
        this.selectedMonth = month;
        await this.refreshData();
        this.toggleMonthPicker();
    }

    async selectYear(year) {
        this.selectedYear = year;
        await this.refreshData();
        this.toggleMonthPicker();
    }

    async refreshData() {
        await this.loadTransactions();
        this.render();
        this.showNotification(`Switched to ${this.getMonthName(this.selectedMonth)} ${this.selectedYear}`, 'success');
    }

    setupEventListeners() {
        // Close month picker when clicking outside
        document.addEventListener('click', (event) => {
            const picker = document.getElementById('monthPicker');
            const monthDisplay = event.target.closest('.month-display');
            
            if (picker && picker.style.display !== 'none' && !monthDisplay && !picker.contains(event.target)) {
                picker.style.display = 'none';
            }
        });

        // Pull to refresh implementation - STRICT VERSION
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        let isPulling = false;
        let refreshThreshold = 150;
        let isAtAbsoluteTop = false;
        let hasStartedPulling = false;
        let stayedAtTopThroughout = true; // Track if user stayed at top throughout gesture
        
        // Helper function to check if truly at top - check all possible scroll containers
        function isAtTop() {
            const windowScroll = window.pageYOffset || window.scrollY || 0;
            const documentScroll = document.documentElement.scrollTop || 0;
            const bodyScroll = document.body.scrollTop || 0;
            
            const scrollTop = Math.max(windowScroll, documentScroll, bodyScroll);
            return scrollTop === 0;
        }
        
        // Touch start
        document.addEventListener('touchstart', (e) => {
            // Reset all states
            isPulling = false;
            hasStartedPulling = false;
            stayedAtTopThroughout = true;
            isAtAbsoluteTop = isAtTop();
            
            if (isAtAbsoluteTop) {
                startY = e.touches[0].clientY;
            }
        }, { passive: true });
        
        // Touch move
        document.addEventListener('touchmove', (e) => {
            // Continuously check if we're at top
            const currentlyAtTop = isAtTop();
            
            if (!currentlyAtTop) {
                stayedAtTopThroughout = false;
            }
            
            // Only proceed if we started at top AND stayed at top
            if (!isAtAbsoluteTop || !stayedAtTopThroughout || !currentlyAtTop) {
                // Clean up any existing indicator
                if (!hasStartedPulling) {
                    const pullIndicator = document.querySelector('.pull-refresh-indicator');
                    if (pullIndicator) {
                        pullIndicator.remove();
                    }
                }
                return;
            }
            
            currentY = e.touches[0].clientY;
            pullDistance = currentY - startY;
            
            // Only start pulling if:
            // 1. We started at absolute top
            // 2. We stayed at top throughout
            // 3. User is pulling DOWN significantly (more than 60px)
            // 4. We're still at top
            if (pullDistance > 60 && currentlyAtTop && stayedAtTopThroughout) {
                if (!hasStartedPulling) {
                    hasStartedPulling = true;
                }
                
                isPulling = true;
                e.preventDefault();
                
                // Create or update pull indicator
                let pullIndicator = document.querySelector('.pull-refresh-indicator');
                if (!pullIndicator) {
                    pullIndicator = document.createElement('div');
                    pullIndicator.className = 'pull-refresh-indicator';
                    pullIndicator.innerHTML = `
                        <div class="pull-refresh-content">
                            <div class="pull-refresh-spinner"></div>
                            <span class="pull-refresh-text">Pull down more to refresh & reset</span>
                        </div>
                    `;
                    document.body.insertBefore(pullIndicator, document.body.firstChild);
                }
                
                // Update indicator based on pull distance
                const adjustedDistance = pullDistance - 60; // subtract initial threshold
                const progress = Math.min(adjustedDistance / (refreshThreshold - 60), 1);
                pullIndicator.style.transform = `translateY(${Math.min(adjustedDistance, refreshThreshold - 60)}px)`;
                pullIndicator.style.opacity = progress;
                
                const spinner = pullIndicator.querySelector('.pull-refresh-spinner');
                const text = pullIndicator.querySelector('.pull-refresh-text');
                
                if (adjustedDistance >= (refreshThreshold - 60)) {
                    spinner.style.transform = 'rotate(180deg)';
                    text.textContent = 'Release to refresh & reset to current month';
                    pullIndicator.classList.add('ready');
                } else {
                    spinner.style.transform = `rotate(${progress * 180}deg)`;
                    text.textContent = 'Pull down more to refresh & reset';
                    pullIndicator.classList.remove('ready');
                }
            }
        }, { passive: false });
        
        // Touch end
        document.addEventListener('touchend', () => {
            const pullIndicator = document.querySelector('.pull-refresh-indicator');
            
            // Only trigger refresh if ALL conditions are met:
            // 1. We were pulling
            // 2. We started pulling
            // 3. We stayed at top throughout the entire gesture
            // 4. We're still at top now
            // 5. We pulled far enough
            const adjustedDistance = pullDistance - 60;
            const shouldRefresh = isPulling && hasStartedPulling && stayedAtTopThroughout && 
                                isAtTop() && adjustedDistance >= (refreshThreshold - 60);
            
            if (shouldRefresh) {
                console.log('All conditions met - triggering refresh');
                this.performPullRefresh();
            } else {
                console.log('Refresh cancelled - conditions not met:', {
                    isPulling,
                    hasStartedPulling,
                    stayedAtTopThroughout,
                    currentlyAtTop: isAtTop(),
                    pullDistance: adjustedDistance,
                    threshold: refreshThreshold - 60
                });
            }
            
            // Reset and cleanup
            if (pullIndicator) {
                pullIndicator.style.transform = 'translateY(-100%)';
                pullIndicator.style.opacity = '0';
                setTimeout(() => pullIndicator?.remove(), 300);
            }
            
            // Reset all states
            isPulling = false;
            hasStartedPulling = false;
            stayedAtTopThroughout = true;
            pullDistance = 0;
            startY = 0;
            currentY = 0;
            isAtAbsoluteTop = false;
        }, { passive: true });
    }

    toggleIncomeVisibility() {
        this.incomeVisible = !this.incomeVisible;
        this.render(); // Re-render to update display
    }

    formatIncomeAmount(amount) {
        if (this.incomeVisible) {
            return this.formatAmount(amount);
        }
        return '••••••';
    }

    setUserFilter(user) {
        this.selectedUserFilter = user;
        this.render(); // Re-render to update transaction list
    }

    getFilteredTransactions() {
        if (this.selectedUserFilter === 'all') {
            return this.transactions;
        }
        return this.transactions.filter(transaction => 
            transaction.user?.toLowerCase() === this.selectedUserFilter.toLowerCase()
        );
    }

    async performPullRefresh() {
        try {
            // Show loading indicator
            this.showNotification('Refreshing & resetting to current month...', 'info', 1000);
            
            // Clear all cached data
            this.transactions = [];
            this.categories = [];
            this.monthlyTrends = [];
            this.yearlyData = null;
            this.netWorth = null;
            
            // Reset to current month/year
            const now = new Date();
            this.selectedMonth = now.getMonth() + 1;
            this.selectedYear = now.getFullYear();
            
            // Reset balance
            this.balance = {
                income: 0,
                expense: 0,
                total: 0,
                savings: 0
            };
            
            // Reset user split
            this.userSplit = {
                ashi: { income: 0, expense: 0 },
                sanju: { income: 0, expense: 0 }
            };
            
            // Force cache clear by adding timestamp to requests
            const timestamp = Date.now();
            
            // Reload fresh data
            await this.loadTransactions(timestamp);
            
            // Reset to dashboard view
            this.currentView = 'dashboard';
            
            // Re-render
            this.render();
            
            // Show success notification
            this.showNotification(`Refreshed! Showing ${this.getMonthName(this.selectedMonth)} ${this.selectedYear}`, 'success');
            
        } catch (error) {
            console.error('Pull refresh error:', error);
            this.showNotification('Refresh failed. Please try again.', 'error');
        }
    }

    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1];
    }

    async showHistoricalView() {
        this.currentView = 'historical';
        
        // Load all necessary data
        await Promise.all([
            this.loadYearlyData(),
            this.loadMonthlyTrends()
        ]);
        
        this.render();
    }

    async showAnalytics() {
        this.currentView = 'analytics';
        
        // Load all analytics data
        await Promise.all([
            this.loadCategories(),
            this.loadMonthlyTrends(),
            this.loadNetWorth()
        ]);
        
        this.render();
    }

    calculateCategorySpent(category) {
        return this.transactions
            .filter(t => t.category === category && t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
    }

    // Reports
    async generateReport() {
        try {
            const response = await fetch('/generate-report');
            if (response.ok) {
                const reportData = await response.json();
                this.showNotification('Report generated successfully!', 'success');
                // Handle report data
            }
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Failed to generate report', 'error');
        }
    }

    showMonthlyReport() {
        const reportContent = document.getElementById('reportContent');
        const monthlyData = this.getMonthlyData();
        
        reportContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Monthly Report</h3>
                </div>
                <div class="card-body">
                    ${monthlyData.map(month => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--bg-secondary);">
                            <span style="font-weight: 500;">${month.month}</span>
                            <div style="text-align: right;">
                                <div style="color: var(--success); font-size: 14px;">Income: ₹${this.formatAmount(month.income)}</div>
                                <div style="color: var(--danger); font-size: 14px;">Expense: ₹${this.formatAmount(month.expense)}</div>
                                <div style="font-weight: 600;">Net: ₹${this.formatAmount(month.net)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showCategoryReport() {
        const reportContent = document.getElementById('reportContent');
        const categoryData = this.getCategoryData();
        
        reportContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Category Report</h3>
                </div>
                <div class="card-body">
                    ${Object.entries(categoryData).map(([category, data]) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--bg-secondary);">
                            <span style="font-weight: 500;">${category}</span>
                            <div style="text-align: right;">
                                <div style="font-weight: 600;">₹${this.formatAmount(data.total)}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">${data.count} transactions</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showSummaryReport() {
        const reportContent = document.getElementById('reportContent');
        
        reportContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Summary Report</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                            <div style="font-size: 24px; font-weight: 700; color: var(--success);">₹${this.formatAmount(this.balance.income)}</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Total Income</div>
                        </div>
                        <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                            <div style="font-size: 24px; font-weight: 700; color: var(--danger);">₹${this.formatAmount(this.balance.expense)}</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Total Expense</div>
                        </div>
                        <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">₹${this.formatAmount(this.balance.total)}</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Net Balance</div>
                        </div>
                    </div>
                    
                    <div style="background: var(--bg-secondary); border-radius: 12px; padding: 16px;">
                        <h4 style="margin-bottom: 16px;">Transaction Summary</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <div style="font-size: 18px; font-weight: 600;">${this.transactions.filter(t => t.type === 'income').length}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Income Transactions</div>
                            </div>
                            <div>
                                <div style="font-size: 18px; font-weight: 600;">${this.transactions.filter(t => t.type === 'expense').length}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Expense Transactions</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Charts
    async loadCharts() {
        setTimeout(() => {
            this.createMonthlyChart();
            this.createCategoryChart();
            this.createIncomeExpenseChart();
        }, 100);
    }

    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const monthlyData = this.getMonthlyChartData();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Income',
                    data: monthlyData.income,
                    borderColor: '#00B894',
                    backgroundColor: 'rgba(0, 184, 148, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Expense',
                    data: monthlyData.expense,
                    borderColor: '#E17055',
                    backgroundColor: 'rgba(225, 112, 85, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: textColor
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor || 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor
                        }
                    }
                }
            }
        });
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categoryData = this.getCategoryChartData();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: [
                        '#6C5CE7',
                        '#A29BFE',
                        '#00B894',
                        '#55EFC4',
                        '#E17055',
                        '#FAB1A0',
                        '#FDCB6E',
                        '#74B9FF',
                        '#FD79A8',
                        '#E84393'
                    ],
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: textColor,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: ₹${data.datasets[0].data[i].toLocaleString()}`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                    pointStyle: 'circle'
                                }));
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    createIncomeExpenseChart() {
        const ctx = document.getElementById('incomeExpenseChart');
        if (!ctx) return;

        const incomeExpenseData = this.getIncomeExpenseChartData();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: incomeExpenseData.labels,
                datasets: [{
                    label: 'Income',
                    data: incomeExpenseData.income,
                    backgroundColor: '#00B894',
                    borderRadius: 8,
                    borderSkipped: false,
                }, {
                    label: 'Expense',
                    data: incomeExpenseData.expense,
                    backgroundColor: '#E17055',
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: textColor
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor || 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor
                        }
                    }
                }
            }
        });
    }

    getMonthlyChartData() {
        const monthlyData = {};
        const last6Months = [];
        
        // Generate last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            last6Months.push(monthKey);
            monthlyData[monthKey] = { month: monthName, income: 0, expense: 0 };
        }
        
        // Populate with transaction data
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyData[monthKey]) {
                const amount = Math.abs(parseFloat(transaction.amount) || 0);
                if (transaction.type === 'income') {
                    monthlyData[monthKey].income += amount;
                } else {
                    monthlyData[monthKey].expense += amount;
                }
            }
        });

        return {
            labels: last6Months.map(key => monthlyData[key].month),
            income: last6Months.map(key => monthlyData[key].income),
            expense: last6Months.map(key => monthlyData[key].expense)
        };
    }

    getCategoryChartData() {
        const categoryData = {};
        
        this.transactions.forEach(transaction => {
            if (transaction.type === 'expense') { // Only show expense categories
                const category = transaction.category || 'Other';
                const amount = Math.abs(parseFloat(transaction.amount) || 0);
                categoryData[category] = (categoryData[category] || 0) + amount;
            }
        });

        const sortedCategories = Object.entries(categoryData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Top 8 categories

        return {
            labels: sortedCategories.map(([category]) => category),
            data: sortedCategories.map(([, amount]) => amount)
        };
    }

    getIncomeExpenseChartData() {
        const monthlyData = {};
        const last6Months = [];
        
        // Generate last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-IN', { month: 'short' });
            last6Months.push(monthKey);
            monthlyData[monthKey] = { month: monthName, income: 0, expense: 0 };
        }
        
        // Populate with transaction data
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyData[monthKey]) {
                const amount = Math.abs(parseFloat(transaction.amount) || 0);
                if (transaction.type === 'income') {
                    monthlyData[monthKey].income += amount;
                } else {
                    monthlyData[monthKey].expense += amount;
                }
            }
        });

        return {
            labels: last6Months.map(key => monthlyData[key].month),
            income: last6Months.map(key => monthlyData[key].income),
            expense: last6Months.map(key => monthlyData[key].expense)
        };
    }

    refreshCharts() {
        // Destroy existing charts
        Chart.helpers.each(Chart.instances, (instance) => {
            instance.destroy();
        });
        
        // Recreate charts
        this.loadCharts();
        this.showNotification('Charts refreshed successfully!', 'success');
    }

    // Smart Features
    async analyzeHistoricalData() {
        try {
            this.showNotification('Analyzing historical data...', 'info');
            const response = await fetch('/analyze-historical-data');
            
            if (response.ok) {
                const analysis = await response.json();
                if (analysis.success) {
                    this.showNotification(`Found ${analysis.totalTransactions} transactions with ${analysis.categories.length} categories`, 'success');
                    
                    // Update categories in forms
                    this.updateCategoriesFromAnalysis(analysis.categories);
                    
                    // Show analysis results
                    console.log('Historical Analysis:', analysis);
                } else {
                    throw new Error(analysis.message);
                }
            } else {
                throw new Error('Failed to analyze data');
            }
        } catch (error) {
            console.error('Error analyzing historical data:', error);
            this.showNotification('Failed to analyze historical data: ' + error.message, 'error');
        }
    }
    
    async migrateHistoricalData() {
        if (!confirm('This will import all historical data from Jan-Sep 2025. Continue?')) {
            return;
        }
        
        try {
            this.showNotification('Migrating historical data... This may take a moment.', 'info');
            const response = await fetch('/migrate-historical-data', { method: 'POST' });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.showNotification(result.message, 'success');
                    // Reload transactions to show migrated data
                    await this.loadTransactions();
                    this.render();
                } else {
                    throw new Error(result.message);
                }
            } else {
                throw new Error('Failed to migrate data');
            }
        } catch (error) {
            console.error('Error migrating historical data:', error);
            this.showNotification('Failed to migrate data: ' + error.message, 'error');
        }
    }
    
    async refreshSmartInsights() {
        try {
            this.showNotification('Analyzing your transactions...', 'info');
            
            // Calculate insights from existing transaction data
            const insights = {
                totalTransactions: this.transactions.length,
                averageExpense: this.balance.expense / (this.transactions.filter(t => t.type === 'expense').length || 1),
                userSplit: this.userSplit,
                topCategories: this.getTopCategories(3),
                monthlyPrediction: this.predictMonthlyExpense(),
                savingsRate: this.balance.income > 0 ? ((this.balance.income - this.balance.expense) / this.balance.income * 100).toFixed(1) : 0
            };
            
            this.smartInsights = insights;
            this.updateSmartInsightsDisplay();
            
            // Also update recurring transactions
            this.detectRecurringTransactions();
            
            this.showNotification('Smart insights updated!', 'success');
        } catch (error) {
            console.error('Error getting smart insights:', error);
            this.showNotification('Failed to analyze: ' + error.message, 'error');
        }
    }
    
    getTopCategories(limit = 5) {
        const categoryTotals = {};
        this.transactions.filter(t => t.type === 'expense').forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(parseFloat(t.amount) || 0);
        });
        
        return Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([category, amount]) => ({ category, amount }));
    }
    
    detectRecurringTransactions() {
        // Group transactions by description and category
        const transactionGroups = {};
        
        this.transactions.forEach(t => {
            const key = `${t.description}-${t.category}`.toLowerCase();
            if (!transactionGroups[key]) {
                transactionGroups[key] = [];
            }
            transactionGroups[key].push(t);
        });
        
        // Find patterns that appear multiple times
        const recurring = [];
        Object.entries(transactionGroups).forEach(([key, transactions]) => {
            if (transactions.length >= 2) {
                const avgAmount = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0) / transactions.length;
                recurring.push({
                    description: transactions[0].description,
                    category: transactions[0].category,
                    type: transactions[0].type,
                    frequency: transactions.length,
                    avgAmount: avgAmount,
                    lastDate: transactions[transactions.length - 1].date
                });
            }
        });
        
        // Update the recurring transactions display
        this.updateRecurringTransactionsDisplay(recurring);
    }
    
    updateRecurringTransactionsDisplay(recurring) {
        const container = document.getElementById('recurringTransactionsContent');
        if (!container) return;
        
        if (recurring.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="empty-state-title">No Recurring Patterns Found</h3>
                    <p class="empty-state-description">We haven't detected any recurring transactions yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
                ${recurring.map(r => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${r.description}</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">${r.category} • Appears ${r.frequency} times</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: ${r.type === 'income' ? 'var(--success)' : 'var(--danger)'};">
                                ₹${this.formatAmount(r.avgAmount)}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">avg amount</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    updateCategoriesFromAnalysis(categories) {
        // Store categories for use in forms
        this.discoveredCategories = categories;
        console.log('Updated categories from historical data:', categories);
    }
    
    updateSmartInsightsDisplay() {
        const container = document.getElementById('smartInsightsContent');
        if (!container || !this.smartInsights) return;
        
        const insights = this.smartInsights;
        const prediction = this.predictMonthlyExpense();
        const dailyAvg = this.balance.expense / new Date().getDate();
        const savingsRate = insights.savingsRate || 0;
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-lg);">
                <div class="insight-card">
                    <h4 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Monthly Prediction</h4>
                    <p style="color: var(--text-secondary); font-size: 14px;">Based on current trends, you're likely to spend <strong style="color: var(--text-primary);">₹${this.formatAmount(prediction)}</strong> this month.</p>
                </div>
                
                <div class="insight-card">
                    <h4 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Spending Pattern</h4>
                    <p style="color: var(--text-secondary); font-size: 14px;">Your average daily expense is <strong style="color: var(--text-primary);">₹${this.formatAmount(dailyAvg)}</strong>.</p>
                </div>
                
                <div class="insight-card">
                    <h4 style="color: var(--text-primary); margin-bottom: var(--space-sm);">User Comparison</h4>
                    <p style="color: var(--text-secondary); font-size: 14px;">
                        <span style="color: var(--text-primary);"><strong>Ashi:</strong> ₹${this.formatAmount(insights.userSplit?.ashi?.expense || 0)}</span><br>
                        <span style="color: var(--text-primary);"><strong>Sanju:</strong> ₹${this.formatAmount(insights.userSplit?.sanju?.expense || 0)}</span>
                    </p>
                </div>
                
                <div class="insight-card">
                    <h4 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Savings Rate</h4>
                    <p style="color: var(--text-secondary); font-size: 14px;">You're saving <strong style="color: ${savingsRate > 20 ? 'var(--success)' : 'var(--warning)'};">${savingsRate}%</strong> of your income.</p>
                </div>
                
                <div class="insight-card">
                    <h4 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Top Categories</h4>
                    <div style="display: flex; flex-direction: column; gap: var(--space-xs); color: var(--text-secondary); font-size: 14px;">
                        ${insights.topCategories?.slice(0, 3).map(cat => 
                            `<div style="display: flex; justify-content: space-between;">
                                <span>${cat.category}</span>
                                <strong style="color: var(--text-primary);">₹${this.formatAmount(cat.amount)}</strong>
                            </div>`
                        ).join('') || '<p>No categories yet</p>'}
                    </div>
                </div>
            </div>
        `;
    }
    
    predictMonthlyExpense() {
        const currentDay = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const dailyAverage = this.balance.expense / currentDay;
        return dailyAverage * daysInMonth;
    }

    // Financial Insights & Savings Optimization
    async loadFinancialInsights() {
        try {
            const container = document.getElementById('financialInsightsContainer');
            if (!container) return;

            // Show loading state
            container.innerHTML = `
                <div class="loading-state" style="text-align: center; padding: var(--space-xxl);">
                    <svg class="loading-spinner" style="width: 48px; height: 48px; animation: spin 1s linear infinite; color: var(--primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <h3 style="margin-top: var(--space-lg); color: var(--text-primary);">Analyzing Your Financial Data...</h3>
                </div>
            `;

            // Fetch insights from API
            const response = await fetch('/api/financial-insights');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load insights');
            }

            // Render the insights
            this.renderFinancialInsightsUI(data);

        } catch (error) {
            console.error('Error loading financial insights:', error);
            const container = document.getElementById('financialInsightsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="error-state" style="text-align: center; padding: var(--space-xxl);">
                        <svg style="width: 48px; height: 48px; color: var(--danger);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="margin-top: var(--space-lg); color: var(--text-primary);">Failed to Load Insights</h3>
                        <p style="color: var(--text-secondary); margin-top: var(--space-sm);">${error.message}</p>
                        <button class="btn btn-primary" style="margin-top: var(--space-lg);" onclick="expensoUI.loadFinancialInsights()">Try Again</button>
                    </div>
                `;
            }
        }
    }

    renderFinancialInsightsUI(data) {
        const container = document.getElementById('financialInsightsContainer');
        if (!container) return;

        const { summary, categoryInsights, trendHighlights, behavioralInsights, actionableSuggestions, financialHealthScore } = data;

        container.innerHTML = `
            <!-- Financial Health Score -->
            <div class="card mb-lg" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);">
                <div class="card-body" style="text-align: center; padding: var(--space-xxl);">
                    <h3 style="color: white; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: var(--space-md);">Financial Health Score</h3>
                    <div style="font-size: 64px; font-weight: 700; color: white; margin-bottom: var(--space-sm);">${financialHealthScore.score}</div>
                    <div style="font-size: 18px; color: rgba(255,255,255,0.9); margin-bottom: var(--space-lg);">${financialHealthScore.rating}</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-md); margin-top: var(--space-xl);">
                        <div style="background: rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: var(--space-md);">
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px;">Savings</div>
                            <div style="color: white; font-size: 20px; font-weight: 600;">${financialHealthScore.breakdown.savingsRate}/40</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: var(--space-md);">
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px;">Balance</div>
                            <div style="color: white; font-size: 20px; font-weight: 600;">${financialHealthScore.breakdown.spendingBalance}/30</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: var(--space-md);">
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px;">Consistency</div>
                            <div style="color: white; font-size: 20px; font-weight: 600;">${financialHealthScore.breakdown.consistency}/20</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: var(--space-md);">
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px;">Control</div>
                            <div style="color: white; font-size: 20px; font-weight: 600;">${financialHealthScore.breakdown.anomalyControl}/10</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-xl);">
                <div class="card">
                    <div class="card-body">
                        <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-xs);">Current Month Income</div>
                        <div style="font-size: 28px; font-weight: 700; color: var(--success); margin-bottom: var(--space-sm);">₹${this.formatAmount(summary.currentMonth.income)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">
                            ${trendHighlights.incomeGrowth > 0 ? '↑' : '↓'} ${Math.abs(trendHighlights.incomeGrowth)}% from last month
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-xs);">Current Month Expense</div>
                        <div style="font-size: 28px; font-weight: 700; color: var(--danger); margin-bottom: var(--space-sm);">₹${this.formatAmount(summary.currentMonth.expense)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">
                            ${trendHighlights.expenseGrowth > 0 ? '↑' : '↓'} ${Math.abs(trendHighlights.expenseGrowth)}% from last month
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-xs);">Current Savings</div>
                        <div style="font-size: 28px; font-weight: 700; color: var(--primary); margin-bottom: var(--space-sm);">₹${this.formatAmount(summary.currentMonth.savings)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">
                            ${summary.currentMonth.savingsRate}% savings rate
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-xs);">3-Month Average</div>
                        <div style="font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-sm);">₹${this.formatAmount(summary.last3MonthsAverage.avgSavings)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">
                            ${summary.last3MonthsAverage.avgSavingsRate}% avg savings rate
                        </div>
                    </div>
                </div>
            </div>

            <!-- 50/30/20 Rule Visualization -->
            <div class="card mb-lg">
                <div class="card-header">
                    <h3 class="card-title">Spending Balance (50/30/20 Rule)</h3>
                </div>
                <div class="card-body">
                    <div style="margin-bottom: var(--space-lg);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
                            <span style="color: var(--text-secondary);">Needs (Target: 50%)</span>
                            <span style="color: var(--text-primary); font-weight: 600;">${categoryInsights.needsVsWants.needsPercentage}%</span>
                        </div>
                        <div style="background: var(--bg-secondary); border-radius: 8px; height: 12px; overflow: hidden;">
                            <div style="background: var(--success); height: 100%; width: ${Math.min(categoryInsights.needsVsWants.needsPercentage, 100)}%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: var(--space-lg);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
                            <span style="color: var(--text-secondary);">Wants (Target: 30%)</span>
                            <span style="color: var(--text-primary); font-weight: 600;">${categoryInsights.needsVsWants.wantsPercentage}%</span>
                        </div>
                        <div style="background: var(--bg-secondary); border-radius: 8px; height: 12px; overflow: hidden;">
                            <div style="background: var(--warning); height: 100%; width: ${Math.min(categoryInsights.needsVsWants.wantsPercentage, 100)}%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
                            <span style="color: var(--text-secondary);">Savings (Target: 20%)</span>
                            <span style="color: var(--text-primary); font-weight: 600;">${categoryInsights.needsVsWants.savingsPercentage}%</span>
                        </div>
                        <div style="background: var(--bg-secondary); border-radius: 8px; height: 12px; overflow: hidden;">
                            <div style="background: var(--primary); height: 100%; width: ${Math.min(categoryInsights.needsVsWants.savingsPercentage, 100)}%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Categories -->
            <div class="card mb-lg">
                <div class="card-header">
                    <h3 class="card-title">Top Spending Categories</h3>
                </div>
                <div class="card-body">
                    ${categoryInsights.topCategories.map((cat, index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--space-sm);">
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">#${index + 1} ${cat.category}</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">
                                    ${cat.count} transactions • ${cat.percentageOfIncome}% of income
                                    ${cat.monthOverMonthChange ? ` • ${cat.monthOverMonthChange > 0 ? '↑' : '↓'} ${Math.abs(cat.monthOverMonthChange)}% MoM` : ''}
                                </div>
                            </div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--danger);">₹${this.formatAmount(cat.amount)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Behavioral Insights -->
            <div class="card mb-lg">
                <div class="card-header">
                    <h3 class="card-title">Expert Insights</h3>
                    <span style="font-size: 12px; color: var(--text-secondary);">Based on principles from Ramit Sethi, Dave Ramsey, and more</span>
                </div>
                <div class="card-body">
                    ${behavioralInsights.map(insight => {
                        const icons = {
                            positive: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
                            warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>',
                            critical: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
                            info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                        };
                        const colors = {
                            positive: 'var(--success)',
                            warning: 'var(--warning)',
                            critical: 'var(--danger)',
                            info: 'var(--primary)'
                        };
                        return `
                            <div style="display: flex; gap: var(--space-md); padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--space-sm); border-left: 4px solid ${colors[insight.type]};">
                                <svg style="width: 24px; height: 24px; flex-shrink: 0; color: ${colors[insight.type]};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    ${icons[insight.type]}
                                </svg>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${insight.category}</div>
                                    <div style="color: var(--text-secondary); line-height: 1.5;">${insight.message}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Actionable Suggestions -->
            <div class="card mb-lg">
                <div class="card-header">
                    <h3 class="card-title">Action Plan</h3>
                    <span style="font-size: 12px; color: var(--text-secondary);">Prioritized steps to improve your financial health</span>
                </div>
                <div class="card-body">
                    ${actionableSuggestions.map((suggestion, index) => `
                        <div style="display: flex; gap: var(--space-md); padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
                            <div style="flex-shrink: 0; width: 32px; height: 32px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                                ${index + 1}
                            </div>
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-xs);">
                                    <h4 style="font-weight: 600; color: var(--text-primary); margin: 0;">${suggestion.action}</h4>
                                    <span style="font-size: 12px; padding: 4px 8px; background: ${suggestion.impact === 'high' ? 'var(--danger)' : suggestion.impact === 'medium' ? 'var(--warning)' : 'var(--primary)'}; color: white; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${suggestion.impact} impact</span>
                                </div>
                                <p style="color: var(--text-secondary); margin: 0; line-height: 1.5;">${suggestion.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Period Summary -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Analysis Period</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-md);">
                        <div>
                            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Current Month</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${data.period.current}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Last Month</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${data.period.lastMonth}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">3-Month Period</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${data.period.last3Months}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Transactions Analyzed</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${summary.currentMonth.transactions}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility methods
    formatAmount(amount) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    getMonthlyData() {
        const monthlyData = {};
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthName, income: 0, expense: 0, net: 0 };
            }
            
            const amount = Math.abs(parseFloat(transaction.amount) || 0);
            if (transaction.type === 'income') {
                monthlyData[monthKey].income += amount;
            } else {
                monthlyData[monthKey].expense += amount;
            }
            monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expense;
        });
        
        return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
    }

    getCategoryData() {
        const categoryData = {};
        
        this.transactions.forEach(transaction => {
            const category = transaction.category;
            const amount = Math.abs(parseFloat(transaction.amount) || 0);
            
            if (!categoryData[category]) {
                categoryData[category] = { total: 0, count: 0 };
            }
            
            categoryData[category].total += amount;
            categoryData[category].count += 1;
        });
        
        return categoryData;
    }

    showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 2000; padding: 16px 20px; border-radius: 8px; color: white; font-weight: 500; animation: slideIn 0.3s ease; background: ${
                type === 'success' ? 'var(--success)' : 
                type === 'error' ? 'var(--danger)' : 
                type === 'warning' ? 'var(--warning)' : 
                'var(--info)'
            };">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    bindEvents() {
        // Only bind once
        if (this.eventsBound) return;
        this.eventsBound = true;
        
        // Handle modal clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.add('hidden');
            }
            
            // Handle transaction card clicks using event delegation
            const transactionCard = e.target.closest('.transaction-card');
            if (transactionCard && transactionCard.hasAttribute('data-transaction-id')) {
                const transactionId = transactionCard.getAttribute('data-transaction-id');
                console.log('Transaction clicked:', transactionId);
                this.showTransactionDetails(transactionId);
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const visibleModal = document.querySelector('.modal-overlay:not(.hidden)');
                if (visibleModal) {
                    visibleModal.classList.add('hidden');
                }
            }
        });
    }

    renderHistoricalView() {
        return `
            <div class="header-with-back">
                <button class="btn-back" onclick="expensoUI.currentView='dashboard'; expensoUI.render();">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <h2>Historical Data</h2>
            </div>

            <!-- Yearly Summary -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">2025 Yearly Summary</h3>
                </div>
                <div class="card-body">
                    ${this.yearlyData ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">
                            <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                                <div style="font-size: 24px; font-weight: 700; color: var(--success);">₹${this.formatAmount(this.yearlyData.totalIncome)}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Total Income</div>
                            </div>
                            <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                                <div style="font-size: 24px; font-weight: 700; color: var(--danger);">₹${this.formatAmount(this.yearlyData.totalExpense)}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Total Expense</div>
                            </div>
                            <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                                <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">₹${this.formatAmount(this.yearlyData.savings)}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Net Savings</div>
                            </div>
                        </div>
                        <div style="margin-top: 16px;">
                            <h4 style="margin-bottom: 12px; color: var(--text-primary);">Monthly Breakdown</h4>
                            ${this.yearlyData.monthlyBreakdownArray && this.yearlyData.monthlyBreakdownArray.length > 0 ? this.yearlyData.monthlyBreakdownArray.map(month => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--bg-secondary);">
                                    <span style="font-weight: 500; color: var(--text-primary);">${month.month}</span>
                                    <div style="text-align: right;">
                                        <div style="color: var(--success); font-size: 14px;">+₹${this.formatAmount(month.income)}</div>
                                        <div style="color: var(--danger); font-size: 14px;">-₹${this.formatAmount(month.expense)}</div>
                                        <div style="font-weight: 600; color: var(--text-primary);">₹${this.formatAmount(month.net)}</div>
                                    </div>
                                </div>
                            `).join('') : '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No monthly data available</div>'}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <div>Loading yearly summary...</div>
                        </div>
                    `}
                </div>
            </div>

            <!-- Monthly Trends Chart -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Monthly Trends</h3>
                </div>
                <div class="card-body">
                    <canvas id="trendsChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    }

    renderAnalytics() {
        return `
            <div class="header-with-back">
                <button class="btn-back" onclick="expensoUI.currentView='dashboard'; expensoUI.render();">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <h2>Analytics Dashboard</h2>
            </div>

            <!-- Net Worth Card -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Net Worth Tracking</h3>
                </div>
                <div class="card-body">
                    ${this.netWorth ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-bottom: 24px;">
                            <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                                <div style="font-size: 20px; font-weight: 700; color: var(--success);">₹${this.formatAmount(this.netWorth.totalSavings)}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Total Savings</div>
                            </div>
                            <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                                <div style="font-size: 20px; font-weight: 700; color: var(--primary);">₹${this.formatAmount(this.netWorth.totalInvestments)}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Total Investments</div>
                            </div>
                            <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">
                                <div style="font-size: 20px; font-weight: 700; color: var(--text-primary);">₹${this.formatAmount(this.netWorth.netWorth)}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Net Worth</div>
                            </div>
                        </div>
                        <div style="margin-top: 16px;">
                            <h4 style="margin-bottom: 12px; color: var(--text-primary);">Monthly Net Worth Growth</h4>
                            ${this.netWorth.monthlyGrowth && this.netWorth.monthlyGrowth.length > 0 ? this.netWorth.monthlyGrowth.map(month => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--bg-secondary);">
                                    <span style="font-weight: 500; color: var(--text-primary);">${month.month}</span>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: ${month.growth >= 0 ? 'var(--success)' : 'var(--danger)'};">
                                            ${month.growth >= 0 ? '+' : ''}₹${this.formatAmount(Math.abs(month.growth))}
                                        </div>
                                        <div style="font-size: 14px; color: var(--text-secondary);">₹${this.formatAmount(month.netWorth)}</div>
                                    </div>
                                </div>
                            `).join('') : '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No growth data available</div>'}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <div>Loading net worth data...</div>
                        </div>
                    `}
                </div>
            </div>

            <!-- Category Analysis -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Category Analysis</h3>
                </div>
                <div class="card-body">
                    ${this.categories && this.categories.length ? `
                        ${this.categories.map(category => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--bg-secondary);">
                                <div>
                                    <span style="font-weight: 500; color: var(--text-primary);">${category.category}</span>
                                    <div style="font-size: 14px; color: var(--text-secondary);">${category.transactionCount} transactions</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 600; color: var(--danger);">₹${this.formatAmount(category.totalAmount)}</div>
                                    <div style="font-size: 14px; color: var(--text-secondary);">${this.balance.expense > 0 ? ((category.totalAmount / this.balance.expense) * 100).toFixed(1) : '0.0'}%</div>
                                </div>
                            </div>
                        `).join('')}
                    ` : `
                        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <div>Loading category analysis...</div>
                        </div>
                    `}
                </div>
            </div>

            <!-- Monthly Trends Chart -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Monthly Comparison</h3>
                </div>
                <div class="card-body">
                    <canvas id="analyticsChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    }
}

// Initialize the app
window.expensoUI = null;
document.addEventListener('DOMContentLoaded', () => {
    window.expensoUI = new ExpensoUI();
});

// Add slide animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);