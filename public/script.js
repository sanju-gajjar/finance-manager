function openModal(type) {
    document.getElementById("modal").style.display = "block";
    document.getElementById("modalTitle").innerText = type === 'expense' ? 'Add Expense' : 'Add Income';
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

async function submitEntry() {
    const amount = document.getElementById("amount").value;
    const type = document.getElementById("type").value;
    const desc = document.getElementById("description").value;
    const selection = document.getElementById("selectOption").value;
    const entryType = document.getElementById("modalTitle").innerText.includes("Expense") ? "expense" : "income";

    // Validation
    if (!amount || !type || !desc) {
        alert('Please fill in all fields');
        return;
    }

    const entry = {
        user: selection,
        type,
        description: desc,
        amount: parseFloat(amount),
        entryType,
        date: new Date().toISOString().split('T')[0],
        currency: 'INR'
    };

    try {
        // Use offline storage manager
        const result = await storageManager.addEntry(entry);
        
        if (result.success) {
            alert(`${entryType === 'expense' ? '💸' : '💰'} Entry saved${navigator.onLine ? ' and synced!' : ' offline!'}`);
            closeModal();
            
            // Clear form
            document.getElementById("amount").value = '';
            document.getElementById("type").selectedIndex = 0;
            document.getElementById("description").value = '';
        } else {
            alert('Error saving entry: ' + result.error);
        }
    } catch (error) {
        console.error('Error submitting entry:', error);
        alert('Error saving entry. Please try again.');
    }
}

function showSummaryForm() {
    document.getElementById('summaryForm').style.display = 'block';
    document.getElementById('summaryResult').style.display = 'none';
}

async function fetchSummary() {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const user = document.getElementById("selectOption").value;

    if (!month || !year) {
        alert('Please select month and year');
        return;
    }

    try {
        // Try offline storage first, then online if available
        let summary = await storageManager.getSummaryData(month, year, user);
        
        // If no local data and online, try server
        if (!summary.success && navigator.onLine) {
            const response = await fetch(`/summary?month=${month}&year=${year}&user=${user}`);
            summary = await response.json();
        }

        if (!summary.success) {
            alert(summary.message || 'No data found for the selected period.');
            return;
        }

        // Update summary display
        document.getElementById('summaryMonthYear').innerText = `${month} 20${year}`;
        document.getElementById('totalExpense').innerText = formatCurrency(summary.totalExpense);
        document.getElementById('totalIncome').innerText = formatCurrency(summary.totalIncome);
        document.getElementById('expensePercentage').innerText = summary.expensePercentage.toFixed(1);
        document.getElementById('incomePercentage').innerText = summary.incomePercentage.toFixed(1);
        document.getElementById('topCategory').innerText = summary.topCategory;
        document.getElementById('summaryResult').style.display = 'block';

        // Generate detailed table
        generateSummaryTable(summary, user);

    } catch (error) {
        console.error('Error fetching summary:', error);
        alert('Error fetching summary. Please try again.');
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function generateSummaryTable(summary, user) {
    // Remove existing tables
    const summaryResult = document.getElementById('summaryResult');
    const existingTables = summaryResult.querySelectorAll('.extra-summary-table');
    existingTables.forEach(table => table.remove());

    if (!summary.data || summary.data.length === 0) return;

    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    const table = document.createElement('table');
    table.className = 'extra-summary-table';
    table.style.width = '100%';
    table.style.minWidth = '600px';

    // Create header
    const headerRow = document.createElement('tr');
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Type', 'Actions'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.position = 'sticky';
        th.style.top = '0';
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Add data rows
    summary.data.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(entry[0]).toLocaleDateString('en-IN');
        
        const cells = [
            date,
            entry[1], // type/category
            entry[2], // description
            formatCurrency(entry[3]), // amount
            entry[4] === 'expense' ? '💸 Expense' : '💰 Income'
        ];
        
        cells.forEach((cellData, cellIndex) => {
            const td = document.createElement('td');
            td.textContent = cellData;
            if (cellIndex === 3) { // Amount column
                td.style.textAlign = 'right';
                td.style.fontWeight = 'bold';
                td.style.color = entry[4] === 'expense' ? '#ff6b6b' : '#51cf66';
            }
            row.appendChild(td);
        });
        
        // Actions column
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        actionTd.innerHTML = `
            <button onclick="deleteEntryLocal('${summary.ids[index]}')" 
                    title="Delete" 
                    style="background:none;border:none;cursor:pointer;color:#ff6b6b;font-size:18px;padding:4px;">
                🗑️
            </button>
        `;
        row.appendChild(actionTd);
        
        table.appendChild(row);
    });

    tableContainer.appendChild(table);
    summaryResult.appendChild(tableContainer);
}

async function deleteEntryLocal(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
        const result = await storageManager.deleteEntry(entryId);
        
        if (result.success) {
            alert('✅ Entry deleted successfully!');
            fetchSummary(); // Refresh the summary
        } else {
            alert('❌ Failed to delete entry: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('❌ Error deleting entry. Please try again.');
    }
}

// Legacy function for backward compatibility
function deleteEntry(entryId) {
    deleteEntryLocal(entryId);
}

// Search and Filter functionality
let allEntries = [];
let isSearchMode = false;

function toggleSearchFilter() {
    const section = document.getElementById('searchFilterSection');
    const results = document.getElementById('searchResults');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        results.style.display = 'none';
        loadAllEntries();
    } else {
        section.style.display = 'none';
        results.style.display = 'none';
        isSearchMode = false;
    }
}

async function loadAllEntries() {
    try {
        // Get all entries from offline storage
        const transaction = storageManager.db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        allEntries = await storageManager.getAllFromStore(store);
        
        // Sort by date (newest first)
        allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log(`Loaded ${allEntries.length} entries for search`);
    } catch (error) {
        console.error('Error loading entries for search:', error);
        allEntries = [];
    }
}

async function performSearch() {
    if (!allEntries.length) {
        await loadAllEntries();
    }
    
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const filterCategory = document.getElementById('filterCategory').value;
    const filterType = document.getElementById('filterType').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const amountMin = parseFloat(document.getElementById('amountMin').value) || 0;
    const amountMax = parseFloat(document.getElementById('amountMax').value) || Infinity;
    
    let filteredEntries = allEntries.filter(entry => {
        // Text search
        const matchesSearch = !searchTerm || 
            entry.description.toLowerCase().includes(searchTerm) ||
            entry.type.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !filterCategory || entry.type === filterCategory;
        
        // Type filter (expense/income)
        const matchesType = !filterType || entry.entryType === filterType;
        
        // Date range filter
        const entryDate = new Date(entry.date);
        const matchesDateFrom = !dateFrom || entryDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || entryDate <= new Date(dateTo);
        
        // Amount range filter
        const amount = Math.abs(parseFloat(entry.amount));
        const matchesAmount = amount >= amountMin && amount <= amountMax;
        
        return matchesSearch && matchesCategory && matchesType && 
               matchesDateFrom && matchesDateTo && matchesAmount;
    });
    
    displaySearchResults(filteredEntries, {
        searchTerm,
        filterCategory,
        filterType,
        dateFrom,
        dateTo,
        amountMin: amountMin > 0 ? amountMin : null,
        amountMax: amountMax < Infinity ? amountMax : null
    });
}

function displaySearchResults(entries, filters) {
    const resultsDiv = document.getElementById('searchResults');
    const titleDiv = document.getElementById('searchResultsTitle');
    const contentDiv = document.getElementById('searchResultsContent');
    
    // Update title with results count
    titleDiv.textContent = `🔍 Search Results (${entries.length} found)`;
    
    if (entries.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No entries found matching your criteria.</p>';
        resultsDiv.style.display = 'block';
        isSearchMode = true;
        return;
    }
    
    // Create summary statistics
    const totalExpense = entries
        .filter(e => e.entryType === 'expense')
        .reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
    
    const totalIncome = entries
        .filter(e => e.entryType === 'income')
        .reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
    
    // Create summary table
    let summaryHTML = `
        <div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 12px;">
            <h4 style="margin: 0 0 12px 0;">📊 Filter Summary</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                <div>💸 Total Expenses: <strong>${formatCurrency(totalExpense)}</strong></div>
                <div>💰 Total Income: <strong>${formatCurrency(totalIncome)}</strong></div>
            </div>
        </div>
    `;
    
    // Create table
    summaryHTML += `
        <div class="table-container">
            <table style="width: 100%; min-width: 600px;">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    entries.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString('en-IN');
        const userIcon = entry.user === 'A' ? '👩 Ashi' : '👨 Sanju';
        const typeIcon = entry.entryType === 'expense' ? '💸' : '💰';
        const amountColor = entry.entryType === 'expense' ? '#ff6b6b' : '#51cf66';
        
        summaryHTML += `
            <tr>
                <td>${date}</td>
                <td>${userIcon}</td>
                <td>${entry.type}</td>
                <td>${entry.description}</td>
                <td style="text-align: right; font-weight: bold; color: ${amountColor};">
                    ${formatCurrency(Math.abs(parseFloat(entry.amount)))}
                </td>
                <td>${typeIcon} ${entry.entryType}</td>
                <td style="text-align: center;">
                    <button onclick="deleteEntryLocal('${entry.id || entry.localId}')" 
                            title="Delete" 
                            style="background:none;border:none;cursor:pointer;color:#ff6b6b;font-size:16px;padding:4px;">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
    
    summaryHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    contentDiv.innerHTML = summaryHTML;
    resultsDiv.style.display = 'block';
    isSearchMode = true;
}

function clearFilters() {
    document.getElementById('searchBox').value = '';
    document.getElementById('filterCategory').selectedIndex = 0;
    document.getElementById('filterType').selectedIndex = 0;
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('amountMin').value = '';
    document.getElementById('amountMax').value = '';
    
    document.getElementById('searchResults').style.display = 'none';
    isSearchMode = false;
}

// Enhanced show summary form to hide search results
function showSummaryForm() {
    document.getElementById('summaryForm').style.display = 'block';
    document.getElementById('summaryResult').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchFilterSection').style.display = 'none';
    document.getElementById('recurringSection').style.display = 'none';
    isSearchMode = false;
}

// Recurring Transactions Functions
function showRecurringSection() {
    hideAllSections();
    document.getElementById('recurringSection').style.display = 'block';
    loadRecurringTransactions();
}

function hideAllSections() {
    document.getElementById('summaryForm').style.display = 'none';
    document.getElementById('summaryResult').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchFilterSection').style.display = 'none';
    document.getElementById('recurringSection').style.display = 'none';
}

async function addRecurringTransaction() {
    const entryType = document.getElementById('recurringType').value;
    const description = document.getElementById('recurringDescription').value;
    const amount = document.getElementById('recurringAmount').value;
    const category = document.getElementById('recurringCategory').value;
    const frequency = document.getElementById('recurringFrequency').value;
    const startDate = document.getElementById('recurringStartDate').value;
    const user = document.getElementById('selectOption').value;
    
    // Validation
    if (!description || !amount || !category || !startDate) {
        alert('Please fill in all fields');
        return;
    }
    
    const recurring = {
        user,
        entryType,
        description,
        amount: parseFloat(amount),
        category,
        frequency,
        nextDue: startDate,
        startDate
    };
    
    try {
        const result = await storageManager.addRecurringTransaction(recurring);
        
        if (result.success) {
            alert(`✅ Recurring ${entryType} added successfully!`);
            
            // Clear form
            document.getElementById('recurringDescription').value = '';
            document.getElementById('recurringAmount').value = '';
            document.getElementById('recurringCategory').selectedIndex = 0;
            document.getElementById('recurringStartDate').value = '';
            
            // Reload the recurring transactions list
            loadRecurringTransactions();
        } else {
            alert('❌ Error adding recurring transaction: ' + result.error);
        }
    } catch (error) {
        console.error('Error adding recurring transaction:', error);
        alert('❌ Error adding recurring transaction. Please try again.');
    }
}

async function loadRecurringTransactions() {
    try {
        const recurring = await storageManager.getRecurringTransactions();
        const contentDiv = document.getElementById('recurringListContent');
        
        if (recurring.length === 0) {
            contentDiv.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No recurring transactions set up yet.</p>';
            return;
        }
        
        let html = '<div class="table-container"><table style="width: 100%;">';
        html += `
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Frequency</th>
                    <th>Next Due</th>
                    <th>User</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        recurring.forEach(r => {
            const nextDue = new Date(r.nextDue).toLocaleDateString('en-IN');
            const userIcon = r.user === 'A' ? '👩 Ashi' : '👨 Sanju';
            const typeIcon = r.entryType === 'expense' ? '💸' : '💰';
            const amountColor = r.entryType === 'expense' ? '#ff6b6b' : '#51cf66';
            
            // Check if due today or overdue
            const today = new Date();
            const dueDate = new Date(r.nextDue);
            const isDue = dueDate <= today;
            const dueBadge = isDue ? ' 🔴' : '';
            
            html += `
                <tr style="${isDue ? 'background: rgba(255, 107, 107, 0.1);' : ''}">
                    <td>${typeIcon} ${r.description}</td>
                    <td style="text-align: right; font-weight: bold; color: ${amountColor};">
                        ${formatCurrency(r.amount)}
                    </td>
                    <td>${r.category}</td>
                    <td>${r.frequency}${dueBadge}</td>
                    <td>${nextDue}</td>
                    <td>${userIcon}</td>
                    <td style="text-align: center;">
                        <button onclick="deleteRecurringTransaction('${r.id}')" 
                                title="Delete" 
                                style="background:none;border:none;cursor:pointer;color:#ff6b6b;font-size:16px;padding:4px;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        contentDiv.innerHTML = html;
        
        // Show count of due transactions
        const dueCount = recurring.filter(r => new Date(r.nextDue) <= new Date()).length;
        if (dueCount > 0) {
            storageManager.showStatus(`⏰ ${dueCount} recurring transaction(s) due for processing`, 'warning');
        }
        
    } catch (error) {
        console.error('Error loading recurring transactions:', error);
        document.getElementById('recurringListContent').innerHTML = '<p style="color: #ff6b6b;">Error loading recurring transactions.</p>';
    }
}

async function deleteRecurringTransaction(id) {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return;
    
    try {
        const result = await storageManager.deleteRecurringTransaction(id);
        
        if (result.success) {
            alert('✅ Recurring transaction deleted successfully!');
            loadRecurringTransactions();
        } else {
            alert('❌ Failed to delete recurring transaction: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting recurring transaction:', error);
        alert('❌ Error deleting recurring transaction. Please try again.');
    }
}

async function processRecurringTransactions() {
    try {
        const result = await storageManager.processDueRecurringTransactions();
        
        if (result.success) {
            if (result.processed > 0) {
                alert(`✅ Processed ${result.processed} recurring transaction(s) successfully!`);
                loadRecurringTransactions();
                
                // Show which transactions were processed
                const processedNames = result.transactions.map(t => t.description).join(', ');
                storageManager.showStatus(`✅ Processed: ${processedNames}`, 'success');
            } else {
                alert('ℹ️ No recurring transactions are due for processing.');
            }
        } else {
            alert('❌ Error processing recurring transactions: ' + result.error);
        }
    } catch (error) {
        console.error('Error processing recurring transactions:', error);
        alert('❌ Error processing recurring transactions. Please try again.');
    }
}

// Budget Management Functions
function showBudgetSection() {
    hideAllSections();
    document.getElementById('budgetSection').style.display = 'block';
    loadBudgetOverview();
    loadBudgets();
    loadAlertSettings();
}

async function setBudget() {
    const user = document.getElementById('budgetUser').value;
    const category = document.getElementById('budgetCategory').value;
    const amount = document.getElementById('budgetAmount').value;
    const period = document.getElementById('budgetPeriod').value;
    
    if (!category || !amount || parseFloat(amount) <= 0) {
        alert('Please select a category and enter a valid amount');
        return;
    }
    
    const budget = {
        user,
        category,
        amount: parseFloat(amount),
        period
    };
    
    try {
        const result = await storageManager.addBudget(budget);
        
        if (result.success) {
            alert(`✅ Budget set successfully! ₹${amount} for ${category} (${period})`);
            
            // Clear form
            document.getElementById('budgetCategory').selectedIndex = 0;
            document.getElementById('budgetAmount').value = '';
            
            // Reload budget data
            loadBudgetOverview();
            loadBudgets();
        } else {
            alert('❌ Error setting budget: ' + result.error);
        }
    } catch (error) {
        console.error('Error setting budget:', error);
        alert('❌ Error setting budget. Please try again.');
    }
}

async function loadBudgetOverview() {
    try {
        const user = document.getElementById('selectOption').value;
        const budgetStatus = await storageManager.getBudgetStatus(user);
        const contentDiv = document.getElementById('budgetStatusContent');
        
        if (!budgetStatus.success || Object.keys(budgetStatus.budgetStatus).length === 0) {
            contentDiv.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No budgets set for current month.</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 12px;">';
        
        Object.values(budgetStatus.budgetStatus).forEach(status => {
            const { budget, spent, remaining, percentage } = status;
            
            // Color coding based on budget status
            let statusColor = '#51cf66'; // Green
            let statusIcon = '✅';
            
            if (percentage >= 100) {
                statusColor = '#ff6b6b'; // Red
                statusIcon = '🚨';
            } else if (percentage >= 90) {
                statusColor = '#ffa726'; // Orange
                statusIcon = '⚠️';
            } else if (percentage >= 80) {
                statusColor = '#ffeb3b'; // Yellow
                statusIcon = '⚡';
            }
            
            const userIcon = budget.user === 'A' ? '👩' : budget.user === 'S' ? '👨' : '👨‍👩‍👧‍👦';
            
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: bold;">${statusIcon} ${userIcon} ${budget.category}</span>
                        <span style="font-size: 12px; color: rgba(255,255,255,0.8);">${percentage.toFixed(0)}%</span>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                        <div style="background: ${statusColor}; height: 100%; width: ${Math.min(percentage, 100)}%; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span>Spent: ${formatCurrency(spent)}</span>
                        <span>Budget: ${formatCurrency(budget.amount)}</span>
                    </div>
                    <div style="text-align: center; font-size: 11px; color: ${remaining >= 0 ? '#51cf66' : '#ff6b6b'};">
                        ${remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        contentDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading budget overview:', error);
        document.getElementById('budgetStatusContent').innerHTML = '<p style="color: #ff6b6b;">Error loading budget overview.</p>';
    }
}

async function loadBudgets() {
    try {
        const budgets = await storageManager.getBudgets();
        const contentDiv = document.getElementById('budgetListContent');
        
        if (budgets.length === 0) {
            contentDiv.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No budgets set up yet.</p>';
            return;
        }
        
        let html = '<div class="table-container"><table style="width: 100%;">';
        html += `
            <thead>
                <tr>
                    <th>User</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Period</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        budgets.forEach(budget => {
            const userIcon = budget.user === 'A' ? '👩 Ashi' : budget.user === 'S' ? '👨 Sanju' : '👨‍👩‍👧‍👦 Family';
            
            html += `
                <tr>
                    <td>${userIcon}</td>
                    <td>${budget.category === 'total' ? '🎯 Total Budget' : budget.category}</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(budget.amount)}</td>
                    <td>${budget.period}</td>
                    <td style="text-align: center;">
                        <button onclick="deleteBudget('${budget.id}')" 
                                title="Delete" 
                                style="background:none;border:none;cursor:pointer;color:#ff6b6b;font-size:16px;padding:4px;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        contentDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading budgets:', error);
        document.getElementById('budgetListContent').innerHTML = '<p style="color: #ff6b6b;">Error loading budgets.</p>';
    }
}

async function deleteBudget(id) {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
        const result = await storageManager.deleteBudget(id);
        
        if (result.success) {
            alert('✅ Budget deleted successfully!');
            loadBudgetOverview();
            loadBudgets();
        } else {
            alert('❌ Failed to delete budget: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
        alert('❌ Error deleting budget. Please try again.');
    }
}

async function loadBudgetAnalysis() {
    // This would show detailed spending analysis
    alert('📊 Budget analysis feature coming soon! For now, check the budget overview above.');
}

function loadAlertSettings() {
    // Load saved alert settings from localStorage
    const alertEnable = localStorage.getItem('budgetAlertsEnabled') !== 'false';
    const warningThreshold = localStorage.getItem('budgetWarningThreshold') || '80';
    const criticalThreshold = localStorage.getItem('budgetCriticalThreshold') || '100';
    
    document.getElementById('alertEnable').checked = alertEnable;
    document.getElementById('warningThreshold').value = warningThreshold;
    document.getElementById('criticalThreshold').value = criticalThreshold;
}

function saveAlertSettings() {
    const alertEnable = document.getElementById('alertEnable').checked;
    const warningThreshold = document.getElementById('warningThreshold').value;
    const criticalThreshold = document.getElementById('criticalThreshold').value;
    
    localStorage.setItem('budgetAlertsEnabled', alertEnable);
    localStorage.setItem('budgetWarningThreshold', warningThreshold);
    localStorage.setItem('budgetCriticalThreshold', criticalThreshold);
    
    alert('✅ Alert settings saved successfully!');
}

// Charts and Visualizations
let chartInstances = {};

function showChartsSection() {
    hideAllSections();
    document.getElementById('chartsSection').style.display = 'block';
    
    // Set default values
    document.getElementById('chartUser').value = document.getElementById('selectOption').value;
}

async function generateCharts() {
    const user = document.getElementById('chartUser').value;
    const period = document.getElementById('chartPeriod').value;
    
    try {
        // Get data for the specified period
        const data = await getChartData(user, period);
        
        if (!data || data.length === 0) {
            alert('No data available for the selected period');
            return;
        }
        
        // Show charts container
        document.getElementById('chartsContainer').style.display = 'block';
        
        // Generate different charts
        await createCategoryChart(data);
        await createTrendsChart(data, period);
        await createIncomeExpenseChart(data, period);
        await createDailyChart(data);
        await createBudgetChart(user);
        
        storageManager.showStatus('📊 Charts generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating charts:', error);
        alert('Error generating charts. Please try again.');
    }
}

async function getChartData(user, period) {
    try {
        const transaction = storageManager.db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const allData = await storageManager.getAllFromStore(store);
        
        // Filter data based on user and period
        const now = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'currentMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'last3Months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                endDate = now;
                break;
            case 'last6Months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                endDate = now;
                break;
            case 'currentYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = now;
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
        }
        
        return allData.filter(entry => {
            const entryDate = new Date(entry.date);
            const matchesDate = entryDate >= startDate && entryDate <= endDate;
            const matchesUser = user === 'combined' || entry.user === user;
            return matchesDate && matchesUser;
        });
        
    } catch (error) {
        console.error('Error getting chart data:', error);
        return [];
    }
}

function createCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Destroy existing chart
    if (chartInstances.categoryChart) {
        chartInstances.categoryChart.destroy();
    }
    
    // Process data for category breakdown
    const categoryData = {};
    data.filter(entry => entry.entryType === 'expense').forEach(entry => {
        const amount = Math.abs(parseFloat(entry.amount));
        categoryData[entry.type] = (categoryData[entry.type] || 0) + amount;
    });
    
    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);
    
    // Generate colors
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];
    
    chartInstances.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 20,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed / amounts.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createTrendsChart(data, period) {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    if (chartInstances.trendsChart) {
        chartInstances.trendsChart.destroy();
    }
    
    // Group data by month
    const monthlyData = {};
    data.forEach(entry => {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        
        const amount = Math.abs(parseFloat(entry.amount));
        monthlyData[monthKey][entry.entryType] += amount;
    });
    
    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expense);
    
    chartInstances.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(year, monthNum - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            }),
            datasets: [{
                label: '💰 Income',
                data: incomeData,
                borderColor: '#51cf66',
                backgroundColor: 'rgba(81, 207, 102, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: '💸 Expenses',
                data: expenseData,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
}

function createIncomeExpenseChart(data, period) {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (chartInstances.incomeExpenseChart) {
        chartInstances.incomeExpenseChart.destroy();
    }
    
    const totalIncome = data
        .filter(entry => entry.entryType === 'income')
        .reduce((sum, entry) => sum + Math.abs(parseFloat(entry.amount)), 0);
    
    const totalExpense = data
        .filter(entry => entry.entryType === 'expense')
        .reduce((sum, entry) => sum + Math.abs(parseFloat(entry.amount)), 0);
    
    chartInstances.incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['💰 Income', '💸 Expenses', '💵 Net'],
            datasets: [{
                data: [totalIncome, totalExpense, totalIncome - totalExpense],
                backgroundColor: ['#51cf66', '#ff6b6b', totalIncome - totalExpense >= 0 ? '#51cf66' : '#ff6b6b'],
                borderColor: ['#40c057', '#ff5252', totalIncome - totalExpense >= 0 ? '#40c057' : '#ff5252'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(Math.abs(context.parsed.y));
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return '₹' + Math.abs(value).toLocaleString('en-IN');
                        }
                    },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { display: false }
                }
            }
        }
    });
}

function createDailyChart(data) {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    if (chartInstances.dailyChart) {
        chartInstances.dailyChart.destroy();
    }
    
    // Group by day of week
    const dayData = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    data.filter(entry => entry.entryType === 'expense').forEach(entry => {
        const day = new Date(entry.date).getDay();
        dayData[day] += Math.abs(parseFloat(entry.amount));
    });
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    chartInstances.dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayNames,
            datasets: [{
                label: 'Average Daily Spending',
                data: Object.values(dayData),
                backgroundColor: 'rgba(116, 192, 252, 0.8)',
                borderColor: '#339af0',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    labels: { color: '#fff' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { display: false }
                }
            }
        }
    });
}

async function createBudgetChart(user) {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    
    if (chartInstances.budgetChart) {
        chartInstances.budgetChart.destroy();
    }
    
    try {
        const budgetStatus = await storageManager.getBudgetStatus(user);
        
        if (!budgetStatus.success || Object.keys(budgetStatus.budgetStatus).length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('No budgets set up', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        const budgets = Object.values(budgetStatus.budgetStatus);
        const categories = budgets.map(b => b.budget.category);
        const spent = budgets.map(b => b.spent);
        const budgetAmounts = budgets.map(b => b.budget.amount);
        
        chartInstances.budgetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: '💸 Spent',
                    data: spent,
                    backgroundColor: 'rgba(255, 107, 107, 0.8)',
                    borderColor: '#ff5252',
                    borderWidth: 2
                }, {
                    label: '🎯 Budget',
                    data: budgetAmounts,
                    backgroundColor: 'rgba(81, 207, 102, 0.8)',
                    borderColor: '#40c057',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: '#fff' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: '#fff' },
                        grid: { display: false }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error creating budget chart:', error);
    }
}

function exportCharts() {
    // Create a temporary container for all charts
    const chartsData = [];
    
    Object.keys(chartInstances).forEach(key => {
        if (chartInstances[key]) {
            chartsData.push({
                name: key,
                image: chartInstances[key].toBase64Image()
            });
        }
    });
    
    if (chartsData.length === 0) {
        alert('No charts to export. Generate charts first.');
        return;
    }
    
    // For now, just show the first chart as downloadable
    const link = document.createElement('a');
    link.download = `expense-charts-${new Date().toISOString().split('T')[0]}.png`;
    link.href = chartsData[0].image;
    link.click();
    
    storageManager.showStatus('📊 Chart exported successfully!', 'success');
}

// Advanced Reporting Functions
function showReportsSection() {
    hideAllSections();
    document.getElementById('reportsSection').style.display = 'block';
    
    // Set default values
    document.getElementById('reportUser').value = document.getElementById('selectOption').value;
    
    // Setup report type change handler
    document.getElementById('reportType').addEventListener('change', function() {
        const customRange = document.getElementById('customDateRange');
        if (this.value === 'custom') {
            customRange.style.display = 'grid';
            // Set default dates to current month
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
            document.getElementById('reportEndDate').value = now.toISOString().split('T')[0];
        } else {
            customRange.style.display = 'none';
        }
    });
}

async function generateReport() {
    const user = document.getElementById('reportUser').value;
    const reportType = document.getElementById('reportType').value;
    let startDate, endDate;
    
    // Calculate date range based on report type
    const now = new Date();
    
    switch (reportType) {
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'quarterly':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
            break;
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        case 'custom':
            const startInput = document.getElementById('reportStartDate').value;
            const endInput = document.getElementById('reportEndDate').value;
            
            if (!startInput || !endInput) {
                alert('Please select both start and end dates');
                return;
            }
            
            startDate = new Date(startInput);
            endDate = new Date(endInput);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
    }
    
    try {
        // Get data for the period
        const data = await getReportData(user, startDate, endDate);
        
        if (!data || data.length === 0) {
            alert('No data available for the selected period');
            return;
        }
        
        // Generate quick stats
        await generateQuickStats(data, startDate, endDate);
        
        // Generate detailed report
        await generateDetailedReport(data, user, startDate, endDate, reportType);
        
        // Show sections
        document.getElementById('quickStats').style.display = 'block';
        document.getElementById('detailedReport').style.display = 'block';
        
        storageManager.showStatus('📊 Report generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Error generating report. Please try again.');
    }
}

async function getReportData(user, startDate, endDate) {
    try {
        const transaction = storageManager.db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const allData = await storageManager.getAllFromStore(store);
        
        return allData.filter(entry => {
            const entryDate = new Date(entry.date);
            const matchesDate = entryDate >= startDate && entryDate <= endDate;
            const matchesUser = user === 'combined' || entry.user === user;
            return matchesDate && matchesUser;
        });
        
    } catch (error) {
        console.error('Error getting report data:', error);
        return [];
    }
}

function generateQuickStats(data, startDate, endDate) {
    const totalExpense = data
        .filter(entry => entry.entryType === 'expense')
        .reduce((sum, entry) => sum + Math.abs(parseFloat(entry.amount)), 0);
    
    const totalIncome = data
        .filter(entry => entry.entryType === 'income')
        .reduce((sum, entry) => sum + Math.abs(parseFloat(entry.amount)), 0);
    
    const netBalance = totalIncome - totalExpense;
    
    // Calculate average daily expense
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
    const avgDaily = totalExpense / daysDiff;
    
    // Update cards
    document.getElementById('totalExpenseCard').textContent = formatCurrency(totalExpense);
    document.getElementById('totalIncomeCard').textContent = formatCurrency(totalIncome);
    document.getElementById('netBalanceCard').textContent = formatCurrency(netBalance);
    document.getElementById('netBalanceCard').style.color = netBalance >= 0 ? '#51cf66' : '#ff6b6b';
    document.getElementById('avgDailyCard').textContent = formatCurrency(avgDaily);
}

function generateDetailedReport(data, user, startDate, endDate, reportType) {
    const reportContent = document.getElementById('reportContent');
    
    // Create comprehensive analysis
    let html = `
        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
            <h5 style="margin: 0 0 12px 0;">📅 Report Period</h5>
            <p style="margin: 0; font-size: 14px;">
                <strong>From:</strong> ${startDate.toLocaleDateString('en-IN')} 
                <strong>To:</strong> ${endDate.toLocaleDateString('en-IN')}
                <br><strong>User:</strong> ${user === 'A' ? '👩 Ashi' : user === 'S' ? '👨 Sanju' : '👨‍👩‍👧‍👦 Family'}
                <br><strong>Total Transactions:</strong> ${data.length}
            </p>
        </div>
    `;
    
    // Category breakdown
    const categoryBreakdown = {};
    const expenseData = data.filter(entry => entry.entryType === 'expense');
    
    expenseData.forEach(entry => {
        const amount = Math.abs(parseFloat(entry.amount));
        categoryBreakdown[entry.type] = (categoryBreakdown[entry.type] || 0) + amount;
    });
    
    html += `
        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
            <h5 style="margin: 0 0 12px 0;">🏷️ Expense Breakdown by Category</h5>
            <div class="table-container">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th style="text-align: right;">Amount</th>
                            <th style="text-align: right;">Percentage</th>
                            <th style="text-align: right;">Transactions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    const totalExpense = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0);
    
    Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, amount]) => {
            const percentage = totalExpense > 0 ? (amount / totalExpense * 100).toFixed(1) : 0;
            const transactionCount = expenseData.filter(e => e.type === category).length;
            
            html += `
                <tr>
                    <td>${category}</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(amount)}</td>
                    <td style="text-align: right;">${percentage}%</td>
                    <td style="text-align: right;">${transactionCount}</td>
                </tr>
            `;
        });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Monthly trend (if applicable)
    if (reportType !== 'monthly') {
        const monthlyTrend = {};
        data.forEach(entry => {
            const date = new Date(entry.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyTrend[monthKey]) {
                monthlyTrend[monthKey] = { income: 0, expense: 0 };
            }
            
            const amount = Math.abs(parseFloat(entry.amount));
            monthlyTrend[monthKey][entry.entryType] += amount;
        });
        
        html += `
            <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <h5 style="margin: 0 0 12px 0;">📈 Monthly Trend</h5>
                <div class="table-container">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th style="text-align: right;">Income</th>
                                <th style="text-align: right;">Expenses</th>
                                <th style="text-align: right;">Net</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        Object.entries(monthlyTrend)
            .sort()
            .forEach(([month, data]) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                const net = data.income - data.expense;
                
                html += `
                    <tr>
                        <td>${monthName}</td>
                        <td style="text-align: right; color: #51cf66;">${formatCurrency(data.income)}</td>
                        <td style="text-align: right; color: #ff6b6b;">${formatCurrency(data.expense)}</td>
                        <td style="text-align: right; color: ${net >= 0 ? '#51cf66' : '#ff6b6b'}; font-weight: bold;">${formatCurrency(net)}</td>
                    </tr>
                `;
            });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Top transactions
    const sortedTransactions = data
        .sort((a, b) => Math.abs(parseFloat(b.amount)) - Math.abs(parseFloat(a.amount)))
        .slice(0, 10);
    
    html += `
        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px;">
            <h5 style="margin: 0 0 12px 0;">🔝 Top 10 Transactions</h5>
            <div class="table-container">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th style="text-align: right;">Amount</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    sortedTransactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString('en-IN');
        const amount = Math.abs(parseFloat(transaction.amount));
        const typeIcon = transaction.entryType === 'expense' ? '💸' : '💰';
        const amountColor = transaction.entryType === 'expense' ? '#ff6b6b' : '#51cf66';
        
        html += `
            <tr>
                <td>${date}</td>
                <td>${transaction.description}</td>
                <td>${transaction.type}</td>
                <td style="text-align: right; font-weight: bold; color: ${amountColor};">${formatCurrency(amount)}</td>
                <td>${typeIcon} ${transaction.entryType}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

// Export Functions
async function exportAllData() {
    try {
        const result = await storageManager.exportData();
        if (result.success) {
            storageManager.showStatus('💾 All data exported successfully!', 'success');
        } else {
            alert('❌ Export failed: ' + result.error);
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('❌ Export failed. Please try again.');
    }
}

function exportToPDF() {
    // For now, show info about PDF export
    alert('📄 PDF Export feature coming soon! For now, you can:\n\n1. Take screenshots of the report\n2. Print the page using Ctrl+P\n3. Export data as CSV or JSON');
}

async function exportToCSV() {
    try {
        const user = document.getElementById('reportUser').value;
        const reportType = document.getElementById('reportType').value;
        
        // Get current report data
        const now = new Date();
        let startDate, endDate;
        
        switch (reportType) {
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
        }
        
        const data = await getReportData(user, startDate, endDate);
        
        if (!data.length) {
            alert('No data to export');
            return;
        }
        
        // Create CSV content
        const headers = ['Date', 'User', 'Type', 'Category', 'Description', 'Amount', 'Entry Type'];
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(entry => {
            const row = [
                entry.date,
                entry.user === 'A' ? 'Ashi' : 'Sanju',
                entry.type,
                entry.type,
                `"${entry.description.replace(/"/g, '""')}"`, // Escape quotes
                Math.abs(parseFloat(entry.amount)),
                entry.entryType
            ];
            csvContent += row.join(',') + '\n';
        });
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-report-${reportType}-${now.toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        storageManager.showStatus('📊 CSV exported successfully!', 'success');
        
    } catch (error) {
        console.error('CSV export error:', error);
        alert('❌ CSV export failed. Please try again.');
    }
}

function exportToJSON() {
    // Use the existing export function
    exportAllData();
}

function sharableReport() {
    // Create a shareable link with report parameters
    const user = document.getElementById('reportUser').value;
    const reportType = document.getElementById('reportType').value;
    
    const params = new URLSearchParams({
        user,
        reportType,
        generated: new Date().toISOString()
    });
    
    const shareableLink = `${window.location.origin}/?${params.toString()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableLink).then(() => {
        storageManager.showStatus('📤 Shareable link copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback: show the link in a prompt
        prompt('Copy this shareable link:', shareableLink);
    });
}

// Update hideAllSections to include reports section
function hideAllSections() {
    document.getElementById('summaryForm').style.display = 'none';
    document.getElementById('summaryResult').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchFilterSection').style.display = 'none';
    document.getElementById('recurringSection').style.display = 'none';
    document.getElementById('budgetSection').style.display = 'none';
    document.getElementById('chartsSection').style.display = 'none';
    document.getElementById('reportsSection').style.display = 'none';
}

// Auto-process recurring transactions on app load
window.addEventListener('load', async () => {
    // Wait for storage manager to initialize
    setTimeout(async () => {
        if (storageManager && storageManager.db) {
            const recurring = await storageManager.getRecurringTransactions();
            const dueCount = recurring.filter(r => new Date(r.nextDue) <= new Date()).length;
            
            if (dueCount > 0) {
                storageManager.showStatus(`⏰ ${dueCount} recurring transaction(s) ready to process`, 'warning');
            }
        }
    }, 2000);
});
