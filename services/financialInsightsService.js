/**
 * Financial Insights & Savings Optimization Service
 * 
 * This module applies best practices from renowned financial experts:
 * - Ramit Sethi: Conscious Spending (spend guilt-free on things you love, cut back ruthlessly on things you don't)
 * - Dave Ramsey: Zero-Based Budgeting (every rupee has a purpose)
 * - Elizabeth Warren: 50/30/20 Rule (50% Needs, 30% Wants, 20% Savings)
 * - Morgan Housel: Behavioral Finance (understanding spending psychology)
 * 
 * Key Concepts:
 * - Savings Rate: Target 20%+ for healthy financial growth
 * - Emergency Fund: 3-6 months of expenses saved
 * - Lifestyle Inflation: Expense growth should not exceed income growth
 * - Conscious Spending: Identify high-value vs low-value expenses
 * - Category Thresholds: No single category should exceed 25% of income
 * 
 * Tunable Parameters (adjust in THRESHOLDS object):
 * - TARGET_SAVINGS_RATE: 20% (healthy savings target)
 * - EXCELLENT_SAVINGS_RATE: 35% (excellent performance)
 * - CATEGORY_WARNING_THRESHOLD: 25% (warning if category exceeds this % of income)
 * - MOM_GROWTH_WARNING: 30% (warning if category grows this % month-over-month)
 * - EMERGENCY_FUND_MONTHS: 3-6 (target months of expenses to save)
 * 
 * Categories Classification:
 * - NEEDS: Groceries, Utilities, Rent, Healthcare, Transportation, Insurance
 * - WANTS: Dining Out, Entertainment, Shopping, Travel, Subscriptions
 * - SAVINGS: Investments, Emergency Fund, Retirement
 */

// Financial thresholds and targets (easily adjustable)
const THRESHOLDS = {
    TARGET_SAVINGS_RATE: 20,        // Target savings as % of income
    EXCELLENT_SAVINGS_RATE: 35,     // Excellent savings rate
    POOR_SAVINGS_RATE: 10,          // Below this is concerning
    CATEGORY_WARNING_THRESHOLD: 25, // Alert if category > 25% of income
    MOM_GROWTH_WARNING: 30,         // Alert if category grows >30% month-over-month
    EMERGENCY_FUND_MIN: 3,          // Minimum months of expenses
    EMERGENCY_FUND_IDEAL: 6,        // Ideal months of expenses
    WANTS_MAX_PERCENTAGE: 30,       // Max recommended for "Wants" (50/30/20 rule)
    NEEDS_MAX_PERCENTAGE: 50,       // Max recommended for "Needs"
};

// Category classification for behavioral insights
const CATEGORY_TYPES = {
    NEEDS: ['groceries', 'utilities', 'rent', 'healthcare', 'medical', 'insurance', 
            'transportation', 'fuel', 'maintenance', 'bills', 'emi', 'loan'],
    WANTS: ['dining', 'restaurant', 'food', 'entertainment', 'movies', 'shopping', 
            'clothes', 'travel', 'vacation', 'subscription', 'streaming', 'hobbies', 
            'games', 'sports', 'gym'],
    SAVINGS: ['investment', 'mutual fund', 'sip', 'stocks', 'savings', 'emergency', 
              'retirement', 'fd', 'gold']
};

/**
 * Classify a category as NEEDS, WANTS, or SAVINGS
 */
function classifyCategory(category) {
    if (!category) return 'WANTS'; // Default to wants if unclear
    
    const categoryLower = category.toLowerCase();
    
    if (CATEGORY_TYPES.NEEDS.some(need => categoryLower.includes(need))) {
        return 'NEEDS';
    }
    if (CATEGORY_TYPES.SAVINGS.some(saving => categoryLower.includes(saving))) {
        return 'SAVINGS';
    }
    return 'WANTS';
}

/**
 * Calculate summary statistics for a time period
 */
function calculatePeriodStats(transactions) {
    const stats = {
        totalIncome: 0,
        totalExpense: 0,
        totalSavings: 0,
        netSavings: 0,
        savingsRate: 0,
        categoryBreakdown: {},
        needsTotal: 0,
        wantsTotal: 0,
        savingsTotal: 0,
        transactionCount: transactions.length
    };
    
    transactions.forEach(txn => {
        const amount = Math.abs(parseFloat(txn.amount) || 0);
        
        if (txn.entryType === 'income') {
            stats.totalIncome += amount;
        } else if (txn.entryType === 'expense') {
            stats.totalExpense += amount;
            
            // Category breakdown
            const category = txn.type || txn.category || 'Uncategorized';
            if (!stats.categoryBreakdown[category]) {
                stats.categoryBreakdown[category] = {
                    total: 0,
                    count: 0,
                    type: classifyCategory(category)
                };
            }
            stats.categoryBreakdown[category].total += amount;
            stats.categoryBreakdown[category].count += 1;
            
            // Classify spending
            const categoryType = classifyCategory(category);
            if (categoryType === 'NEEDS') {
                stats.needsTotal += amount;
            } else if (categoryType === 'WANTS') {
                stats.wantsTotal += amount;
            } else if (categoryType === 'SAVINGS') {
                stats.savingsTotal += amount;
            }
        }
        
        // Track explicit savings
        if (txn.isSaving === 'YES' || txn.isSaving === true) {
            stats.totalSavings += amount;
        }
    });
    
    stats.netSavings = stats.totalIncome - stats.totalExpense;
    stats.savingsRate = stats.totalIncome > 0 
        ? ((stats.netSavings / stats.totalIncome) * 100).toFixed(2)
        : 0;
    
    return stats;
}

/**
 * Calculate month-over-month changes
 */
function calculateMoMChanges(lastMonthStats, currentMonthStats) {
    const changes = {
        incomeChange: 0,
        expenseChange: 0,
        savingsChange: 0,
        categoryChanges: {}
    };
    
    if (lastMonthStats.totalIncome > 0) {
        changes.incomeChange = (
            ((currentMonthStats.totalIncome - lastMonthStats.totalIncome) / lastMonthStats.totalIncome) * 100
        ).toFixed(2);
    }
    
    if (lastMonthStats.totalExpense > 0) {
        changes.expenseChange = (
            ((currentMonthStats.totalExpense - lastMonthStats.totalExpense) / lastMonthStats.totalExpense) * 100
        ).toFixed(2);
    }
    
    if (lastMonthStats.netSavings > 0) {
        changes.savingsChange = (
            ((currentMonthStats.netSavings - lastMonthStats.netSavings) / lastMonthStats.netSavings) * 100
        ).toFixed(2);
    }
    
    // Category-level changes
    Object.keys(currentMonthStats.categoryBreakdown).forEach(category => {
        const currentAmount = currentMonthStats.categoryBreakdown[category].total;
        const lastAmount = lastMonthStats.categoryBreakdown[category]?.total || 0;
        
        if (lastAmount > 0) {
            changes.categoryChanges[category] = (
                ((currentAmount - lastAmount) / lastAmount) * 100
            ).toFixed(2);
        } else if (currentAmount > 0) {
            changes.categoryChanges[category] = 100; // New category
        }
    });
    
    return changes;
}

/**
 * Calculate 3-month moving averages
 */
function calculate3MonthAverage(threeMonthStats, last2MonthStats, lastMonthStats) {
    return {
        avgIncome: ((threeMonthStats.totalIncome + last2MonthStats.totalIncome + lastMonthStats.totalIncome) / 3).toFixed(2),
        avgExpense: ((threeMonthStats.totalExpense + last2MonthStats.totalExpense + lastMonthStats.totalExpense) / 3).toFixed(2),
        avgSavings: ((threeMonthStats.netSavings + last2MonthStats.netSavings + lastMonthStats.netSavings) / 3).toFixed(2),
        avgSavingsRate: (
            (parseFloat(threeMonthStats.savingsRate) + parseFloat(last2MonthStats.savingsRate) + parseFloat(lastMonthStats.savingsRate)) / 3
        ).toFixed(2)
    };
}

/**
 * Generate behavioral insights based on spending patterns
 */
function generateBehavioralInsights(currentMonthStats, lastMonthStats, threeMonthAvg, momChanges) {
    const insights = [];
    
    // 1. Savings Rate Analysis (Ramit Sethi + Dave Ramsey principles)
    const savingsRate = parseFloat(currentMonthStats.savingsRate);
    if (savingsRate >= THRESHOLDS.EXCELLENT_SAVINGS_RATE) {
        insights.push({
            type: 'positive',
            category: 'Savings',
            message: `Excellent! You're saving ${savingsRate}% of your income. Consider investing a portion into SIP, emergency fund, or retirement corpus.`,
            priority: 'high'
        });
    } else if (savingsRate >= THRESHOLDS.TARGET_SAVINGS_RATE) {
        insights.push({
            type: 'positive',
            category: 'Savings',
            message: `Great job! Your ${savingsRate}% savings rate meets the healthy 20% target. Keep up the consistency.`,
            priority: 'medium'
        });
    } else if (savingsRate >= THRESHOLDS.POOR_SAVINGS_RATE) {
        insights.push({
            type: 'warning',
            category: 'Savings',
            message: `Your savings rate is ${savingsRate}%, below the 20% healthy target. Consider automating transfers to improve consistency.`,
            priority: 'high'
        });
    } else {
        insights.push({
            type: 'critical',
            category: 'Savings',
            message: `Critical: Your savings rate is only ${savingsRate}%. Focus on reducing variable expenses and building an emergency fund.`,
            priority: 'critical'
        });
    }
    
    // 2. Lifestyle Inflation Check (Morgan Housel principle)
    const expenseGrowth = parseFloat(momChanges.expenseChange);
    const incomeGrowth = parseFloat(momChanges.incomeChange);
    
    if (expenseGrowth > incomeGrowth && expenseGrowth > 0) {
        insights.push({
            type: 'warning',
            category: 'Lifestyle',
            message: `Lifestyle inflation detected: Expenses grew ${expenseGrowth}% while income grew ${incomeGrowth}%. Review variable costs.`,
            priority: 'high'
        });
    }
    
    // 3. Emergency Fund Health
    const avgMonthlyExpense = parseFloat(threeMonthAvg.avgExpense);
    const currentBalance = currentMonthStats.netSavings;
    const monthsOfExpenses = avgMonthlyExpense > 0 ? (currentBalance / avgMonthlyExpense).toFixed(1) : 0;
    
    if (monthsOfExpenses < THRESHOLDS.EMERGENCY_FUND_MIN) {
        insights.push({
            type: 'warning',
            category: 'Emergency Fund',
            message: `Your current balance covers only ${monthsOfExpenses} months of expenses. Build an emergency fund of ${THRESHOLDS.EMERGENCY_FUND_MIN}-${THRESHOLDS.EMERGENCY_FUND_IDEAL} months.`,
            priority: 'high'
        });
    } else if (monthsOfExpenses >= THRESHOLDS.EMERGENCY_FUND_IDEAL) {
        insights.push({
            type: 'positive',
            category: 'Emergency Fund',
            message: `Excellent! You have ${monthsOfExpenses} months of expenses saved. Your emergency fund is well-established.`,
            priority: 'low'
        });
    }
    
    // 4. 50/30/20 Rule Analysis (Elizabeth Warren)
    const needsPercentage = currentMonthStats.totalIncome > 0 
        ? ((currentMonthStats.needsTotal / currentMonthStats.totalIncome) * 100).toFixed(1)
        : 0;
    const wantsPercentage = currentMonthStats.totalIncome > 0
        ? ((currentMonthStats.wantsTotal / currentMonthStats.totalIncome) * 100).toFixed(1)
        : 0;
    
    if (parseFloat(wantsPercentage) > THRESHOLDS.WANTS_MAX_PERCENTAGE) {
        insights.push({
            type: 'warning',
            category: 'Spending Balance',
            message: `Your "Wants" spending is ${wantsPercentage}% of income (recommended: <30%). Consider reducing discretionary expenses.`,
            priority: 'medium'
        });
    }
    
    if (parseFloat(needsPercentage) > THRESHOLDS.NEEDS_MAX_PERCENTAGE) {
        insights.push({
            type: 'info',
            category: 'Spending Balance',
            message: `Your "Needs" are ${needsPercentage}% of income (recommended: ~50%). Look for ways to optimize essential costs.`,
            priority: 'low'
        });
    }
    
    // 5. Category-Specific Insights
    Object.entries(currentMonthStats.categoryBreakdown).forEach(([category, data]) => {
        const categoryPercentage = currentMonthStats.totalIncome > 0
            ? ((data.total / currentMonthStats.totalIncome) * 100).toFixed(1)
            : 0;
        
        // Alert if category exceeds 25% of income
        if (parseFloat(categoryPercentage) > THRESHOLDS.CATEGORY_WARNING_THRESHOLD) {
            insights.push({
                type: 'warning',
                category: category,
                message: `${category} spending is ${categoryPercentage}% of your income (${data.count} transactions). This may need attention.`,
                priority: 'medium'
            });
        }
        
        // Alert on high month-over-month growth
        const categoryMoM = parseFloat(momChanges.categoryChanges[category] || 0);
        if (categoryMoM > THRESHOLDS.MOM_GROWTH_WARNING) {
            insights.push({
                type: 'warning',
                category: category,
                message: `Your ${category} expenses grew ${categoryMoM}% last month. Consider limiting these purchases.`,
                priority: 'medium'
            });
        }
    });
    
    // 6. Conscious Spending Insight (Ramit Sethi)
    insights.push({
        type: 'info',
        category: 'Conscious Spending',
        message: `Review your top 3 expense categories and ask: "Do these align with my values?" Cut ruthlessly on low-value items, spend freely on high-value ones.`,
        priority: 'low'
    });
    
    return insights;
}

/**
 * Generate actionable suggestions
 */
function generateActionableSuggestions(currentMonthStats, lastMonthStats, momChanges, insights) {
    const suggestions = [];
    
    // Automation suggestion based on income stability
    const incomeChange = Math.abs(parseFloat(momChanges.incomeChange));
    if (incomeChange < 10 && currentMonthStats.totalIncome > 0) {
        const autoTransferAmount = (currentMonthStats.totalIncome * 0.20).toFixed(0);
        suggestions.push({
            action: 'Automate Savings',
            description: `Your income is stable. Set up auto-transfer of ₹${autoTransferAmount} (20%) to savings account on payday.`,
            impact: 'high'
        });
    }
    
    // Zero-based budgeting suggestion
    const idleCash = currentMonthStats.netSavings;
    if (idleCash > currentMonthStats.totalIncome * 0.1) {
        suggestions.push({
            action: 'Allocate Idle Cash',
            description: `You have ₹${idleCash.toFixed(0)} unallocated. Apply zero-based budgeting: assign purpose to every rupee (emergency fund, investments, goals).`,
            impact: 'medium'
        });
    }
    
    // Top expense category optimization
    const topCategories = Object.entries(currentMonthStats.categoryBreakdown)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 3);
    
    if (topCategories.length > 0) {
        const [topCategory, topData] = topCategories[0];
        const topCategoryType = classifyCategory(topCategory);
        
        if (topCategoryType === 'WANTS') {
            suggestions.push({
                action: 'Optimize Top Expense',
                description: `${topCategory} is your #1 expense (₹${topData.total.toFixed(0)}). Set a monthly cap and track weekly to stay within budget.`,
                impact: 'high'
            });
        }
    }
    
    // Recurring expense audit
    suggestions.push({
        action: 'Audit Subscriptions',
        description: 'Review all recurring expenses (subscriptions, memberships). Cancel unused services to save 5-10% monthly.',
        impact: 'medium'
    });
    
    // Needs vs Wants rebalancing
    const wantsPercentage = currentMonthStats.totalIncome > 0
        ? ((currentMonthStats.wantsTotal / currentMonthStats.totalIncome) * 100).toFixed(1)
        : 0;
    
    if (parseFloat(wantsPercentage) > THRESHOLDS.WANTS_MAX_PERCENTAGE) {
        const targetReduction = (currentMonthStats.wantsTotal * 0.20).toFixed(0);
        suggestions.push({
            action: 'Reduce Discretionary Spending',
            description: `Cut "Wants" by 20% (₹${targetReduction}) to align with 50/30/20 rule. Focus on high-impact cuts.`,
            impact: 'high'
        });
    }
    
    // Investment suggestion for good savers
    if (parseFloat(currentMonthStats.savingsRate) > THRESHOLDS.EXCELLENT_SAVINGS_RATE) {
        suggestions.push({
            action: 'Start Investing',
            description: 'You have strong savings habits. Consider starting SIP in index funds (Nifty 50/Sensex) for long-term wealth building.',
            impact: 'high'
        });
    }
    
    return suggestions;
}

/**
 * Calculate Financial Health Score (0-100)
 * 
 * Scoring breakdown:
 * - Savings Rate: 40 points (20%+ = full points)
 * - Spending Balance: 30 points (50/30/20 alignment)
 * - Consistency: 20 points (stable income/expense patterns)
 * - Anomaly Control: 10 points (no extreme spikes)
 */
function calculateFinancialHealthScore(currentMonthStats, lastMonthStats, threeMonthAvg, momChanges) {
    let score = 0;
    const breakdown = {};
    
    // 1. Savings Rate Score (40 points max)
    const savingsRate = parseFloat(currentMonthStats.savingsRate);
    if (savingsRate >= THRESHOLDS.EXCELLENT_SAVINGS_RATE) {
        breakdown.savingsRate = 40;
    } else if (savingsRate >= THRESHOLDS.TARGET_SAVINGS_RATE) {
        breakdown.savingsRate = Math.round((savingsRate / THRESHOLDS.EXCELLENT_SAVINGS_RATE) * 40);
    } else {
        breakdown.savingsRate = Math.round((savingsRate / THRESHOLDS.TARGET_SAVINGS_RATE) * 20);
    }
    score += breakdown.savingsRate;
    
    // 2. Spending Balance Score (30 points max)
    const needsPercentage = currentMonthStats.totalIncome > 0
        ? (currentMonthStats.needsTotal / currentMonthStats.totalIncome) * 100
        : 0;
    const wantsPercentage = currentMonthStats.totalIncome > 0
        ? (currentMonthStats.wantsTotal / currentMonthStats.totalIncome) * 100
        : 0;
    
    let balanceScore = 30;
    if (needsPercentage > 50) balanceScore -= 10;
    if (wantsPercentage > 30) balanceScore -= 10;
    if (savingsRate < 15) balanceScore -= 10;
    
    breakdown.spendingBalance = Math.max(0, balanceScore);
    score += breakdown.spendingBalance;
    
    // 3. Consistency Score (20 points max)
    const incomeVolatility = Math.abs(parseFloat(momChanges.incomeChange));
    const expenseVolatility = Math.abs(parseFloat(momChanges.expenseChange));
    
    let consistencyScore = 20;
    if (incomeVolatility > 20) consistencyScore -= 8;
    if (expenseVolatility > 30) consistencyScore -= 8;
    
    breakdown.consistency = Math.max(0, consistencyScore);
    score += breakdown.consistency;
    
    // 4. Anomaly Control Score (10 points max)
    let anomalyScore = 10;
    
    // Check for extreme category spikes
    Object.entries(momChanges.categoryChanges).forEach(([cat, change]) => {
        if (Math.abs(parseFloat(change)) > 50) {
            anomalyScore -= 2;
        }
    });
    
    breakdown.anomalyControl = Math.max(0, anomalyScore);
    score += breakdown.anomalyControl;
    
    return {
        score: Math.min(100, Math.max(0, score)),
        breakdown,
        rating: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Improvement'
    };
}

/**
 * Main function: Generate comprehensive financial insights
 * 
 * @param {Array} transactions - All transaction records with fields: date, amount, type, entryType, category, isSaving
 * @param {Object} options - Optional parameters: currentDate, userId
 * @returns {Object} Complete insights package
 */
async function generateFinancialInsights(transactions, options = {}) {
    try {
        const currentDate = options.currentDate ? new Date(options.currentDate) : new Date();
        
        // Define time periods
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const lastMonth = new Date(currentYear, currentMonth - 1);
        const twoMonthsAgo = new Date(currentYear, currentMonth - 2);
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3);
        
        // Filter transactions by period
        const currentMonthTxns = transactions.filter(t => {
            const txnDate = new Date(t.date);
            return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
        });
        
        const lastMonthTxns = transactions.filter(t => {
            const txnDate = new Date(t.date);
            return txnDate.getMonth() === lastMonth.getMonth() && txnDate.getFullYear() === lastMonth.getFullYear();
        });
        
        const twoMonthsAgoTxns = transactions.filter(t => {
            const txnDate = new Date(t.date);
            return txnDate.getMonth() === twoMonthsAgo.getMonth() && txnDate.getFullYear() === twoMonthsAgo.getFullYear();
        });
        
        const threeMonthsAgoTxns = transactions.filter(t => {
            const txnDate = new Date(t.date);
            return txnDate.getMonth() === threeMonthsAgo.getMonth() && txnDate.getFullYear() === threeMonthsAgo.getFullYear();
        });
        
        // Calculate statistics for each period
        const currentMonthStats = calculatePeriodStats(currentMonthTxns);
        const lastMonthStats = calculatePeriodStats(lastMonthTxns);
        const twoMonthsAgoStats = calculatePeriodStats(twoMonthsAgoTxns);
        const threeMonthsAgoStats = calculatePeriodStats(threeMonthsAgoTxns);
        
        // Calculate trends
        const momChanges = calculateMoMChanges(lastMonthStats, currentMonthStats);
        const threeMonthAvg = calculate3MonthAverage(threeMonthsAgoStats, twoMonthsAgoStats, lastMonthStats);
        
        // Generate insights
        const behavioralInsights = generateBehavioralInsights(
            currentMonthStats, 
            lastMonthStats, 
            threeMonthAvg, 
            momChanges
        );
        
        const actionableSuggestions = generateActionableSuggestions(
            currentMonthStats, 
            lastMonthStats, 
            momChanges, 
            behavioralInsights
        );
        
        const financialHealthScore = calculateFinancialHealthScore(
            currentMonthStats, 
            lastMonthStats, 
            threeMonthAvg, 
            momChanges
        );
        
        // Top categories (ranked by spend)
        const topCategories = Object.entries(currentMonthStats.categoryBreakdown)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5)
            .map(([category, data]) => ({
                category,
                amount: data.total,
                count: data.count,
                type: data.type,
                percentageOfIncome: currentMonthStats.totalIncome > 0
                    ? ((data.total / currentMonthStats.totalIncome) * 100).toFixed(1)
                    : 0,
                monthOverMonthChange: momChanges.categoryChanges[category] || 0
            }));
        
        // Compile comprehensive response
        return {
            success: true,
            generatedAt: new Date().toISOString(),
            period: {
                current: `${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}`,
                lastMonth: `${lastMonth.toLocaleString('default', { month: 'long' })} ${lastMonth.getFullYear()}`,
                last3Months: `${threeMonthsAgo.toLocaleString('default', { month: 'short' })} - ${lastMonth.toLocaleString('default', { month: 'short' })} ${currentYear}`
            },
            
            summary: {
                currentMonth: {
                    income: currentMonthStats.totalIncome,
                    expense: currentMonthStats.totalExpense,
                    savings: currentMonthStats.netSavings,
                    savingsRate: currentMonthStats.savingsRate,
                    transactions: currentMonthStats.transactionCount
                },
                lastMonth: {
                    income: lastMonthStats.totalIncome,
                    expense: lastMonthStats.totalExpense,
                    savings: lastMonthStats.netSavings,
                    savingsRate: lastMonthStats.savingsRate
                },
                last3MonthsAverage: threeMonthAvg,
                monthOverMonthChange: momChanges
            },
            
            categoryInsights: {
                topCategories,
                needsVsWants: {
                    needs: currentMonthStats.needsTotal,
                    wants: currentMonthStats.wantsTotal,
                    savings: currentMonthStats.savingsTotal,
                    needsPercentage: currentMonthStats.totalIncome > 0
                        ? ((currentMonthStats.needsTotal / currentMonthStats.totalIncome) * 100).toFixed(1)
                        : 0,
                    wantsPercentage: currentMonthStats.totalIncome > 0
                        ? ((currentMonthStats.wantsTotal / currentMonthStats.totalIncome) * 100).toFixed(1)
                        : 0,
                    savingsPercentage: currentMonthStats.savingsRate
                }
            },
            
            trendHighlights: {
                incomeGrowth: momChanges.incomeChange,
                expenseGrowth: momChanges.expenseChange,
                savingsGrowth: momChanges.savingsChange,
                categoryTrends: momChanges.categoryChanges
            },
            
            behavioralInsights: behavioralInsights.sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }),
            
            actionableSuggestions: actionableSuggestions.sort((a, b) => {
                const impactOrder = { high: 0, medium: 1, low: 2 };
                return impactOrder[a.impact] - impactOrder[b.impact];
            }),
            
            financialHealthScore
        };
        
    } catch (error) {
        console.error('Error generating financial insights:', error);
        return {
            success: false,
            message: 'Failed to generate financial insights',
            error: error.message
        };
    }
}

module.exports = {
    generateFinancialInsights,
    THRESHOLDS,
    CATEGORY_TYPES
};
