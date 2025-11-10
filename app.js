const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();
const { generateFinancialInsights } = require('./services/financialInsightsService');

const app = express();
const port = process.env.PORT || 3002;

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let sheets;
let auth;

// Initialize Google Sheets API
async function initializeGoogleSheets() {
    try {
        // Use base64-encoded service account key from environment variable
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            // Decode base64 and parse JSON
            const credentialsJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
            const credentials = JSON.parse(credentialsJson);
            
            auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key.replace(/\\n/g, '\n'),
                SCOPES
            );
        } else {
            // Fallback: Use default credentials
            auth = new google.auth.GoogleAuth({
                scopes: SCOPES,
            });
        }
        
        sheets = google.sheets({ version: 'v4', auth });
        console.log('Google Sheets API initialized successfully');
        
        // Ensure spreadsheet exists
        await ensureSpreadsheetSetup();
    } catch (error) {
        console.error('Failed to initialize Google Sheets:', error);
        console.log('App will work in offline mode only');
    }
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || 'your-spreadsheet-id-here';

app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure Google Sheets setup
async function ensureSpreadsheetSetup() {
    if (!sheets || !SPREADSHEET_ID) return;
    
    try {
        // Check if the spreadsheet exists and has the right structure
        const response = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });
        
        console.log('Connected to spreadsheet:', response.data.properties.title);
        
        // Ensure we have the required sheets
        const sheetNames = response.data.sheets.map(sheet => sheet.properties.title);
        
        if (!sheetNames.includes('Expenses')) {
            await createExpenseSheet();
        }
        
        if (!sheetNames.includes('Summary')) {
            await createSummarySheet();
        }
        
    } catch (error) {
        console.error('Error setting up spreadsheet:', error);
    }
}

async function createExpenseSheet() {
    if (!sheets) return;
    
    try {
        // Create Expenses sheet
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: 'Expenses',
                            gridProperties: {
                                rowCount: 1000,
                                columnCount: 10
                            }
                        }
                    }
                }]
            }
        });
        
        // Add headers
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A1:I1',
            valueInputOption: 'RAW',
            resource: {
                values: [['Timestamp', 'Date', 'User', 'Type', 'Description', 'Amount', 'Entry Type', 'Currency', 'Is Saving']]
            }
        });
        
        console.log('Expenses sheet created successfully');
    } catch (error) {
        console.error('Error creating Expenses sheet:', error);
    }
}

async function createSummarySheet() {
    if (!sheets) return;
    
    try {
        // Create Summary sheet for quick lookups
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: 'Summary',
                            gridProperties: {
                                rowCount: 100,
                                columnCount: 8
                            }
                        }
                    }
                }]
            }
        });
        
        console.log('Summary sheet created successfully');
    } catch (error) {
        console.error('Error creating Summary sheet:', error);
    }
}

// Add entry to Google Sheets
async function addEntry({ selection, type, description, amount, date, entryType, isSaving = false }) {
    const timestamp = new Date().toISOString(); // Always current timestamp
    const entry_date = date || new Date().toISOString().split('T')[0]; // Use provided date or current date
    const currency = 'INR';
    
    // Store locally first (we'll implement IndexedDB later)
    const entry = {
        timestamp,
        date: entry_date,
        user: selection,
        type,
        description,
        amount: Number(amount),
        entryType,
        isSaving,
        currency
    };
    
    // Try to add to Google Sheets (now with 9 columns including isSaving)
    try {
        if (sheets && SPREADSHEET_ID) {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Expenses!A:I',
                valueInputOption: 'RAW',
                resource: {
                    values: [[timestamp, entry_date, selection, type, description, Number(amount), entryType, currency, isSaving ? 'YES' : 'NO']]
                }
            });
            console.log('Entry added to Google Sheets successfully');
        }
    } catch (error) {
        console.error('Error adding to Google Sheets:', error);
        // TODO: Store in local queue for later sync
    }
    
    return entry;
}

// Get summary data from Google Sheets
async function getSummaryData(month, year, user) {
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return { success: false, message: 'Google Sheets not available' };
        }
        
        // Get all data from Expenses sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A2:I', // Skip header row, include savings column
        });
        
        const rows = response.data.values || [];
        if (!rows.length) {
            return { success: false, message: 'No data found' };
        }
        
        // Filter data for specific user/month/year
        const targetMonth = Number(month);
        const targetYear = Number(year);
        
        const filteredData = rows.filter(row => {
            if (!row[1] || !row[2]) return false; // Skip incomplete rows
            
            // Parse date from YYYY-MM-DD format
            const entryDate = new Date(row[1]);
            const entryMonth = entryDate.getMonth() + 1;
            const entryYear = entryDate.getFullYear();
            const entryUser = row[2];
            
            // Case-insensitive user comparison
            return entryUser.toLowerCase() === user.toLowerCase() && 
                   entryMonth === targetMonth && 
                   entryYear === targetYear;
        });
        
        if (!filteredData.length) {
            return { success: false, message: 'No data found for the selected period' };
        }
        
        let totalExpense = 0, totalIncome = 0, totalSavings = 0;
        const categoryTotals = {};
        const tableData = [];
        const ids = [];
        
        filteredData.forEach((row, index) => {
            const amount = Number(row[5]) || 0;
            const entryType = row[6];
            const type = row[3];
            const isSaving = row[8] === 'YES';
            
            if (entryType === 'expense') {
                totalExpense += Math.abs(amount);
                categoryTotals[type] = (categoryTotals[type] || 0) + Math.abs(amount);
            } else if (entryType === 'income') {
                totalIncome += Math.abs(amount);
            }
            
            if (isSaving) {
                totalSavings += Math.abs(amount);
            }
            
            tableData.push([
                row[1], // date
                row[3], // type
                row[4], // description
                Math.abs(amount), // amount
                row[6], // entry_type
                row[7] || 'INR', // currency
                isSaving ? 'YES' : 'NO' // is_saving
            ]);
            
            ids.push(index + 2); // Sheet row number (accounting for header)
        });
        
        const total = totalExpense + totalIncome;
        const expensePercentage = total ? (totalExpense / total) * 100 : 0;
        const incomePercentage = total ? (totalIncome / total) * 100 : 0;
        const topCategory = Object.entries(categoryTotals).reduce((max, cur) => cur[1] > max[1] ? cur : max, ['', 0]);
        
        return {
            data: tableData,
            ids,
            success: true,
            totalExpense,
            totalIncome,
            totalSavings,
            expensePercentage,
            incomePercentage,
            savingsRate: totalIncome > 0 ? (totalSavings / totalIncome * 100).toFixed(2) : 0,
            topCategory: topCategory[0] || 'None'
        };
        
    } catch (error) {
        console.error('Error getting summary data:', error);
        return { success: false, message: 'Error fetching data from Google Sheets' };
    }
}

app.get('/', (req, res) => {
    res.render('index');
});

// Download endpoint removed (no Excel file anymore)

app.post('/submit', async (req, res) => {
    const { selection, type, description, amount, date, entryType } = req.body;
    await addEntry({ selection, type, description, amount, date, entryType });
    res.json({ success: true });
});

app.post('/add-expense', async (req, res) => {
    const { selection, type, description, amount, date, isSaving } = req.body;
    await addEntry({ selection, type, description, amount, date, entryType: 'expense', isSaving });
    res.json({ success: true, message: 'Expense added successfully' });
});

app.post('/add-income', async (req, res) => {
    const { selection, type, description, amount, date, isSaving } = req.body;
    await addEntry({ selection, type, description, amount, date, entryType: 'income', isSaving });
    res.json({ success: true, message: 'Income added successfully' });
});

app.get('/summary', async (req, res) => {
    const { month, year, user } = req.query;
    if (!month || !year || !user) return res.status(400).send('Month, Year, and User required');
    const summary = await getSummaryData(month, year, user);
    if (!summary) return res.json({ success: false, message: 'No data found' });
    res.json(summary);
});

app.get('/yearly-summary', async (req, res) => {
    const { year, user } = req.query;
    if (!year || !user) return res.status(400).send('Year and User required');
    const summary = await getYearlySummary(year, user);
    res.json(summary);
});

app.get('/monthly-trends', async (req, res) => {
    const { year, user } = req.query;
    if (!year) return res.status(400).send('Year required');
    const trends = await getMonthlyTrends(year, user);
    res.json(trends);
});

app.get('/categories', async (req, res) => {
    try {
        const categories = await getAvailableCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ success: false, message: 'Failed to get categories' });
    }
});

app.get('/net-worth', async (req, res) => {
    const { user } = req.query;
    try {
        const netWorth = await calculateNetWorth(user);
        res.json(netWorth);
    } catch (error) {
        console.error('Error calculating net worth:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate net worth' });
    }
});

// Removed analyze-historical-data endpoint - no longer needed after one-time migration

app.post('/migrate-historical-data', async (req, res) => {
    try {
        const result = await migrateHistoricalDataOneTime();
        res.json(result);
    } catch (error) {
        console.error('Error migrating historical data:', error);
        res.status(500).json({ success: false, message: 'Failed to migrate historical data' });
    }
});

app.post('/bulk-add-historical', async (req, res) => {
    try {
        const { transactions } = req.body;
        if (!transactions || !Array.isArray(transactions)) {
            return res.status(400).json({ success: false, message: 'Invalid transaction data' });
        }

        let addedCount = 0;
        const migrationData = [];

        for (const transaction of transactions) {
            const { user, description, amount, month, category, note } = transaction;
            if (!user || !description || !amount || !month) continue;

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
            const monthIndex = monthNames.indexOf(month) + 1;
            if (monthIndex === 0) continue; // Invalid month

            const timestamp = new Date().toISOString();
            const entryDate = `2025-${String(monthIndex).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
            const cleanCategory = (category || description).replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() || 'Other';
            const fullDescription = description + (note ? ` - ${note}` : '');

            migrationData.push([
                timestamp,
                entryDate,
                user,
                cleanCategory,
                fullDescription,
                parseFloat(amount) || 0,
                'expense',
                'INR'
            ]);
            addedCount++;
        }

        // Batch insert all data to main spreadsheet
        if (migrationData.length > 0 && sheets && SPREADSHEET_ID) {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Expenses!A:H',
                valueInputOption: 'RAW',
                resource: {
                    values: migrationData
                }
            });
        }

        res.json({
            success: true,
            message: `Successfully migrated ${addedCount} historical transactions to main spreadsheet`,
            migratedCount: addedCount
        });
    } catch (error) {
        console.error('Error in bulk migration:', error);
        res.status(500).json({ success: false, message: 'Failed to migrate historical data' });
    }
});

app.get('/get-smart-insights', async (req, res) => {
    try {
        const insights = await getSmartInsights();
        res.json(insights);
    } catch (error) {
        console.error('Error getting smart insights:', error);
        res.status(500).json({ success: false, message: 'Failed to get insights' });
    }
});

// Financial Insights & Savings Optimization endpoint
app.get('/api/financial-insights', async (req, res) => {
    try {
        const { user } = req.query;
        
        if (!sheets || !SPREADSHEET_ID) {
            return res.status(500).json({ success: false, message: 'Google Sheets not available' });
        }
        
        // Get all transactions from the last 4 months
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A2:I', // All data with savings column
        });
        
        const rows = response.data.values || [];
        if (!rows.length) {
            return res.json({ 
                success: false, 
                message: 'No transaction data available for analysis' 
            });
        }
        
        // Transform rows into transaction objects
        const allTransactions = rows.map((row, index) => ({
            id: index + 2,
            timestamp: row[0],
            date: row[1],
            user: row[2],
            type: row[3], // This is the category
            category: row[3],
            description: row[4],
            amount: parseFloat(row[5]) || 0,
            entryType: row[6], // income or expense
            currency: row[7] || 'INR',
            isSaving: row[8] === 'YES'
        }));
        
        // Filter by user if specified
        const transactions = user 
            ? allTransactions.filter(t => t.user && t.user.toLowerCase() === user.toLowerCase())
            : allTransactions;
        
        // Filter for last 4 months only
        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
        
        const recentTransactions = transactions.filter(t => {
            const txnDate = new Date(t.date);
            return txnDate >= fourMonthsAgo;
        });
        
        // Generate comprehensive insights
        const insights = await generateFinancialInsights(recentTransactions, {
            currentDate: new Date(),
            userId: user
        });
        
        res.json(insights);
    } catch (error) {
        console.error('Error generating financial insights:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate financial insights',
            error: error.message 
        });
    }
});

app.get('/debug-sheets-access', async (req, res) => {
    try {
        if (!sheets || !auth) {
            return res.json({ success: false, message: 'Google Sheets API not initialized' });
        }

        // Get service account info
        const authClient = await auth.getAccessToken();
        const credentials = auth.jsonContent || {};
        
        res.json({
            success: true,
            serviceAccountEmail: credentials.client_email || 'Not available',
            hasAccessToken: !!authClient.token,
            mainSpreadsheetId: SPREADSHEET_ID,
            message: 'Using single main spreadsheet for all data after one-time migration'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.delete('/entry/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return res.status(500).json({ success: false, message: 'Google Sheets not available' });
        }
        
        // Delete row from Google Sheets
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // Assumes Expenses is the first sheet
                            dimension: 'ROWS',
                            startIndex: Number(id) - 1, // Convert to 0-based index
                            endIndex: Number(id)
                        }
                    }
                }]
            }
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ success: false, message: 'Failed to delete entry.' });
    }
});

// Enhanced Analytics Functions
async function getYearlySummary(year, user) {
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return { success: false, message: 'Google Sheets not available' };
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A2:I', // Include savings column
        });

        const rows = response.data.values || [];
        const targetYear = Number(year);

        const filteredData = rows.filter(row => {
            if (!row[1] || !row[2]) return false;
            const entryDate = new Date(row[1]);
            const entryYear = entryDate.getFullYear();
            const entryUser = row[2];
            
            const userMatch = user ? entryUser.toLowerCase() === user.toLowerCase() : true;
            return userMatch && entryYear === targetYear;
        });

        let totalExpense = 0, totalIncome = 0, totalSavings = 0;
        const monthlyBreakdown = {};
        const categoryTotals = {};

        filteredData.forEach(row => {
            const amount = Number(row[5]) || 0;
            const entryType = row[6];
            const category = row[3];
            const isSaving = row[8] === 'YES';
            const entryDate = new Date(row[1]);
            const monthKey = entryDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });

            if (!monthlyBreakdown[monthKey]) {
                monthlyBreakdown[monthKey] = { income: 0, expense: 0, savings: 0, net: 0 };
            }

            if (entryType === 'expense') {
                totalExpense += Math.abs(amount);
                monthlyBreakdown[monthKey].expense += Math.abs(amount);
                categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(amount);
            } else if (entryType === 'income') {
                totalIncome += Math.abs(amount);
                monthlyBreakdown[monthKey].income += Math.abs(amount);
            }

            if (isSaving) {
                totalSavings += Math.abs(amount);
                monthlyBreakdown[monthKey].savings += Math.abs(amount);
            }

            monthlyBreakdown[monthKey].net = monthlyBreakdown[monthKey].income - monthlyBreakdown[monthKey].expense;
        });

        return {
            success: true,
            year: targetYear,
            user: user || 'All Users',
            totalIncome,
            totalExpense,
            totalSavings,
            netIncome: totalIncome - totalExpense,
            savingsRate: totalIncome > 0 ? (totalSavings / totalIncome * 100).toFixed(2) : 0,
            monthlyBreakdown,
            topCategories: Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => ({ category, amount }))
        };
    } catch (error) {
        console.error('Error getting yearly summary:', error);
        return { success: false, message: error.message };
    }
}

async function getMonthlyTrends(year, user) {
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return { success: false, message: 'Google Sheets not available' };
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A2:I',
        });

        const rows = response.data.values || [];
        const targetYear = Number(year);
        const monthlyData = {};

        // Initialize all months
        for (let month = 1; month <= 12; month++) {
            const monthName = new Date(targetYear, month - 1, 1).toLocaleDateString('en-IN', { month: 'long' });
            monthlyData[monthName] = {
                ashi: { income: 0, expense: 0, savings: 0 },
                sanju: { income: 0, expense: 0, savings: 0 },
                total: { income: 0, expense: 0, savings: 0 }
            };
        }

        rows.forEach(row => {
            if (!row[1] || !row[2]) return;
            
            const entryDate = new Date(row[1]);
            const entryYear = entryDate.getFullYear();
            const entryUser = row[2].toLowerCase();
            const amount = Math.abs(Number(row[5]) || 0);
            const entryType = row[6];
            const isSaving = row[8] === 'YES';
            
            if (entryYear !== targetYear) return;
            
            const monthName = entryDate.toLocaleDateString('en-IN', { month: 'long' });
            
            if (monthlyData[monthName]) {
                if (entryType === 'income') {
                    monthlyData[monthName][entryUser].income += amount;
                    monthlyData[monthName].total.income += amount;
                } else {
                    monthlyData[monthName][entryUser].expense += amount;
                    monthlyData[monthName].total.expense += amount;
                }
                
                if (isSaving) {
                    monthlyData[monthName][entryUser].savings += amount;
                    monthlyData[monthName].total.savings += amount;
                }
            }
        });

        return {
            success: true,
            year: targetYear,
            monthlyData
        };
    } catch (error) {
        console.error('Error getting monthly trends:', error);
        return { success: false, message: error.message };
    }
}

async function getAvailableCategories() {
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return { success: false, message: 'Google Sheets not available' };
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A2:I',
        });

        const rows = response.data.values || [];
        const categories = new Set();

        rows.forEach(row => {
            if (row[3]) { // Category column
                categories.add(row[3]);
            }
        });

        // Add some default categories based on our migrated data
        const defaultCategories = [
            'Food', 'Transport', 'Healthcare', 'Home', 'Utilities', 'Education', 
            'Shopping', 'Investment', 'Insurance', 'Travel', 'Entertainment', 'Other'
        ];

        defaultCategories.forEach(cat => categories.add(cat));

        return {
            success: true,
            categories: Array.from(categories).sort()
        };
    } catch (error) {
        console.error('Error getting categories:', error);
        return { success: false, message: error.message };
    }
}

async function calculateNetWorth(user) {
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return { success: false, message: 'Google Sheets not available' };
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A2:I',
        });

        const rows = response.data.values || [];
        
        const filteredData = rows.filter(row => {
            if (!row[1] || !row[2]) return false;
            const entryUser = row[2];
            return user ? entryUser.toLowerCase() === user.toLowerCase() : true;
        });

        let totalSavings = 0;
        let totalInvestments = 0;
        let totalIncome = 0;
        let totalExpenses = 0;
        const savingsBreakdown = {};
        const monthlyNetWorth = {};

        filteredData.forEach(row => {
            const amount = Math.abs(Number(row[5]) || 0);
            const entryType = row[6];
            const category = row[3];
            const isSaving = row[8] === 'YES';
            const entryDate = new Date(row[1]);
            const monthKey = entryDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });

            if (!monthlyNetWorth[monthKey]) {
                monthlyNetWorth[monthKey] = { savings: 0, investments: 0 };
            }

            if (entryType === 'income') {
                totalIncome += amount;
            } else {
                totalExpenses += amount;
            }

            if (isSaving) {
                totalSavings += amount;
                monthlyNetWorth[monthKey].savings += amount;
                savingsBreakdown[category] = (savingsBreakdown[category] || 0) + amount;
            }

            if (category === 'Investment') {
                totalInvestments += amount;
                monthlyNetWorth[monthKey].investments += amount;
            }
        });

        const netWorth = totalSavings + totalInvestments;
        const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome * 100).toFixed(2) : 0;

        return {
            success: true,
            user: user || 'All Users',
            netWorth,
            totalSavings,
            totalInvestments,
            totalIncome,
            totalExpenses,
            savingsRate,
            savingsBreakdown,
            monthlyNetWorth
        };
    } catch (error) {
        console.error('Error calculating net worth:', error);
        return { success: false, message: error.message };
    }
}

async function getSmartInsights() {
    try {
        // Get current month data
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Get data for both users
        const ashiData = await getSummaryData(currentMonth, currentYear, 'Ashi');
        const sanjuData = await getSummaryData(currentMonth, currentYear, 'Sanju');
        
        // Analyze patterns and predict
        const insights = {
            userSplit: {
                ashi: { income: 0, expense: 0 },
                sanju: { income: 0, expense: 0 }
            },
            recurringTransactions: [],
            predictions: {},
            recommendations: []
        };
        
        // Calculate user splits
        if (ashiData.success !== false) {
            ashiData.data?.forEach(row => {
                const amount = Math.abs(parseFloat(row[3]) || 0);
                if (row[4] === 'income') {
                    insights.userSplit.ashi.income += amount;
                } else {
                    insights.userSplit.ashi.expense += amount;
                }
            });
        }
        
        if (sanjuData.success !== false) {
            sanjuData.data?.forEach(row => {
                const amount = Math.abs(parseFloat(row[3]) || 0);
                if (row[4] === 'income') {
                    insights.userSplit.sanju.income += amount;
                } else {
                    insights.userSplit.sanju.expense += amount;
                }
            });
        }
        
        return { success: true, insights };
    } catch (error) {
        console.error('Error in getSmartInsights:', error);
        return { success: false, message: error.message };
    }
}

// Delete transaction endpoint
app.delete('/delete-transaction/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;
        console.log(`Attempting to delete transaction with ID: ${transactionId}`);
        
        // For simplicity, we'll mark the transaction as deleted by updating it
        // In a real implementation, you might want to move it to a "deleted" sheet or mark it as deleted
        const result = await deleteTransaction(transactionId);
        
        if (result.success) {
            res.json({ success: true, message: 'Transaction deleted successfully' });
        } else {
            res.status(400).json({ success: false, message: result.message || 'Failed to delete transaction' });
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update transaction endpoint
app.put('/update-transaction/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;
        const updatedData = req.body;
        console.log(`Attempting to update transaction with ID: ${transactionId}`, updatedData);
        
        const result = await updateTransaction(transactionId, updatedData);
        
        if (result.success) {
            res.json({ success: true, message: 'Transaction updated successfully' });
        } else {
            res.status(400).json({ success: false, message: result.message || 'Failed to update transaction' });
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

async function deleteTransaction(transactionId) {
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return { success: false, message: 'Google Sheets not available' };
        }
        
        // Transaction ID is the row number in the Expenses sheet (1-based, accounting for header)
        const rowNumber = parseInt(transactionId);
        
        if (isNaN(rowNumber) || rowNumber < 2) {
            return { success: false, message: 'Invalid transaction ID' };
        }
        
        // Clear the row content in the Expenses sheet
        const range = `Expenses!A${rowNumber}:I${rowNumber}`;
        
        console.log(`Deleting transaction from ${range}`);
        
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });
        
        console.log(`Successfully deleted transaction from row ${rowNumber}`);
        return { success: true };
    } catch (error) {
        console.error('Error in deleteTransaction:', error);
        return { success: false, message: error.message };
    }
}

async function updateTransaction(transactionId, updatedData) {
    try {
        if (!sheets || !SPREADSHEET_ID) {
            return { success: false, message: 'Google Sheets not available' };
        }
        
        // Transaction ID is the row number in the Expenses sheet (1-based, accounting for header)
        const rowNumber = parseInt(transactionId);
        
        if (isNaN(rowNumber) || rowNumber < 2) {
            return { success: false, message: 'Invalid transaction ID' };
        }
        
        // Prepare the updated row data matching the Expenses sheet structure:
        // Timestamp, Date, User, Type, Description, Amount, Entry Type, Currency, Is Saving
        const rowData = [
            new Date().toISOString(), // Timestamp - update to current
            updatedData.date || '',
            updatedData.user || '',
            updatedData.category || updatedData.type || '', // Type/Category
            updatedData.description || '',
            parseFloat(updatedData.amount) || 0,
            updatedData.entryType || 'expense',
            updatedData.currency || 'INR',
            updatedData.isSaving ? 'YES' : 'NO'
        ];
        
        const range = `Expenses!A${rowNumber}:I${rowNumber}`;
        
        console.log(`Updating transaction at ${range}`, rowData);
        
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: [rowData]
            }
        });
        
        console.log(`Successfully updated transaction in row ${rowNumber}`);
        return { success: true };
    } catch (error) {
        console.error('Error in updateTransaction:', error);
        return { success: false, message: error.message };
    }
}

// Initialize Google Sheets on startup
initializeGoogleSheets().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Family Expense Tracker running on http://localhost:${port}`);
        console.log(`📊 Main Google Sheets ID: ${SPREADSHEET_ID}`);
        console.log(`✅ Ready for one-time historical data migration!`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    app.listen(port, () => {
        console.log(`🚀 Family Expense Tracker running on http://localhost:${port} (offline mode)`);
    });
});
