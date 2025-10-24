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
async function addEntry({ selection, type, description, amount, entryType }) {
    const timestamp = new Date().toISOString();
    const entry_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
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
        const targetMonth = new Date(`${month} 1, ${year}`).getMonth() + 1;
        const targetYear = Number('20' + year);
        
        const filteredData = rows.filter(row => {
            if (!row[1] || !row[2]) return false; // Skip incomplete rows
            
            const entryDate = new Date(row[1]);
            const entryMonth = entryDate.getMonth() + 1;
            const entryYear = entryDate.getFullYear();
            const entryUser = row[2];
            
            return entryUser === user && entryMonth === targetMonth && entryYear === targetYear;
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
    const { selection, type, description, amount, entryType } = req.body;
    await addEntry({ selection, type, description, amount, entryType });
    res.json({ success: true });
});

app.post('/add-expense', async (req, res) => {
    const { selection, type, description, amount } = req.body;
    await addEntry({ selection, type, description, amount, entryType: 'expense' });
    res.json({ success: true, message: 'Expense added successfully' });
});

app.post('/add-income', async (req, res) => {
    const { selection, type, description, amount } = req.body;
    await addEntry({ selection, type, description, amount, entryType: 'income' });
    res.json({ success: true, message: 'Income added successfully' });
});

app.get('/summary', async (req, res) => {
    const { month, year, user } = req.query;
    if (!month || !year || !user) return res.status(400).send('Month, Year, and User required');
    const summary = await getSummaryData(month, year, user);
    if (!summary) return res.json({ success: false, message: 'No data found' });
    res.json(summary);
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

// Initialize Google Sheets on startup
initializeGoogleSheets().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Family Expense Tracker running on http://localhost:${port}`);
        console.log(`📊 Google Sheets ID: ${SPREADSHEET_ID}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    app.listen(port, () => {
        console.log(`🚀 Family Expense Tracker running on http://localhost:${port} (offline mode)`);
    });
});
