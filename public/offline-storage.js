// Offline Storage Manager using IndexedDB
class OfflineStorageManager {
    constructor() {
        this.dbName = 'FamilyExpenseTracker';
        this.dbVersion = 1;
        this.db = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.init();
        this.setupEventListeners();
    }
    
    async init() {
        try {
            this.db = await this.openDB();
            await this.loadSyncQueue();
            console.log('✅ IndexedDB initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize IndexedDB:', error);
        }
    }
    
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Expenses store
                if (!db.objectStoreNames.contains('expenses')) {
                    const expenseStore = db.createObjectStore('expenses', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    expenseStore.createIndex('date', 'date');
                    expenseStore.createIndex('user', 'user');
                    expenseStore.createIndex('type', 'type');
                    expenseStore.createIndex('entryType', 'entryType');
                }
                
                // Sync queue store
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                }
                
                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                // Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    const categoryStore = db.createObjectStore('categories', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    categoryStore.createIndex('type', 'type');
                }
                
                // Recurring transactions store
                if (!db.objectStoreNames.contains('recurring')) {
                    const recurringStore = db.createObjectStore('recurring', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    recurringStore.createIndex('frequency', 'frequency');
                    recurringStore.createIndex('nextDue', 'nextDue');
                }
                
                // Budgets store
                if (!db.objectStoreNames.contains('budgets')) {
                    const budgetStore = db.createObjectStore('budgets', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    budgetStore.createIndex('user', 'user');
                    budgetStore.createIndex('category', 'category');
                    budgetStore.createIndex('period', 'period');
                }
            };
        });
    }
    
    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showStatus('🟢 Online - Syncing data...', 'success');
            this.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showStatus('🔴 Offline - Data saved locally', 'warning');
        });
    }
    
    // Add expense/income entry
    async addEntry(entry) {
        const timestamp = new Date().toISOString();
        const localEntry = {
            ...entry,
            timestamp,
            synced: false,
            localId: Date.now() + Math.random()
        };
        
        try {
            // Save locally first
            const transaction = this.db.transaction(['expenses'], 'readwrite');
            const store = transaction.objectStore('expenses');
            await store.add(localEntry);
            
            console.log('💾 Entry saved locally');
            
            // Check budget alerts for expenses
            if (entry.entryType === 'expense') {
                setTimeout(() => this.checkBudgetAlerts(entry), 500);
            }
            
            // Try to sync if online
            if (this.isOnline) {
                await this.syncEntry(localEntry);
            } else {
                // Add to sync queue
                await this.addToSyncQueue('addEntry', localEntry);
                this.showStatus('💾 Saved offline - will sync when online', 'info');
            }
            
            return { success: true, entry: localEntry };
        } catch (error) {
            console.error('Error adding entry:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get summary data
    async getSummaryData(month, year, user) {
        try {
            const transaction = this.db.transaction(['expenses'], 'readonly');
            const store = transaction.objectStore('expenses');
            const allEntries = await this.getAllFromStore(store);
            
            // Filter for specific month/year/user
            const targetDate = new Date(`${month} 1, ${year}`);
            const targetMonth = targetDate.getMonth() + 1;
            const targetYear = targetDate.getFullYear();
            
            const filteredEntries = allEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entry.user === user && 
                       entryDate.getMonth() + 1 === targetMonth && 
                       entryDate.getFullYear() === targetYear;
            });
            
            if (!filteredEntries.length) {
                return { success: false, message: 'No data found for selected period' };
            }
            
            let totalExpense = 0, totalIncome = 0;
            const categoryTotals = {};
            const tableData = [];
            const ids = [];
            
            filteredEntries.forEach(entry => {
                const amount = Math.abs(Number(entry.amount));
                
                if (entry.entryType === 'expense') {
                    totalExpense += amount;
                    categoryTotals[entry.type] = (categoryTotals[entry.type] || 0) + amount;
                } else if (entry.entryType === 'income') {
                    totalIncome += amount;
                }
                
                tableData.push([
                    entry.date,
                    entry.type,
                    entry.description,
                    amount,
                    entry.entryType,
                    entry.currency || 'INR'
                ]);
                
                ids.push(entry.id || entry.localId);
            });
            
            const total = totalExpense + totalIncome;
            const expensePercentage = total ? (totalExpense / total) * 100 : 0;
            const incomePercentage = total ? (totalIncome / total) * 100 : 0;
            const topCategory = Object.entries(categoryTotals)
                .reduce((max, cur) => cur[1] > max[1] ? cur : max, ['', 0]);
            
            return {
                data: tableData,
                ids,
                success: true,
                totalExpense,
                totalIncome,
                expensePercentage,
                incomePercentage,
                topCategory: topCategory[0] || 'None'
            };
            
        } catch (error) {
            console.error('Error getting local summary:', error);
            return { success: false, message: 'Error retrieving local data' };
        }
    }
    
    // Delete entry
    async deleteEntry(id) {
        try {
            const transaction = this.db.transaction(['expenses'], 'readwrite');
            const store = transaction.objectStore('expenses');
            await store.delete(Number(id));
            
            // Add deletion to sync queue if online
            if (this.isOnline) {
                await this.syncDeleteEntry(id);
            } else {
                await this.addToSyncQueue('deleteEntry', { id });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting entry:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Sync operations
    async syncEntry(entry) {
        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selection: entry.user,
                    type: entry.type,
                    description: entry.description,
                    amount: entry.amount,
                    entryType: entry.entryType
                })
            });
            
            if (response.ok) {
                // Mark as synced
                const transaction = this.db.transaction(['expenses'], 'readwrite');
                const store = transaction.objectStore('expenses');
                entry.synced = true;
                await store.put(entry);
                
                console.log('☁️ Entry synced to Google Sheets');
                return true;
            }
        } catch (error) {
            console.error('Sync failed:', error);
            await this.addToSyncQueue('addEntry', entry);
        }
        return false;
    }
    
    async syncDeleteEntry(id) {
        try {
            const response = await fetch(`/entry/${id}`, { method: 'DELETE' });
            if (response.ok) {
                console.log('☁️ Entry deletion synced');
                return true;
            }
        } catch (error) {
            console.error('Delete sync failed:', error);
        }
        return false;
    }
    
    async addToSyncQueue(operation, data) {
        const transaction = this.db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        await store.add({
            operation,
            data,
            timestamp: new Date().toISOString()
        });
    }
    
    async loadSyncQueue() {
        const transaction = this.db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        this.syncQueue = await this.getAllFromStore(store);
    }
    
    async syncPendingData() {
        if (!this.isOnline || !this.syncQueue.length) return;
        
        const transaction = this.db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        
        for (const queueItem of this.syncQueue) {
            try {
                let success = false;
                
                if (queueItem.operation === 'addEntry') {
                    success = await this.syncEntry(queueItem.data);
                } else if (queueItem.operation === 'deleteEntry') {
                    success = await this.syncDeleteEntry(queueItem.data.id);
                }
                
                if (success) {
                    await store.delete(queueItem.id);
                }
            } catch (error) {
                console.error('Error syncing queue item:', error);
            }
        }
        
        await this.loadSyncQueue();
        
        if (this.syncQueue.length === 0) {
            this.showStatus('✅ All data synced successfully', 'success');
        }
    }
    
    // Helper methods
    getAllFromStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    showStatus(message, type = 'info') {
        // Create or update status indicator
        let statusEl = document.getElementById('sync-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'sync-status';
            statusEl.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 10000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusEl);
        }
        
        const colors = {
            success: '#d4edda',
            warning: '#fff3cd',
            error: '#f8d7da',
            info: '#d1ecf1'
        };
        
        statusEl.textContent = message;
        statusEl.style.backgroundColor = colors[type] || colors.info;
        statusEl.style.opacity = '1';
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            statusEl.style.opacity = '0';
        }, 3000);
    }
    
    // Recurring Transactions Management
    async addRecurringTransaction(recurring) {
        try {
            const transaction = this.db.transaction(['recurring'], 'readwrite');
            const store = transaction.objectStore('recurring');
            
            const recurringEntry = {
                ...recurring,
                created: new Date().toISOString(),
                active: true,
                lastProcessed: null
            };
            
            await store.add(recurringEntry);
            console.log('✅ Recurring transaction added');
            return { success: true };
        } catch (error) {
            console.error('Error adding recurring transaction:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getRecurringTransactions() {
        try {
            const transaction = this.db.transaction(['recurring'], 'readonly');
            const store = transaction.objectStore('recurring');
            const recurring = await this.getAllFromStore(store);
            return recurring.filter(r => r.active);
        } catch (error) {
            console.error('Error getting recurring transactions:', error);
            return [];
        }
    }
    
    async deleteRecurringTransaction(id) {
        try {
            const transaction = this.db.transaction(['recurring'], 'readwrite');
            const store = transaction.objectStore('recurring');
            await store.delete(Number(id));
            return { success: true };
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            return { success: false, error: error.message };
        }
    }
    
    async processDueRecurringTransactions() {
        try {
            const recurring = await this.getRecurringTransactions();
            const today = new Date();
            const processedTransactions = [];
            
            for (const recurringTransaction of recurring) {
                const nextDue = new Date(recurringTransaction.nextDue);
                
                if (nextDue <= today) {
                    // Create the actual transaction
                    const entry = {
                        user: recurringTransaction.user,
                        type: recurringTransaction.category,
                        description: `${recurringTransaction.description} (Auto)`,
                        amount: recurringTransaction.amount,
                        entryType: recurringTransaction.entryType,
                        date: today.toISOString().split('T')[0],
                        currency: 'INR',
                        recurring: true,
                        recurringId: recurringTransaction.id
                    };
                    
                    const result = await this.addEntry(entry);
                    if (result.success) {
                        // Update next due date
                        const newNextDue = this.calculateNextDueDate(nextDue, recurringTransaction.frequency);
                        
                        const transaction = this.db.transaction(['recurring'], 'readwrite');
                        const store = transaction.objectStore('recurring');
                        
                        recurringTransaction.nextDue = newNextDue.toISOString().split('T')[0];
                        recurringTransaction.lastProcessed = today.toISOString();
                        
                        await store.put(recurringTransaction);
                        processedTransactions.push(recurringTransaction);
                    }
                }
            }
            
            return { 
                success: true, 
                processed: processedTransactions.length,
                transactions: processedTransactions 
            };
        } catch (error) {
            console.error('Error processing recurring transactions:', error);
            return { success: false, error: error.message };
        }
    }
    
    calculateNextDueDate(currentDate, frequency) {
        const nextDate = new Date(currentDate);
        
        switch (frequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            default:
                nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
        }
        
        return nextDate;
    }
    
    // Budget Management
    async addBudget(budget) {
        try {
            const transaction = this.db.transaction(['budgets'], 'readwrite');
            const store = transaction.objectStore('budgets');
            
            const budgetEntry = {
                ...budget,
                created: new Date().toISOString(),
                active: true
            };
            
            await store.add(budgetEntry);
            console.log('✅ Budget added');
            return { success: true };
        } catch (error) {
            console.error('Error adding budget:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getBudgets() {
        try {
            const transaction = this.db.transaction(['budgets'], 'readonly');
            const store = transaction.objectStore('budgets');
            const budgets = await this.getAllFromStore(store);
            return budgets.filter(b => b.active);
        } catch (error) {
            console.error('Error getting budgets:', error);
            return [];
        }
    }
    
    async deleteBudget(id) {
        try {
            const transaction = this.db.transaction(['budgets'], 'readwrite');
            const store = transaction.objectStore('budgets');
            await store.delete(Number(id));
            return { success: true };
        } catch (error) {
            console.error('Error deleting budget:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getBudgetStatus(user = null) {
        try {
            const budgets = await this.getBudgets();
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            // Get current month's expenses
            const expenseTransaction = this.db.transaction(['expenses'], 'readonly');
            const expenseStore = expenseTransaction.objectStore('expenses');
            const allExpenses = await this.getAllFromStore(expenseStore);
            
            const currentMonthExpenses = allExpenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                const matchesMonth = expenseDate.getMonth() === currentMonth && 
                                   expenseDate.getFullYear() === currentYear;
                const matchesUser = !user || expense.user === user;
                return matchesMonth && matchesUser && expense.entryType === 'expense';
            });
            
            const budgetStatus = {};
            
            for (const budget of budgets) {
                if (user && budget.user !== user && budget.user !== 'combined') continue;
                
                const key = `${budget.user}-${budget.category}`;
                const categoryExpenses = currentMonthExpenses.filter(expense => {
                    const matchesCategory = budget.category === 'total' || expense.type === budget.category;
                    const matchesUser = budget.user === 'combined' || expense.user === budget.user;
                    return matchesCategory && matchesUser;
                });
                
                const spent = categoryExpenses.reduce((sum, expense) => sum + Math.abs(parseFloat(expense.amount)), 0);
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                
                budgetStatus[key] = {
                    budget,
                    spent,
                    remaining: budget.amount - spent,
                    percentage,
                    status: this.getBudgetAlertLevel(percentage)
                };
            }
            
            return { success: true, budgetStatus };
        } catch (error) {
            console.error('Error getting budget status:', error);
            return { success: false, error: error.message };
        }
    }
    
    getBudgetAlertLevel(percentage) {
        if (percentage >= 100) return 'exceeded';
        if (percentage >= 90) return 'critical';
        if (percentage >= 80) return 'warning';
        return 'good';
    }
    
    async checkBudgetAlerts(entry) {
        // Check if the new entry triggers any budget alerts
        const budgetStatus = await this.getBudgetStatus(entry.user);
        
        if (!budgetStatus.success) return;
        
        const alerts = [];
        
        Object.values(budgetStatus.budgetStatus).forEach(status => {
            const { budget, percentage, spent } = status;
            
            if (percentage >= 100) {
                alerts.push({
                    level: 'critical',
                    message: `🚨 BUDGET EXCEEDED: ${budget.category} budget (₹${budget.amount}) exceeded by ₹${(spent - budget.amount).toFixed(0)}`
                });
            } else if (percentage >= 90) {
                alerts.push({
                    level: 'warning',
                    message: `⚠️ BUDGET ALERT: ${budget.category} budget at ${percentage.toFixed(0)}% (₹${spent.toFixed(0)}/₹${budget.amount})`
                });
            }
        });
        
        // Show alerts
        alerts.forEach(alert => {
            this.showStatus(alert.message, alert.level === 'critical' ? 'error' : 'warning');
        });
        
        return alerts;
    }
    
    // Export data for backup
    async exportData() {
        try {
            const expenseTransaction = this.db.transaction(['expenses'], 'readonly');
            const expenseStore = expenseTransaction.objectStore('expenses');
            const expenseData = await this.getAllFromStore(expenseStore);
            
            const recurringTransaction = this.db.transaction(['recurring'], 'readonly');
            const recurringStore = recurringTransaction.objectStore('recurring');
            const recurringData = await this.getAllFromStore(recurringStore);
            
            const allData = {
                expenses: expenseData,
                recurring: recurringData,
                exportDate: new Date().toISOString()
            };
            
            const dataBlob = new Blob([JSON.stringify(allData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expense-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize storage manager
const storageManager = new OfflineStorageManager();