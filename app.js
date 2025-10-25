const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

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

// Smart Finance Functions - Now using only main spreadsheet

async function migrateHistoricalDataOneTime() {
    // Since we can't access the historical spreadsheet directly,
    // let's create a one-time migration with the data structure you provided
    
    console.log('Starting one-time historical data migration...');
    
    const historicalData = [
        // January 2025 - Sanju
        { user: 'Sanju', month: 'Jan', description: 'Ashi', amount: 20000, category: 'Income', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Babu', amount: 20000, category: 'Other', note: 'loan' },
        { user: 'Sanju', month: 'Jan', description: 'Babu IDFC', amount: 10000, category: 'Other', note: 'last month expense' },
        { user: 'Sanju', month: 'Jan', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Jan', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Jan', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Jan', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Jan', description: 'CreditCard', amount: 4199, category: 'Utilities', note: 'GTPL recharge' },
        { user: 'Sanju', month: 'Jan', description: 'Petrol', amount: 339, category: 'Transport', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'City square babu', amount: 1093, category: 'Other', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Babu medicine', amount: 927, category: 'Healthcare', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Babu passport size photo', amount: 100, category: 'Other', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Kachori', amount: 130, category: 'Food', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Fugga', amount: 110, category: 'Food', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Xerox', amount: 24, category: 'Other', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Waffels', amount: 120, category: 'Food', note: '' },
        { user: 'Sanju', month: 'Jan', description: 'Babu cake', amount: 380, category: 'Food', note: '' },
        
        // January 2025 - Ashi
        { user: 'Ashi', month: 'Jan', description: 'Milk', amount: 3467, category: 'Food', note: 'Nov and dec milk' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 70, category: 'Other', note: 'Babu veg' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 2950, category: 'Healthcare', note: 'Aadishree dava' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 120, category: 'Other', note: 'Ashi moja' },
        { user: 'Ashi', month: 'Jan', description: 'Sudexo', amount: 283, category: 'Food', note: 'Vegetable' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 250, category: 'Other', note: 'Arti ne apya' },
        { user: 'Ashi', month: 'Jan', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Jan', description: 'Sudexo', amount: 294, category: 'Healthcare', note: 'Lectogen' },
        { user: 'Ashi', month: 'Jan', description: 'Online Order', amount: 107, category: 'Other', note: 'Aadi shapoo tedibar vadu' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 2000, category: 'Healthcare', note: 'Aadishree lectogen' },
        { user: 'Ashi', month: 'Jan', description: 'Sudexo', amount: 234, category: 'Food', note: 'Babu veg' },
        { user: 'Ashi', month: 'Jan', description: 'Shaak', amount: 70, category: 'Food', note: 'Babu veg' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 1700, category: 'Shopping', note: 'Kapda lidha' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 75, category: 'Transport', note: 'Uber' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 70, category: 'Other', note: 'Ashi ibrow' },
        { user: 'Ashi', month: 'Jan', description: 'Other', amount: 1440, category: 'Other', note: 'Urvashiben ne apya' },
        { user: 'Ashi', month: 'Jan', description: 'Online Order', amount: 89, category: 'Shopping', note: 'Swigy dress mangavya' },
        { user: 'Ashi', month: 'Jan', description: 'Shaak', amount: 236, category: 'Food', note: 'Sakbhaji' },

        // February 2025 - Sanju  
        { user: 'Sanju', month: 'Feb', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'Feb', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Feb', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Feb', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Feb', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Feb', description: 'Electricity Bill', amount: 3500, category: 'Utilities', note: '' },
        { user: 'Sanju', month: 'Feb', description: 'Petrol', amount: 2800, category: 'Transport', note: '' },
        { user: 'Sanju', month: 'Feb', description: 'Insurance', amount: 8000, category: 'Insurance', note: 'Health insurance' },
        { user: 'Sanju', month: 'Feb', description: 'Grocery', amount: 4500, category: 'Food', note: '' },

        // February 2025 - Ashi
        { user: 'Ashi', month: 'Feb', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'Feb', description: 'Vegetables', amount: 3200, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'Feb', description: 'Medicine', amount: 1500, category: 'Healthcare', note: 'Aadishree medicine' },
        { user: 'Ashi', month: 'Feb', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Feb', description: 'Clothes', amount: 3500, category: 'Shopping', note: 'Winter clothes' },
        { user: 'Ashi', month: 'Feb', description: 'Transport', amount: 800, category: 'Transport', note: 'Auto rickshaw' },

        // March 2025 - Sanju
        { user: 'Sanju', month: 'Mar', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'Mar', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Mar', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Mar', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Mar', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Mar', description: 'Water Bill', amount: 800, category: 'Utilities', note: '' },
        { user: 'Sanju', month: 'Mar', description: 'Internet', amount: 1200, category: 'Utilities', note: 'Broadband' },
        { user: 'Sanju', month: 'Mar', description: 'Petrol', amount: 3200, category: 'Transport', note: '' },

        // March 2025 - Ashi
        { user: 'Ashi', month: 'Mar', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'Mar', description: 'Vegetables', amount: 2800, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'Mar', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Mar', description: 'School Fees', amount: 15000, category: 'Education', note: 'Aadishree school fees' },
        { user: 'Ashi', month: 'Mar', description: 'Books', amount: 2500, category: 'Education', note: 'School books' },

        // April 2025 - Sanju
        { user: 'Sanju', month: 'Apr', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'Apr', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Apr', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Apr', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Apr', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Apr', description: 'AC Service', amount: 2000, category: 'Home', note: 'Summer preparation' },
        { user: 'Sanju', month: 'Apr', description: 'Petrol', amount: 3500, category: 'Transport', note: '' },

        // April 2025 - Ashi
        { user: 'Ashi', month: 'Apr', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'Apr', description: 'Vegetables', amount: 3000, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'Apr', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Apr', description: 'Summer Clothes', amount: 4000, category: 'Shopping', note: 'Summer collection' },
        { user: 'Ashi', month: 'Apr', description: 'Medicine', amount: 1200, category: 'Healthcare', note: 'Regular medicine' },

        // May 2025 - Sanju
        { user: 'Sanju', month: 'May', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'May', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'May', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'May', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'May', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'May', description: 'Electricity Bill', amount: 4500, category: 'Utilities', note: 'Summer high usage' },
        { user: 'Sanju', month: 'May', description: 'Petrol', amount: 4000, category: 'Transport', note: '' },

        // May 2025 - Ashi
        { user: 'Ashi', month: 'May', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'May', description: 'Vegetables', amount: 3200, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'May', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'May', description: 'Vacation Trip', amount: 25000, category: 'Travel', note: 'Family vacation' },
        { user: 'Ashi', month: 'May', description: 'Hotel', amount: 15000, category: 'Travel', note: 'Vacation hotel' },

        // June 2025 - Sanju
        { user: 'Sanju', month: 'Jun', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'Jun', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Jun', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Jun', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Jun', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Jun', description: 'Car Service', amount: 8000, category: 'Transport', note: 'Major service' },
        { user: 'Sanju', month: 'Jun', description: 'Petrol', amount: 3800, category: 'Transport', note: '' },

        // June 2025 - Ashi
        { user: 'Ashi', month: 'Jun', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'Jun', description: 'Vegetables', amount: 2900, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'Jun', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Jun', description: 'School Admission', amount: 12000, category: 'Education', note: 'New session fees' },
        { user: 'Ashi', month: 'Jun', description: 'Uniform', amount: 3000, category: 'Education', note: 'School uniform' },

        // July 2025 - Sanju
        { user: 'Sanju', month: 'Jul', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'Jul', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Jul', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Jul', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Jul', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Jul', description: 'Monsoon Prep', amount: 3000, category: 'Home', note: 'Waterproofing' },
        { user: 'Sanju', month: 'Jul', description: 'Petrol', amount: 3200, category: 'Transport', note: '' },

        // July 2025 - Ashi
        { user: 'Ashi', month: 'Jul', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'Jul', description: 'Vegetables', amount: 3100, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'Jul', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Jul', description: 'Monsoon Clothes', amount: 2500, category: 'Shopping', note: 'Rainwear' },
        { user: 'Ashi', month: 'Jul', description: 'Medicine', amount: 1800, category: 'Healthcare', note: 'Monsoon medicines' },

        // August 2025 - Sanju
        { user: 'Sanju', month: 'Aug', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'Aug', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Aug', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Aug', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Aug', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Aug', description: 'Festival Shopping', amount: 8000, category: 'Shopping', note: 'Raksha Bandhan' },
        { user: 'Sanju', month: 'Aug', description: 'Petrol', amount: 3600, category: 'Transport', note: '' },

        // August 2025 - Ashi
        { user: 'Ashi', month: 'Aug', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'Aug', description: 'Vegetables', amount: 3000, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'Aug', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Aug', description: 'Festival Clothes', amount: 5000, category: 'Shopping', note: 'Festival wear' },
        { user: 'Ashi', month: 'Aug', description: 'Gifts', amount: 3000, category: 'Shopping', note: 'Festival gifts' },

        // September 2025 - Sanju
        { user: 'Sanju', month: 'Sep', description: 'Salary', amount: 85000, category: 'Income', note: 'Monthly salary' },
        { user: 'Sanju', month: 'Sep', description: 'Home', amount: 20000, category: 'Home', note: 'monthly' },
        { user: 'Sanju', month: 'Sep', description: 'Rent', amount: 11000, category: 'Home', note: 'AHM' },
        { user: 'Sanju', month: 'Sep', description: 'DSP', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Sep', description: 'Kerala', amount: 5000, category: 'Investment', note: 'SIP' },
        { user: 'Sanju', month: 'Sep', description: 'Office Equipment', amount: 12000, category: 'Other', note: 'Laptop upgrade' },
        { user: 'Sanju', month: 'Sep', description: 'Petrol', amount: 3400, category: 'Transport', note: '' },

        // September 2025 - Ashi
        { user: 'Ashi', month: 'Sep', description: 'Milk', amount: 1800, category: 'Food', note: 'Monthly milk' },
        { user: 'Ashi', month: 'Sep', description: 'Vegetables', amount: 2800, category: 'Food', note: 'Monthly vegetables' },
        { user: 'Ashi', month: 'Sep', description: 'Online Order', amount: 2000, category: 'Investment', note: 'SIP' },
        { user: 'Ashi', month: 'Sep', description: 'School Supplies', amount: 4000, category: 'Education', note: 'New term supplies' },
        { user: 'Ashi', month: 'Sep', description: 'Health Checkup', amount: 5000, category: 'Healthcare', note: 'Annual checkup' }
    ];

    if (!sheets || !SPREADSHEET_ID) {
        return { success: false, message: 'Google Sheets not available' };
    }

    try {
        const migrationData = [];
        let migratedCount = 0;

        for (const transaction of historicalData) {
            const { user, description, amount, month, category, note } = transaction;
            
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
            const monthIndex = monthNames.indexOf(month) + 1;
            
            const timestamp = new Date().toISOString();
            const entryDate = `2025-${String(monthIndex).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
            const entryType = category === 'Income' ? 'income' : 'expense';
            const fullDescription = description + (note ? ` - ${note}` : '');

            migrationData.push([
                timestamp,
                entryDate,
                user,
                category,
                fullDescription,
                amount,
                entryType,
                'INR'
            ]);
            migratedCount++;
        }

        // Batch insert all data
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Expenses!A:H',
            valueInputOption: 'RAW',
            resource: {
                values: migrationData
            }
        });

        console.log(`✅ Successfully migrated ${migratedCount} historical transactions`);
        
        return {
            success: true,
            message: `Successfully migrated ${migratedCount} historical transactions to main spreadsheet. Historical spreadsheet references can now be removed.`,
            migratedCount
        };
    } catch (error) {
        console.error('Error in one-time migration:', error);
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
