/**
 * 🎯 Frame-Based Modern UI - Interactive Dashboard System
 * Creative approach to replace traditional buttons with interactive frames
 */

class FrameUI {
    constructor() {
        this.isInitialized = false;
        this.activeModal = null;
        this.frames = new Map();
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.loadStyles();
        this.createActionFrames();
        this.setupKeyboardShortcuts();
        this.setupModalSystem();
        this.isInitialized = true;
        
        console.log('✨ Frame UI initialized - Creative dashboard ready');
        
        // Set up automatic stats refresh
        this.setupStatsRefresh();
    }

    loadStyles() {
        // Remove any existing styles
        const existingStyles = document.querySelectorAll('link[href*="minimal-dark"], link[href*="modern-enhancements"]');
        existingStyles.forEach(style => style.remove());

        // Load frame-based UI styles
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/frame-ui.css';
        document.head.appendChild(link);
    }

    createActionFrames() {
        // Find the existing button container
        const buttonContainer = document.querySelector('.action-buttons') || 
                               document.querySelector('div[style*="text-align: center"]') ||
                               this.findButtonContainer();

        if (!buttonContainer) {
            console.log('Creating new frame container');
            this.createFrameContainer();
            return;
        }

        // Replace button container with frame container
        const frameContainer = document.createElement('div');
        frameContainer.className = 'action-frames';
        frameContainer.innerHTML = `
            <div class="action-frame expense" onclick="window.frameUI.openFrame('expense')">
                <div class="frame-icon">💸</div>
                <div class="frame-title">Add Expense</div>
                <div class="frame-description">Track your spending</div>
            </div>
            
            <div class="action-frame income" onclick="window.frameUI.openFrame('income')">
                <div class="frame-icon">💰</div>
                <div class="frame-title">Add Income</div>
                <div class="frame-description">Record earnings</div>
            </div>
            
            <div class="action-frame summary" onclick="window.frameUI.openFrame('summary')">
                <div class="frame-icon">📊</div>
                <div class="frame-title">View Summary</div>
                <div class="frame-description">Analyze your financial data</div>
            </div>
        `;

        // Replace the old container
        buttonContainer.parentNode.replaceChild(frameContainer, buttonContainer);
        
        // Add additional feature frames
        const additionalFrames = document.createElement('div');
        additionalFrames.className = 'action-frames';
        additionalFrames.style.marginTop = '1.5rem';
        additionalFrames.innerHTML = `
            <div class="action-frame" style="border-color: #f59e0b;" onclick="window.frameUI.openFrame('search')">
                <div class="frame-icon">🔍</div>
                <div class="frame-title" style="color: #f59e0b;">Search</div>
                <div class="frame-description">Find transactions</div>
            </div>
            
            <div class="action-frame" style="border-color: #8b5cf6;" onclick="window.frameUI.openFrame('budget')">
                <div class="frame-icon">💰</div>
                <div class="frame-title" style="color: #8b5cf6;">Budget</div>
                <div class="frame-description">Manage budgets</div>
            </div>
            
            <div class="action-frame" style="border-color: #06b6d4;" onclick="window.frameUI.openFrame('reports')">
                <div class="frame-icon">📋</div>
                <div class="frame-title" style="color: #06b6d4;">Reports</div>
                <div class="frame-description">Financial reports</div>
            </div>
            
            <div class="action-frame" style="border-color: #10b981;" onclick="window.frameUI.openFrame('charts')">
                <div class="frame-icon">📈</div>
                <div class="frame-title" style="color: #10b981;">Charts</div>
                <div class="frame-description">Visual analytics</div>
            </div>
            
            <div class="action-frame" style="border-color: #f97316;" onclick="window.frameUI.openFrame('recurring')">
                <div class="frame-icon">🔄</div>
                <div class="frame-title" style="color: #f97316;">Recurring</div>
                <div class="frame-description">Auto transactions</div>
            </div>
            
            <div class="action-frame" style="border-color: #ec4899;" onclick="window.frameUI.openFrame('settings')">
                <div class="frame-icon">⚙️</div>
                <div class="frame-title" style="color: #ec4899;">Settings</div>
                <div class="frame-description">App preferences</div>
            </div>
        `;
        
        frameContainer.parentNode.appendChild(additionalFrames);

        // Store frame references
        this.frames.set('expense', frameContainer.querySelector('.expense'));
        this.frames.set('income', frameContainer.querySelector('.income'));
        this.frames.set('summary', frameContainer.querySelector('.summary'));

        // Add quick stats if data is available
        this.createStatsFrames();
        
        // Update stats with real data after a short delay
        setTimeout(() => this.updateStats(), 1000);
    }

    findButtonContainer() {
        // Try to find buttons and their container
        const buttons = document.querySelectorAll('button[onclick*="expense"], button[onclick*="income"], button[onclick*="summary"]');
        if (buttons.length > 0) {
            return buttons[0].parentElement;
        }
        
        // Fallback: find container div
        const containers = document.querySelectorAll('div');
        for (let container of containers) {
            const buttonCount = container.querySelectorAll('button').length;
            if (buttonCount >= 2) {
                return container;
            }
        }
        
        return null;
    }

    createFrameContainer() {
        // Create main container if it doesn't exist
        let mainContainer = document.querySelector('.container');
        if (!mainContainer) {
            mainContainer = document.createElement('div');
            mainContainer.className = 'container';
            document.body.appendChild(mainContainer);
        }

        // Add title if not present
        if (!mainContainer.querySelector('h1')) {
            const title = document.createElement('h1');
            title.textContent = 'Family Expense Tracker';
            mainContainer.prepend(title);
        }

        // Create main action frames
        const frameContainer = document.createElement('div');
        frameContainer.className = 'action-frames';
        frameContainer.innerHTML = `
            <div class="action-frame expense" onclick="window.frameUI.openFrame('expense')">
                <div class="frame-icon">💸</div>
                <div class="frame-title">Add Expense</div>
                <div class="frame-description">Track your spending</div>
            </div>
            
            <div class="action-frame income" onclick="window.frameUI.openFrame('income')">
                <div class="frame-icon">💰</div>
                <div class="frame-title">Add Income</div>
                <div class="frame-description">Record earnings</div>
            </div>
            
            <div class="action-frame summary" onclick="window.frameUI.openFrame('summary')">
                <div class="frame-icon">📊</div>
                <div class="frame-title">View Summary</div>
                <div class="frame-description">Analyze your financial data</div>
            </div>
        `;

        mainContainer.appendChild(frameContainer);
        
        // Create additional feature frames
        const additionalFrames = document.createElement('div');
        additionalFrames.className = 'action-frames';
        additionalFrames.style.marginTop = '1.5rem';
        additionalFrames.innerHTML = `
            <div class="action-frame" style="border-color: var(--accent-warning);" onclick="window.frameUI.openFrame('search')">
                <div class="frame-icon">🔍</div>
                <div class="frame-title" style="color: #f59e0b;">Search</div>
                <div class="frame-description">Find transactions</div>
            </div>
            
            <div class="action-frame" style="border-color: #8b5cf6;" onclick="window.frameUI.openFrame('budget')">
                <div class="frame-icon">💰</div>
                <div class="frame-title" style="color: #8b5cf6;">Budget</div>
                <div class="frame-description">Manage budgets</div>
            </div>
            
            <div class="action-frame" style="border-color: #06b6d4;" onclick="window.frameUI.openFrame('reports')">
                <div class="frame-icon">📋</div>
                <div class="frame-title" style="color: #06b6d4;">Reports</div>
                <div class="frame-description">Financial reports</div>
            </div>
            
            <div class="action-frame" style="border-color: #10b981;" onclick="window.frameUI.openFrame('charts')">
                <div class="frame-icon">📈</div>
                <div class="frame-title" style="color: #10b981;">Charts</div>
                <div class="frame-description">Visual analytics</div>
            </div>
            
            <div class="action-frame" style="border-color: #f97316;" onclick="window.frameUI.openFrame('recurring')">
                <div class="frame-icon">🔄</div>
                <div class="frame-title" style="color: #f97316;">Recurring</div>
                <div class="frame-description">Auto transactions</div>
            </div>
            
            <div class="action-frame" style="border-color: #ec4899;" onclick="window.frameUI.openFrame('settings')">
                <div class="frame-icon">⚙️</div>
                <div class="frame-title" style="color: #ec4899;">Settings</div>
                <div class="frame-description">App preferences</div>
            </div>
        `;

        mainContainer.appendChild(additionalFrames);
        
        // Create stats frames and update with real data
        this.createStatsFrames();
        setTimeout(() => this.updateStats(), 1000);
    }

    createStatsFrames() {
        const mainContainer = document.querySelector('.container');
        if (!mainContainer) return;

        const statsContainer = document.createElement('div');
        statsContainer.innerHTML = `
            <div class="stats-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="color: var(--text-primary); font-size: 1.125rem; font-weight: 600; margin: 0;">📊 Current Month Stats</h3>
                <button class="refresh-btn" onclick="window.frameUI.updateStats()" style="
                    background: var(--bg-card); 
                    border: 1px solid var(--border-primary); 
                    border-radius: var(--radius-md); 
                    color: var(--text-secondary); 
                    padding: 0.5rem; 
                    cursor: pointer; 
                    font-size: 1rem;
                    transition: all 0.15s ease;
                " title="Refresh Stats">🔄</button>
            </div>
            <div class="stats-frames">
                <div class="stat-frame">
                    <div class="stat-value" style="color: var(--accent-expense);" id="totalExpenseFrame">₹0</div>
                    <div class="stat-label">This Month Expenses</div>
                </div>
                
                <div class="stat-frame">
                    <div class="stat-value" style="color: var(--accent-income);" id="totalIncomeFrame">₹0</div>
                    <div class="stat-label">This Month Income</div>
                </div>
                
                <div class="stat-frame">
                    <div class="stat-value" id="netBalanceFrame">₹0</div>
                    <div class="stat-label">Net Balance</div>
                </div>
                
                <div class="stat-frame">
                    <div class="stat-value" style="color: var(--accent-neutral);" id="transactionCountFrame">0</div>
                    <div class="stat-label">Transactions</div>
                </div>
            </div>
        `;

        // Add hover effect to refresh button
        statsContainer.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('refresh-btn')) {
                e.target.style.background = 'var(--bg-hover)';
                e.target.style.color = 'var(--text-primary)';
                e.target.style.transform = 'rotate(180deg)';
            }
        });

        statsContainer.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('refresh-btn')) {
                e.target.style.background = 'var(--bg-card)';
                e.target.style.color = 'var(--text-secondary)';
                e.target.style.transform = 'rotate(0deg)';
            }
        });

        mainContainer.appendChild(statsContainer);

        // Update stats if functions are available
        this.updateStats();
    }

    openFrame(type) {
        console.log(`Opening ${type} frame`);
        
        // Add loading state to frame
        const frame = this.frames.get(type);
        if (frame) {
            frame.classList.add('frame-loading');
            setTimeout(() => frame.classList.remove('frame-loading'), 500);
        }

        switch (type) {
            case 'expense':
                this.showExpenseModal();
                break;
            case 'income':
                this.showIncomeModal();
                break;
            case 'summary':
                this.showSummaryModal();
                break;
            case 'search':
                this.showSearchModal();
                break;
            case 'budget':
                this.showBudgetModal();
                break;
            case 'reports':
                this.showReportsModal();
                break;
            case 'charts':
                this.showChartsModal();
                break;
            case 'recurring':
                this.showRecurringModal();
                break;
            case 'settings':
                this.showSettingsModal();
                break;
            default:
                console.log(`Unknown frame type: ${type}`);
        }
    }

    showExpenseModal() {
        const modal = this.createModal('Add Expense', `
            <div class="form-group">
                <label class="form-label">Amount</label>
                <input type="number" class="form-input" id="expenseAmount" placeholder="Enter amount">
            </div>
            
            <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-select" id="expenseCategory">
                    <option value="">Select category</option>
                    <option value="Food">🍔 Food</option>
                    <option value="Clothes">👕 Clothes</option>
                    <option value="Fuel">⛽ Fuel</option>
                    <option value="EMI">🏦 EMI</option>
                    <option value="Recharge">📱 Recharge</option>
                    <option value="Home AHM">🏠 Home AHM</option>
                    <option value="Home Torna">🏡 Home Torna</option>
                    <option value="Other">📦 Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" class="form-input" id="expenseDescription" placeholder="Add description">
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.submitExpense()">
                💸 Add Expense
            </button>
        `);

        // Focus on amount input
        setTimeout(() => {
            const amountInput = modal.querySelector('#expenseAmount');
            if (amountInput) amountInput.focus();
        }, 100);
    }

    showIncomeModal() {
        const modal = this.createModal('Add Income', `
            <div class="form-group">
                <label class="form-label">Amount</label>
                <input type="number" class="form-input" id="incomeAmount" placeholder="Enter amount">
            </div>
            
            <div class="form-group">
                <label class="form-label">Source</label>
                <select class="form-select" id="incomeCategory">
                    <option value="">Select source</option>
                    <option value="Salary">💼 Salary</option>
                    <option value="Freelance">💻 Freelance</option>
                    <option value="Investment">📈 Investment</option>
                    <option value="Business">🏢 Business</option>
                    <option value="Other">💰 Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" class="form-input" id="incomeDescription" placeholder="Add description">
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.submitIncome()">
                💰 Add Income
            </button>
        `);

        // Focus on amount input
        setTimeout(() => {
            const amountInput = modal.querySelector('#incomeAmount');
            if (amountInput) amountInput.focus();
        }, 100);
    }

    showSummaryModal() {
        const now = new Date();
        const currentMonth = now.toLocaleString('en-US', { month: 'long' });
        const currentYear = now.getFullYear().toString().slice(-2);
        
        const modal = this.createModal('Financial Summary', `
            <div class="form-group">
                <label class="form-label">Select Month</label>
                <select class="form-select" id="summaryMonth">
                    <option value="January" ${currentMonth === 'January' ? 'selected' : ''}>📅 January</option>
                    <option value="February" ${currentMonth === 'February' ? 'selected' : ''}>📅 February</option>
                    <option value="March" ${currentMonth === 'March' ? 'selected' : ''}>📅 March</option>
                    <option value="April" ${currentMonth === 'April' ? 'selected' : ''}>📅 April</option>
                    <option value="May" ${currentMonth === 'May' ? 'selected' : ''}>📅 May</option>
                    <option value="June" ${currentMonth === 'June' ? 'selected' : ''}>📅 June</option>
                    <option value="July" ${currentMonth === 'July' ? 'selected' : ''}>📅 July</option>
                    <option value="August" ${currentMonth === 'August' ? 'selected' : ''}>📅 August</option>
                    <option value="September" ${currentMonth === 'September' ? 'selected' : ''}>📅 September</option>
                    <option value="October" ${currentMonth === 'October' ? 'selected' : ''}>📅 October</option>
                    <option value="November" ${currentMonth === 'November' ? 'selected' : ''}>📅 November</option>
                    <option value="December" ${currentMonth === 'December' ? 'selected' : ''}>📅 December</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Select Year</label>
                <select class="form-select" id="summaryYear">
                    <option value="23" ${currentYear === '23' ? 'selected' : ''}>2023</option>
                    <option value="24" ${currentYear === '24' ? 'selected' : ''}>2024</option>
                    <option value="25" ${currentYear === '25' ? 'selected' : ''}>2025</option>
                    <option value="26" ${currentYear === '26' ? 'selected' : ''}>2026</option>
                    <option value="27">2027</option>
                    <option value="28">2028</option>
                </select>
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.fetchSummary()">
                📊 Get Summary
            </button>
            
            <div id="summaryResults" style="margin-top: 1.5rem; display: none;">
                <!-- Summary results will be displayed here -->
            </div>
        `);
    }

    showSearchModal() {
        const modal = this.createModal('🔍 Search Transactions', `
            <div class="form-group">
                <label class="form-label">Search Term</label>
                <input type="text" class="form-input" id="searchTerm" placeholder="Description, category, amount...">
            </div>
            
            <div class="form-group">
                <label class="form-label">Transaction Type</label>
                <select class="form-select" id="searchType">
                    <option value="">All Types</option>
                    <option value="expense">💸 Expenses Only</option>
                    <option value="income">💰 Income Only</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Amount Range</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <input type="number" class="form-input" id="searchMinAmount" placeholder="Min ₹">
                    <input type="number" class="form-input" id="searchMaxAmount" placeholder="Max ₹">
                </div>
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.performSearch()">
                🔍 Search Transactions
            </button>
            
            <div id="summaryResults" style="margin-top: 1.5rem; display: none;">
                <!-- Search results will be displayed here -->
            </div>
        `);
    }

    showBudgetModal() {
        const modal = this.createModal('💰 Budget Management', `
            <div class="form-group">
                <label class="form-label">Budget Category</label>
                <select class="form-select" id="budgetCategory">
                    <option value="Food">🍔 Food</option>
                    <option value="Clothes">👕 Clothes</option>
                    <option value="Fuel">⛽ Fuel</option>
                    <option value="total">🎯 Total Monthly Budget</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Budget Amount</label>
                <input type="number" class="form-input" id="budgetAmount" placeholder="Enter budget amount">
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.setBudget()">
                💰 Set Budget
            </button>
        `);
    }

    showReportsModal() {
        const modal = this.createModal('📋 Financial Reports', `
            <div class="form-group">
                <label class="form-label">Report Type</label>
                <select class="form-select" id="reportType">
                    <option value="monthly">📅 Monthly Report</option>
                    <option value="quarterly">📅 Quarterly Report</option>
                    <option value="yearly">📅 Yearly Report</option>
                </select>
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.generateReport()">
                📊 Generate Report
            </button>
        `);
    }

    showChartsModal() {
        const modal = this.createModal('📈 Financial Charts', `
            <div class="form-group">
                <label class="form-label">Chart Period</label>
                <select class="form-select" id="chartPeriod">
                    <option value="currentMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="last3Months">Last 3 Months</option>
                </select>
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.generateCharts()">
                📊 Generate Charts
            </button>
        `);
    }

    showRecurringModal() {
        const modal = this.createModal('🔄 Recurring Transactions', `
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" class="form-input" id="recurringDescription" placeholder="e.g., Monthly Salary">
            </div>
            
            <div class="form-group">
                <label class="form-label">Amount</label>
                <input type="number" class="form-input" id="recurringAmount" placeholder="Enter amount">
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.addRecurring()">
                ➕ Add Recurring Transaction
            </button>
        `);
    }

    showSettingsModal() {
        const modal = this.createModal('⚙️ App Settings', `
            <div class="form-group">
                <label class="form-label">Default User</label>
                <select class="form-select" id="defaultUser">
                    <option value="A">👩 Ashi</option>
                    <option value="S">👨 Sanju</option>
                </select>
            </div>
            
            <button class="submit-frame" onclick="window.frameUI.saveSettings()">
                💾 Save Settings
            </button>
        `);
    }

    // Real implementations for new features
    async performSearch() {
        const searchTerm = document.getElementById('searchTerm')?.value;
        const searchType = document.getElementById('searchType')?.value;
        const minAmount = document.getElementById('searchMinAmount')?.value;
        const maxAmount = document.getElementById('searchMaxAmount')?.value;
        
        if (!searchTerm && !minAmount && !maxAmount) {
            this.showToast('Please enter search criteria', 'error');
            return;
        }

        this.showToast('Searching transactions...', 'info');
        
        try {
            // Get all data for the current year and search through it
            const now = new Date();
            const currentYear = now.getFullYear().toString().slice(-2);
            
            const results = [];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            
            for (const month of months) {
                try {
                    const response = await fetch(`/summary?month=${month}&year=${currentYear}&user=A`);
                    const data = await response.json();
                    if (data.success && data.data) {
                        data.data.forEach(entry => {
                            const description = entry[2] || '';
                            const amount = parseFloat(entry[3]) || 0;
                            const type = entry[4] || '';
                            
                            let matchesSearch = true;
                            let matchesType = true;
                            let matchesAmount = true;
                            
                            // Text search
                            if (searchTerm) {
                                matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                              amount.toString().includes(searchTerm) ||
                                              type.toLowerCase().includes(searchTerm.toLowerCase());
                            }
                            
                            // Type filter
                            if (searchType) {
                                matchesType = (searchType === 'expense' && type !== 'Income') ||
                                            (searchType === 'income' && type === 'Income');
                            }
                            
                            // Amount range filter
                            if (minAmount) {
                                matchesAmount = matchesAmount && amount >= parseFloat(minAmount);
                            }
                            if (maxAmount) {
                                matchesAmount = matchesAmount && amount <= parseFloat(maxAmount);
                            }
                            
                            if (matchesSearch && matchesType && matchesAmount) {
                                results.push({
                                    date: entry[0],
                                    description: description,
                                    amount: amount,
                                    type: type,
                                    month: month
                                });
                            }
                        });
                    }
                } catch (err) {
                    console.log(`No data for ${month}`);
                }
            }
            
            this.displaySearchResults(results);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Search failed', 'error');
        }
    }

    displaySearchResults(results) {
        const resultsDiv = document.getElementById('summaryResults') || this.createResultsDiv();
        
        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <h4>No Results Found</h4>
                    <p>Try different search terms</p>
                </div>
            `;
        } else {
            resultsDiv.innerHTML = `
                <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: 1rem; max-height: 400px; overflow-y: auto;">
                    <h4 style="color: var(--text-primary); margin-bottom: 1rem;">🔍 Found ${results.length} Results</h4>
                    ${results.map(result => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary);">${result.description}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${result.date} • ${result.month}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: ${result.type === 'Income' ? 'var(--accent-income)' : 'var(--accent-expense)'};">
                                    ₹${result.amount}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${result.type}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="submit-frame" onclick="window.frameUI.closeModal()" style="background: var(--accent-summary); margin-top: 1rem;">
                    ✅ Close Results
                </button>
            `;
        }
        
        resultsDiv.style.display = 'block';
        this.showToast(`Found ${results.length} transactions`, 'success');
    }

    setBudget() {
        const category = document.getElementById('budgetCategory')?.value;
        const amount = document.getElementById('budgetAmount')?.value;
        
        if (!category || !amount) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        // Store budget in localStorage for now
        const budgets = JSON.parse(localStorage.getItem('budgets') || '{}');
        budgets[category] = {
            amount: parseFloat(amount),
            category: category,
            period: 'monthly',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('budgets', JSON.stringify(budgets));
        
        this.showToast(`Budget set for ${category}: ₹${amount}`, 'success');
        this.closeModal();
        
        // Update stats to show budget comparison
        setTimeout(() => this.updateStats(), 500);
    }

    async generateReport() {
        const reportType = document.getElementById('reportType')?.value || 'monthly';
        
        this.showToast('Generating report...', 'info');
        
        try {
            const now = new Date();
            const currentMonth = now.toLocaleString('en-US', { month: 'long' });
            const currentYear = now.getFullYear().toString().slice(-2);
            
            let months = [];
            
            switch (reportType) {
                case 'monthly':
                    months = [currentMonth];
                    break;
                case 'quarterly':
                    const currentMonthIndex = now.getMonth();
                    const quarterStart = Math.floor(currentMonthIndex / 3) * 3;
                    months = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December']
                            .slice(quarterStart, quarterStart + 3);
                    break;
                case 'yearly':
                    months = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'];
                    break;
            }
            
            const reportData = [];
            let totalExpense = 0;
            let totalIncome = 0;
            
            for (const month of months) {
                try {
                    const response = await fetch(`/summary?month=${month}&year=${currentYear}&user=A`);
                    const data = await response.json();
                    if (data.success) {
                        reportData.push({
                            month: month,
                            expense: data.totalExpense || 0,
                            income: data.totalIncome || 0,
                            transactions: data.data ? data.data.length : 0
                        });
                        totalExpense += data.totalExpense || 0;
                        totalIncome += data.totalIncome || 0;
                    }
                } catch (err) {
                    console.log(`No data for ${month}`);
                }
            }
            
            this.displayReport(reportData, totalExpense, totalIncome, reportType);
            
        } catch (error) {
            console.error('Report generation error:', error);
            this.showToast('Failed to generate report', 'error');
        }
    }

    displayReport(reportData, totalExpense, totalIncome, reportType) {
        const resultsDiv = document.getElementById('summaryResults') || this.createResultsDiv();
        
        resultsDiv.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: 1rem;">
                <h4 style="color: var(--text-primary); margin-bottom: 1rem;">📋 ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h4>
                
                <!-- Summary Cards -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="text-align: center; padding: 1rem; background: var(--frame-expense); border-radius: var(--radius-md);">
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--accent-expense);">₹${totalExpense}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Total Expenses</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--frame-income); border-radius: var(--radius-md);">
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--accent-income);">₹${totalIncome}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Total Income</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                        <div style="font-size: 1.25rem; font-weight: 600; color: ${(totalIncome - totalExpense) >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">₹${totalIncome - totalExpense}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Net Balance</div>
                    </div>
                </div>
                
                <!-- Monthly Breakdown -->
                <div style="max-height: 300px; overflow-y: auto;">
                    <h5 style="color: var(--text-primary); margin-bottom: 0.5rem;">Monthly Breakdown</h5>
                    ${reportData.map(month => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary);">${month.month}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${month.transactions} transactions</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.875rem; color: var(--accent-expense);">-₹${month.expense}</div>
                                <div style="font-size: 0.875rem; color: var(--accent-income);">+₹${month.income}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="submit-frame" onclick="window.frameUI.exportReport()" style="background: var(--accent-income); flex: 1;">
                    📄 Export PDF
                </button>
                <button class="submit-frame" onclick="window.frameUI.closeModal()" style="background: var(--accent-summary); flex: 1;">
                    ✅ Close Report
                </button>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        this.showToast('Report generated successfully!', 'success');
    }

    async generateCharts() {
        const chartPeriod = document.getElementById('chartPeriod')?.value || 'currentMonth';
        
        this.showToast('Generating charts...', 'info');
        
        try {
            const now = new Date();
            const currentYear = now.getFullYear().toString().slice(-2);
            
            let months = [];
            
            switch (chartPeriod) {
                case 'currentMonth':
                    months = [now.toLocaleString('en-US', { month: 'long' })];
                    break;
                case 'lastMonth':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    months = [lastMonth.toLocaleString('en-US', { month: 'long' })];
                    break;
                case 'last3Months':
                    for (let i = 2; i >= 0; i--) {
                        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        months.push(month.toLocaleString('en-US', { month: 'long' }));
                    }
                    break;
            }
            
            const chartData = [];
            const categoryData = {};
            
            for (const month of months) {
                try {
                    const response = await fetch(`/summary?month=${month}&year=${currentYear}&user=A`);
                    const data = await response.json();
                    if (data.success && data.data) {
                        chartData.push({
                            month: month,
                            expense: data.totalExpense || 0,
                            income: data.totalIncome || 0
                        });
                        
                        // Aggregate category data
                        data.data.forEach(entry => {
                            const category = entry[1] || 'Other';
                            const amount = parseFloat(entry[3]) || 0;
                            const type = entry[4] || '';
                            
                            if (type !== 'Income') {
                                categoryData[category] = (categoryData[category] || 0) + amount;
                            }
                        });
                    }
                } catch (err) {
                    console.log(`No data for ${month}`);
                }
            }
            
            this.displayCharts(chartData, categoryData, chartPeriod);
            
        } catch (error) {
            console.error('Chart generation error:', error);
            this.showToast('Failed to generate charts', 'error');
        }
    }

    displayCharts(chartData, categoryData, period) {
        const resultsDiv = document.getElementById('summaryResults') || this.createResultsDiv();
        
        const categoryEntries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
        const totalCategoryExpense = categoryEntries.reduce((sum, [, amount]) => sum + amount, 0);
        
        resultsDiv.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: 1rem;">
                <h4 style="color: var(--text-primary); margin-bottom: 1rem;">📈 Financial Charts - ${period}</h4>
                
                <!-- Income vs Expense Chart -->
                <div style="margin-bottom: 2rem;">
                    <h5 style="color: var(--text-primary); margin-bottom: 1rem;">💰 Income vs Expenses</h5>
                    ${chartData.map(data => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="color: var(--text-primary); font-weight: 600;">${data.month}</span>
                                <span style="color: var(--text-secondary); font-size: 0.875rem;">₹${data.income} - ₹${data.expense}</span>
                            </div>
                            <div style="display: flex; height: 20px; border-radius: 10px; overflow: hidden; background: var(--bg-tertiary);">
                                <div style="background: var(--accent-income); width: ${data.income > 0 ? (data.income / Math.max(data.income, data.expense)) * 100 : 0}%; transition: width 0.3s ease;"></div>
                                <div style="background: var(--accent-expense); width: ${data.expense > 0 ? (data.expense / Math.max(data.income, data.expense)) * 100 : 0}%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Category Breakdown -->
                <div style="margin-bottom: 2rem;">
                    <h5 style="color: var(--text-primary); margin-bottom: 1rem;">🥧 Expenses by Category</h5>
                    ${categoryEntries.slice(0, 6).map(([category, amount]) => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="color: var(--text-primary);">${category}</span>
                                <span style="color: var(--accent-expense); font-weight: 600;">₹${amount} (${((amount/totalCategoryExpense)*100).toFixed(1)}%)</span>
                            </div>
                            <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px;">
                                <div style="height: 100%; background: var(--accent-expense); width: ${(amount/totalCategoryExpense)*100}%; border-radius: 4px; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button class="submit-frame" onclick="window.frameUI.closeModal()" style="background: var(--accent-summary); margin-top: 1rem;">
                ✅ Close Charts
            </button>
        `;
        
        resultsDiv.style.display = 'block';
        this.showToast('Charts generated successfully!', 'success');
    }

    addRecurring() {
        const description = document.getElementById('recurringDescription')?.value;
        const amount = document.getElementById('recurringAmount')?.value;
        
        if (!description || !amount) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        // Store recurring transaction in localStorage
        const recurring = JSON.parse(localStorage.getItem('recurring') || '[]');
        recurring.push({
            id: Date.now(),
            description: description,
            amount: parseFloat(amount),
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('recurring', JSON.stringify(recurring));
        
        this.showToast(`Recurring transaction added: ${description}`, 'success');
        this.closeModal();
    }

    saveSettings() {
        const defaultUser = document.getElementById('defaultUser')?.value;
        
        if (defaultUser) {
            localStorage.setItem('defaultUser', defaultUser);
            
            // Update the user selector if it exists
            const userSelect = document.getElementById('selectOption');
            if (userSelect) {
                userSelect.value = defaultUser;
            }
        }
        
        this.showToast('Settings saved successfully!', 'success');
        this.closeModal();
    }

    createResultsDiv() {
        const modal = document.querySelector('.modal.active .modal-content');
        if (!modal) return null;
        
        let resultsDiv = modal.querySelector('#summaryResults');
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'summaryResults';
            resultsDiv.style.marginTop = '1.5rem';
            modal.appendChild(resultsDiv);
        }
        return resultsDiv;
    }

    exportReport() {
        this.showToast('Export functionality coming soon!', 'info');
    }

    async deleteEntry(entryId, month, year) {
        if (!entryId) {
            this.showToast('Cannot delete entry - ID not found', 'error');
            return;
        }
        
        // Show confirmation
        const confirmed = confirm('Are you sure you want to delete this entry?');
        if (!confirmed) return;
        
        try {
            const response = await fetch(`/entry/${entryId}`, { 
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Entry deleted successfully!', 'success');
                
                // Refresh the summary table
                setTimeout(() => {
                    // Set the month and year values
                    document.getElementById('summaryMonth').value = month;
                    document.getElementById('summaryYear').value = year;
                    // Re-fetch the summary
                    this.fetchSummary();
                }, 500);
                
                // Also refresh the stats
                setTimeout(() => this.updateStats(), 1000);
                
            } else {
                this.showToast('Failed to delete entry', 'error');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showToast('Error deleting entry', 'error');
        }
    }

    editEntry(entryId, description, amount, category, type) {
        if (!entryId) {
            this.showToast('Cannot edit entry - ID not found', 'error');
            return;
        }
        
        const isIncome = type === 'Income';
        
        // Create edit modal
        const modal = this.createModal(`✏️ Edit ${isIncome ? 'Income' : 'Expense'}`, `
            <div class="form-group">
                <label class="form-label">Amount</label>
                <input type="number" class="form-input" id="editAmount" value="${amount}" placeholder="Enter amount">
            </div>
            
            <div class="form-group">
                <label class="form-label">${isIncome ? 'Source' : 'Category'}</label>
                <select class="form-select" id="editCategory">
                    ${isIncome ? `
                        <option value="Salary" ${category === 'Salary' ? 'selected' : ''}>💼 Salary</option>
                        <option value="Freelance" ${category === 'Freelance' ? 'selected' : ''}>💻 Freelance</option>
                        <option value="Investment" ${category === 'Investment' ? 'selected' : ''}>📈 Investment</option>
                        <option value="Business" ${category === 'Business' ? 'selected' : ''}>🏢 Business</option>
                        <option value="Other" ${category === 'Other' ? 'selected' : ''}>💰 Other</option>
                    ` : `
                        <option value="Food" ${category === 'Food' ? 'selected' : ''}>🍔 Food</option>
                        <option value="Clothes" ${category === 'Clothes' ? 'selected' : ''}>👕 Clothes</option>
                        <option value="Fuel" ${category === 'Fuel' ? 'selected' : ''}>⛽ Fuel</option>
                        <option value="EMI" ${category === 'EMI' ? 'selected' : ''}>🏦 EMI</option>
                        <option value="Recharge" ${category === 'Recharge' ? 'selected' : ''}>📱 Recharge</option>
                        <option value="Home AHM" ${category === 'Home AHM' ? 'selected' : ''}>🏠 Home AHM</option>
                        <option value="Home Torna" ${category === 'Home Torna' ? 'selected' : ''}>🏡 Home Torna</option>
                        <option value="Other" ${category === 'Other' ? 'selected' : ''}>📦 Other</option>
                    `}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" class="form-input" id="editDescription" value="${description}" placeholder="Add description">
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button class="submit-frame" onclick="window.frameUI.updateEntry('${entryId}')" style="background: var(--accent-summary); flex: 1;">
                    ✅ Update Entry
                </button>
                <button class="submit-frame" onclick="window.frameUI.closeModal()" style="background: var(--accent-neutral); flex: 1;">
                    ❌ Cancel
                </button>
            </div>
        `);
    }

    async updateEntry(entryId) {
        const amount = document.getElementById('editAmount')?.value;
        const category = document.getElementById('editCategory')?.value;
        const description = document.getElementById('editDescription')?.value;

        if (!amount || !category) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Since we don't have an update endpoint, we'll show a message
            // In a real implementation, you'd make a PUT request to update the entry
            this.showToast('Entry update functionality would be implemented here', 'info');
            this.closeModal();
            
            // For now, suggest manual deletion and re-creation
            setTimeout(() => {
                this.showToast('Please delete the old entry and create a new one', 'warning');
            }, 2000);
            
        } catch (error) {
            console.error('Error updating entry:', error);
            this.showToast('Error updating entry', 'error');
        }
    }

    showBudgetComparison(currentExpense) {
        const budgets = JSON.parse(localStorage.getItem('budgets') || '{}');
        const totalBudget = budgets['total']?.amount || 0;
        
        if (totalBudget > 0) {
            const budgetUsed = (currentExpense / totalBudget) * 100;
            const budgetColor = budgetUsed > 90 ? 'var(--accent-expense)' : 
                               budgetUsed > 70 ? 'var(--accent-warning)' : 'var(--accent-income)';
            
            // Find or create budget indicator
            let budgetIndicator = document.getElementById('budgetIndicator');
            if (!budgetIndicator) {
                const statsContainer = document.querySelector('.stats-frames');
                if (statsContainer) {
                    budgetIndicator = document.createElement('div');
                    budgetIndicator.id = 'budgetIndicator';
                    budgetIndicator.style.cssText = `
                        background: var(--bg-card);
                        border: 1px solid var(--border-primary);
                        border-radius: var(--radius-lg);
                        padding: 1rem;
                        margin-top: 1rem;
                        text-align: center;
                    `;
                    statsContainer.parentNode.appendChild(budgetIndicator);
                }
            }
            
            if (budgetIndicator) {
                budgetIndicator.innerHTML = `
                    <div style="margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem; color: var(--text-secondary);">Monthly Budget Progress</span>
                    </div>
                    <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; margin-bottom: 0.5rem;">
                        <div style="height: 100%; background: ${budgetColor}; width: ${Math.min(budgetUsed, 100)}%; border-radius: 4px; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
                        <span>₹${currentExpense} used</span>
                        <span>${budgetUsed.toFixed(1)}%</span>
                        <span>₹${totalBudget} budget</span>
                    </div>
                `;
                
                // Show warning if over budget
                if (budgetUsed > 100) {
                    setTimeout(() => {
                        this.showToast(`⚠️ You've exceeded your budget by ₹${currentExpense - totalBudget}`, 'warning');
                    }, 1000);
                }
            }
        }
    }

    createModal(title, content) {
        // Remove existing modal
        this.closeModal();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-frame">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="window.frameUI.closeModal()">×</button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.activeModal = modal;

        // Show modal with animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        return modal;
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.classList.remove('active');
            setTimeout(() => {
                this.activeModal.remove();
                this.activeModal = null;
            }, 200);
        }
    }

    submitExpense() {
        const amount = document.getElementById('expenseAmount')?.value;
        const category = document.getElementById('expenseCategory')?.value;
        const description = document.getElementById('expenseDescription')?.value;

        if (!amount || !category) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Use existing function if available
        if (typeof openModal === 'function') {
            // Set values and submit using existing system
            document.getElementById('amount').value = amount;
            document.getElementById('type').value = category;
            document.getElementById('description').value = description;
            
            if (typeof submitEntry === 'function') {
                submitEntry();
            }
        }

        this.closeModal();
        this.showToast('Expense added successfully!', 'success');
        
        // Update stats after a short delay to allow server processing
        setTimeout(() => this.updateStats(), 500);
    }

    submitIncome() {
        const amount = document.getElementById('incomeAmount')?.value;
        const category = document.getElementById('incomeCategory')?.value;
        const description = document.getElementById('incomeDescription')?.value;

        if (!amount || !category) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Use existing function if available
        if (typeof openModal === 'function') {
            // Set values and submit using existing system
            document.getElementById('amount').value = amount;
            document.getElementById('type').value = category;
            document.getElementById('description').value = description;
            
            if (typeof submitEntry === 'function') {
                submitEntry();
            }
        }

        this.closeModal();
        this.showToast('Income added successfully!', 'success');
        
        // Update stats after a short delay to allow server processing
        setTimeout(() => this.updateStats(), 500);
    }

    async fetchSummary() {
        const month = document.getElementById('summaryMonth')?.value;
        const year = document.getElementById('summaryYear')?.value;
        const userSelect = document.getElementById('selectOption');
        const user = userSelect ? userSelect.value : 'A';

        if (!month || !year) {
            this.showToast('Please select month and year', 'error');
            return;
        }

        this.showToast('Fetching summary...', 'info');
        
        // Add loading state to button
        const submitBtn = document.querySelector('.submit-frame');
        if (submitBtn) {
            submitBtn.classList.add('frame-loading');
            submitBtn.textContent = 'Loading...';
        }

        try {
            const response = await fetch(`/summary?month=${month}&year=${year}&user=${user}`);
            const summary = await response.json();

            if (summary.success) {
                // Debug logging
                console.log('Summary data:', summary);
                console.log('Entry IDs:', summary.ids);
                console.log('Data entries:', summary.data);
                
                // Display results in modal with detailed table
                const resultsDiv = document.getElementById('summaryResults');
                if (resultsDiv) {
                    resultsDiv.innerHTML = `
                        <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1rem;">
                            <h4 style="color: var(--text-primary); margin-bottom: 1rem;">📊 Summary for ${month} ${year}</h4>
                            
                            <!-- Quick Stats -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
                                <div style="text-align: center; padding: 0.75rem; background: var(--frame-expense); border-radius: var(--radius-md);">
                                    <div style="font-size: 1.125rem; font-weight: 600; color: var(--accent-expense);">₹${summary.totalExpense || 0}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Expenses</div>
                                </div>
                                <div style="text-align: center; padding: 0.75rem; background: var(--frame-income); border-radius: var(--radius-md);">
                                    <div style="font-size: 1.125rem; font-weight: 600; color: var(--accent-income);">₹${summary.totalIncome || 0}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Income</div>
                                </div>
                                <div style="text-align: center; padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                                    <div style="font-size: 1.125rem; font-weight: 600; color: ${(summary.totalIncome - summary.totalExpense) >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
                                        ₹${(summary.totalIncome - summary.totalExpense) || 0}
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Net Balance</div>
                                </div>
                            </div>
                            
                            <!-- Detailed Transaction Table -->
                            <div style="max-height: 400px; overflow: auto; border: 1px solid var(--border-primary); border-radius: var(--radius-md);">
                                <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                                    <thead style="background: var(--bg-tertiary); position: sticky; top: 0; z-index: 1;">
                                        <tr>
                                            <th style="padding: 0.75rem; text-align: left; color: var(--text-primary); font-size: 0.875rem; border-bottom: 1px solid var(--border-primary);">Date</th>
                                            <th style="padding: 0.75rem; text-align: left; color: var(--text-primary); font-size: 0.875rem; border-bottom: 1px solid var(--border-primary);">Category</th>
                                            <th style="padding: 0.75rem; text-align: left; color: var(--text-primary); font-size: 0.875rem; border-bottom: 1px solid var(--border-primary);">Description</th>
                                            <th style="padding: 0.75rem; text-align: right; color: var(--text-primary); font-size: 0.875rem; border-bottom: 1px solid var(--border-primary);">Amount</th>
                                            <th style="padding: 0.75rem; text-align: center; color: var(--text-primary); font-size: 0.875rem; border-bottom: 1px solid var(--border-primary);">Type</th>
                                            <th style="padding: 0.75rem; text-align: center; color: var(--text-primary); font-size: 0.875rem; border-bottom: 1px solid var(--border-primary); min-width: 100px; white-space: nowrap;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${summary.data && summary.data.length > 0 ? summary.data.map((entry, index) => {
                                            const entryId = summary.ids && summary.ids[index] ? summary.ids[index] : `entry_${index}`;
                                            const description = (entry[2] || '').replace(/'/g, '&apos;');
                                            const category = (entry[1] || '').replace(/'/g, '&apos;');
                                            const amount = entry[3] || '0';
                                            const type = entry[4] || 'Expense';
                                            
                                            return `
                                            <tr style="border-bottom: 1px solid var(--border-primary);">
                                                <td style="padding: 0.75rem; color: var(--text-secondary); font-size: 0.875rem;">${entry[0] || '-'}</td>
                                                <td style="padding: 0.75rem; color: var(--text-primary); font-size: 0.875rem;">${entry[1] || '-'}</td>
                                                <td style="padding: 0.75rem; color: var(--text-primary); font-size: 0.875rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis;" title="${entry[2] || '-'}">${entry[2] || '-'}</td>
                                                <td style="padding: 0.75rem; color: ${type === 'Income' ? 'var(--accent-income)' : 'var(--accent-expense)'}; font-size: 0.875rem; text-align: right; font-weight: 600;">₹${amount}</td>
                                                <td style="padding: 0.75rem; color: var(--text-secondary); font-size: 0.875rem; text-align: center;">
                                                    <span style="padding: 0.25rem 0.5rem; background: ${type === 'Income' ? 'var(--frame-income)' : 'var(--frame-expense)'}; border-radius: var(--radius-sm); font-size: 0.75rem;">
                                                        ${type === 'Income' ? '💰' : '💸'} ${type}
                                                    </span>
                                                </td>
                                                <td style="padding: 0.75rem; text-align: center; white-space: nowrap; min-width: 80px;">
                                                    <button onclick="window.frameUI.editEntry('${entryId}', '${description}', '${amount}', '${category}', '${type}')" 
                                                            class="action-btn edit-btn"
                                                            style="background: var(--bg-hover); border: 1px solid var(--border-primary); color: var(--accent-summary); cursor: pointer; font-size: 0.875rem; padding: 0.375rem 0.5rem; margin-right: 0.25rem; border-radius: var(--radius-sm); transition: all 0.15s ease;" 
                                                            title="Edit Entry">✏️</button>
                                                    <button onclick="window.frameUI.deleteEntry('${entryId}', '${month}', '${year}')" 
                                                            class="action-btn delete-btn"
                                                            style="background: var(--bg-hover); border: 1px solid var(--border-primary); color: var(--accent-expense); cursor: pointer; font-size: 0.875rem; padding: 0.375rem 0.5rem; border-radius: var(--radius-sm); transition: all 0.15s ease;" 
                                                            title="Delete Entry">🗑️</button>
                                                </td>
                                            </tr>
                                            `;
                                        }).join('') : `
                                            <tr>
                                                <td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                                                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                                                    <div>No transactions found for ${month} ${year}</div>
                                                </td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                            
                            ${summary.topCategory ? `
                                <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-md); text-align: center;">
                                    <span style="color: var(--text-secondary);">Top Spending Category: </span>
                                    <strong style="color: var(--text-primary);">${summary.topCategory}</strong>
                                </div>
                            ` : ''}
                        </div>
                        
                        <style>
                            .action-btn:hover {
                                transform: scale(1.05);
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            .edit-btn:hover {
                                background: var(--frame-summary) !important;
                                border-color: var(--accent-summary) !important;
                            }
                            .delete-btn:hover {
                                background: var(--frame-expense) !important;
                                border-color: var(--accent-expense) !important;
                            }
                        </style>
                        
                        <button class="submit-frame" onclick="window.frameUI.closeModal()" style="background: var(--accent-summary);">
                            ✅ Close Summary
                        </button>
                    `;
                    resultsDiv.style.display = 'block';
                }
                
                this.showToast('Summary loaded successfully!', 'success');
            } else {
                this.showToast(summary.message || 'No data found for selected period', 'error');
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
            this.showToast('Failed to fetch summary', 'error');
        } finally {
            // Remove loading state
            if (submitBtn) {
                submitBtn.classList.remove('frame-loading');
                submitBtn.textContent = '📊 Get Summary';
            }
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast-frame');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast-frame';
        
        let icon = '✓';
        if (type === 'error') icon = '⚠️';
        else if (type === 'info') icon = 'ℹ️';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async updateStats() {
        try {
            // Show loading state
            this.setStatsLoading(true);
            
            // Get current month and year
            const now = new Date();
            const currentMonth = now.toLocaleString('en-US', { month: 'long' });
            const currentYear = now.getFullYear().toString().slice(-2);
            
            // Get the selected user from the selectOption if it exists
            const userSelect = document.getElementById('selectOption');
            const currentUser = userSelect ? userSelect.value : 'A';
            
            console.log(`Fetching stats for ${currentMonth} ${currentYear}, User: ${currentUser}`);
            
            // Fetch current month summary
            const response = await fetch(`/summary?month=${currentMonth}&year=${currentYear}&user=${currentUser}`);
            const summaryData = await response.json();
            
            let stats = {
                totalExpense: 0,
                totalIncome: 0,
                netBalance: 0,
                transactionCount: 0
            };
            
            if (summaryData.success) {
                stats.totalExpense = summaryData.totalExpense || 0;
                stats.totalIncome = summaryData.totalIncome || 0;
                stats.netBalance = stats.totalIncome - stats.totalExpense;
                stats.transactionCount = summaryData.data ? summaryData.data.length : 0;
                
                console.log('Stats updated:', stats);
            } else {
                console.log('No data found for current month, using zeros');
            }

            // Update stat frames if they exist
            const expenseFrame = document.getElementById('totalExpenseFrame');
            const incomeFrame = document.getElementById('totalIncomeFrame');
            const balanceFrame = document.getElementById('netBalanceFrame');
            const countFrame = document.getElementById('transactionCountFrame');

            if (expenseFrame) expenseFrame.textContent = this.formatCurrency(stats.totalExpense);
            if (incomeFrame) incomeFrame.textContent = this.formatCurrency(stats.totalIncome);
            if (balanceFrame) {
                balanceFrame.textContent = this.formatCurrency(stats.netBalance);
                balanceFrame.style.color = stats.netBalance >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
            }
            if (countFrame) countFrame.textContent = stats.transactionCount;
            
            // Show budget comparison if available
            this.showBudgetComparison(stats.totalExpense);
            
            // Hide loading state
            this.setStatsLoading(false);
            
        } catch (error) {
            console.error('Error updating stats:', error);
            // Fallback to zeros if there's an error
            const expenseFrame = document.getElementById('totalExpenseFrame');
            const incomeFrame = document.getElementById('totalIncomeFrame');
            const balanceFrame = document.getElementById('netBalanceFrame');
            const countFrame = document.getElementById('transactionCountFrame');

            if (expenseFrame) expenseFrame.textContent = '₹0';
            if (incomeFrame) incomeFrame.textContent = '₹0';
            if (balanceFrame) balanceFrame.textContent = '₹0';
            if (countFrame) countFrame.textContent = '0';
            
            // Hide loading state even on error
            this.setStatsLoading(false);
        }
    }

    setStatsLoading(isLoading) {
        const statFrames = document.querySelectorAll('.stat-frame');
        statFrames.forEach(frame => {
            if (isLoading) {
                frame.classList.add('frame-loading');
            } else {
                frame.classList.remove('frame-loading');
            }
        });
        
        // Update refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            if (isLoading) {
                refreshBtn.style.animation = 'spin 1s linear infinite';
                refreshBtn.style.pointerEvents = 'none';
            } else {
                refreshBtn.style.animation = 'none';
                refreshBtn.style.pointerEvents = 'auto';
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'e':
                        e.preventDefault();
                        this.openFrame('expense');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.openFrame('income');
                        break;
                    case 's':
                        e.preventDefault();
                        this.openFrame('summary');
                        break;
                }
            }
            
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    setupModalSystem() {
        // Hide existing modal if present
        const existingModal = document.getElementById('modal');
        if (existingModal) {
            existingModal.style.display = 'none';
        }

        // Hide existing forms
        const summaryForm = document.getElementById('summaryForm');
        if (summaryForm) {
            summaryForm.style.display = 'none';
        }
    }

    setupStatsRefresh() {
        // Monitor user selection changes
        const userSelect = document.getElementById('selectOption');
        if (userSelect) {
            userSelect.addEventListener('change', () => {
                console.log('User changed, refreshing stats...');
                setTimeout(() => this.updateStats(), 300);
            });
        }

        // Refresh stats when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('Page became visible, refreshing stats...');
                setTimeout(() => this.updateStats(), 500);
            }
        });

        // Refresh stats every 30 seconds
        setInterval(() => {
            if (!document.hidden) {
                this.updateStats();
            }
        }, 30000);
    }

    // Utility methods
    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }
}

// Initialize Frame UI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.frameUI = new FrameUI();
    });
} else {
    window.frameUI = new FrameUI();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrameUI;
}