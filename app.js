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
const HISTORICAL_SPREADSHEET_ID = '1E4enkZWyGokrdx3HCTha-pr_VricyQC6'; // Historical data sheet

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
            range: 'Expenses!A1:H1',
            valueInputOption: 'RAW',
            resource: {
                values: [['Timestamp', 'Date', 'User', 'Type', 'Description', 'Amount', 'Entry Type', 'Currency']]
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
async function addEntry({ selection, type, description, amount, date, entryType }) {
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
        currency
    };
    
    // Try to add to Google Sheets
    try {
        if (sheets && SPREADSHEET_ID) {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Expenses!A:H',
                valueInputOption: 'RAW',
                resource: {
                    values: [[timestamp, entry_date, selection, type, description, Number(amount), entryType, currency]]
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
            range: 'Expenses!A2:H', // Skip header row
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
        
        let totalExpense = 0, totalIncome = 0;
        const categoryTotals = {};
        const tableData = [];
        const ids = [];
        
        filteredData.forEach((row, index) => {
            const amount = Number(row[5]) || 0;
            const entryType = row[6];
            const type = row[3];
            
            if (entryType === 'expense') {
                totalExpense += Math.abs(amount);
                categoryTotals[type] = (categoryTotals[type] || 0) + Math.abs(amount);
            } else if (entryType === 'income') {
                totalIncome += Math.abs(amount);
            }
            
            tableData.push([
                row[1], // date
                row[3], // type
                row[4], // description
                Math.abs(amount), // amount
                row[6], // entry_type
                row[7] || 'INR' // currency
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
            expensePercentage,
            incomePercentage,
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
    const { selection, type, description, amount, date } = req.body;
    await addEntry({ selection, type, description, amount, date, entryType: 'expense' });
    res.json({ success: true, message: 'Expense added successfully' });
});

app.post('/add-income', async (req, res) => {
    const { selection, type, description, amount, date } = req.body;
    await addEntry({ selection, type, description, amount, date, entryType: 'income' });
    res.json({ success: true, message: 'Income added successfully' });
});

app.get('/summary', async (req, res) => {
    const { month, year, user } = req.query;
    if (!month || !year || !user) return res.status(400).send('Month, Year, and User required');
    const summary = await getSummaryData(month, year, user);
    if (!summary) return res.json({ success: false, message: 'No data found' });
    res.json(summary);
});

app.get('/analyze-historical-data', async (req, res) => {
    try {
        const analysis = await analyzeHistoricalData();
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing historical data:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze historical data' });
    }
});

app.post('/migrate-historical-data', async (req, res) => {
    try {
        const result = await migrateHistoricalData();
        res.json(result);
    } catch (error) {
        console.error('Error migrating historical data:', error);
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

// Smart Finance Functions
async function analyzeHistoricalData() {
    try {
        if (!sheets) {
            return { success: false, message: 'Google Sheets not available' };
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
        let allTransactions = [];
        let categories = new Set();
        let userTotals = { Ashi: { income: 0, expense: 0 }, Sanju: { income: 0, expense: 0 } };
        let monthlyTrends = {};

        for (const month of months) {
            try {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: HISTORICAL_SPREADSHEET_ID,
                    range: `${month}!A2:Z`, // Get all data from each month tab
                });

                const rows = response.data.values || [];
                console.log(`Found ${rows.length} rows in ${month}`);
                
                rows.forEach((row, index) => {
                    if (row.length >= 4 && row[0] && row[1] && row[2] && row[3]) { // Basic validation
                        const transaction = {
                            month: month,
                            date: row[0],
                            description: row[1],
                            category: row[2] || 'Other',
                            amount: parseFloat(row[3]) || 0,
                            user: row[4] || 'Unknown',
                            type: parseFloat(row[3]) > 0 ? 'income' : 'expense'
                        };
                        
                        allTransactions.push(transaction);
                        categories.add(transaction.category);
                        
                        // Calculate user totals
                        const user = transaction.user === 'A' ? 'Ashi' : transaction.user === 'S' ? 'Sanju' : transaction.user;
                        if (userTotals[user]) {
                            if (transaction.type === 'income') {
                                userTotals[user].income += Math.abs(transaction.amount);
                            } else {
                                userTotals[user].expense += Math.abs(transaction.amount);
                            }
                        }
                        
                        // Monthly trends
                        if (!monthlyTrends[month]) {
                            monthlyTrends[month] = { income: 0, expense: 0, count: 0 };
                        }
                        monthlyTrends[month].count++;
                        if (transaction.type === 'income') {
                            monthlyTrends[month].income += Math.abs(transaction.amount);
                        } else {
                            monthlyTrends[month].expense += Math.abs(transaction.amount);
                        }
                    }
                });
            } catch (monthError) {
                console.log(`No data found for ${month} or error:`, monthError.message);
            }
        }

        return {
            success: true,
            totalTransactions: allTransactions.length,
            categories: Array.from(categories).sort(),
            userTotals,
            monthlyTrends,
            sampleTransactions: allTransactions.slice(0, 10) // First 10 for preview
        };
    } catch (error) {
        console.error('Error in analyzeHistoricalData:', error);
        return { success: false, message: error.message };
    }
}

async function migrateHistoricalData() {
    try {
        if (!sheets) {
            return { success: false, message: 'Google Sheets not available' };
        }

        const analysis = await analyzeHistoricalData();
        if (!analysis.success) {
            return analysis;
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
        let migratedCount = 0;
        const migrationData = [];

        for (const month of months) {
            try {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: HISTORICAL_SPREADSHEET_ID,
                    range: `${month}!A2:Z`,
                });

                const rows = response.data.values || [];
                const monthIndex = months.indexOf(month) + 1; // 1-12

                rows.forEach((row, index) => {
                    if (row.length >= 4 && row[0] && row[1] && row[2] && row[3]) {
                        const timestamp = new Date().toISOString();
                        const entryDate = `2025-${String(monthIndex).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
                        const user = row[4] === 'A' ? 'Ashi' : row[4] === 'S' ? 'Sanju' : (row[4] || 'Sanju');
                        const category = row[2] || 'Other';
                        const description = row[1] || 'Migrated transaction';
                        const amount = Math.abs(parseFloat(row[3]) || 0);
                        const entryType = parseFloat(row[3]) > 0 ? 'income' : 'expense';
                        
                        migrationData.push([
                            timestamp,
                            entryDate,
                            user,
                            category,
                            description,
                            amount,
                            entryType,
                            'INR'
                        ]);
                        migratedCount++;
                    }
                });
            } catch (monthError) {
                console.log(`Error processing ${month}:`, monthError.message);
            }
        }

        // Batch insert all data
        if (migrationData.length > 0) {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Expenses!A:H',
                valueInputOption: 'RAW',
                resource: {
                    values: migrationData
                }
            });
        }

        return {
            success: true,
            message: `Successfully migrated ${migratedCount} transactions`,
            migratedCount
        };
    } catch (error) {
        console.error('Error in migrateHistoricalData:', error);
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
        console.log(`📊 Google Sheets ID: ${SPREADSHEET_ID}`);
        console.log(`📋 Historical Sheets ID: ${HISTORICAL_SPREADSHEET_ID}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    app.listen(port, () => {
        console.log(`🚀 Family Expense Tracker running on http://localhost:${port} (offline mode)`);
    });
});
