const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = 3002;

// Use environment variable for connection string
const isProduction = process.env.NODE_ENV === 'production';
const connectionString = isProduction
    ? process.env.PG_INTERNAL_URL // Set this in your Render.com environment
    : process.env.PG_EXTERNAL_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure table exists
async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS entries (
            id SERIAL PRIMARY KEY,
            user_code VARCHAR(2) NOT NULL,
            entry_date DATE NOT NULL,
            type VARCHAR(50) NOT NULL,
            description TEXT,
            amount NUMERIC NOT NULL,
            entry_type VARCHAR(10) NOT NULL,
            currency VARCHAR(5) DEFAULT 'INR'
        );
    `);
}
ensureTable();

// Add entry (expense or income)
async function addEntry({ selection, type, description, amount, entryType }) {
    const entry_date = new Date();
    await pool.query(
        `INSERT INTO entries (user_code, entry_date, type, description, amount, entry_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [selection, entry_date, type, description, Number(amount), entryType]
    );
}

// Get summary for a user/month/year
async function getSummaryData(month, year, user) {
    // Get all entries for user/month/year
    const res = await pool.query(
        `SELECT * FROM entries
         WHERE user_code = $1
           AND EXTRACT(MONTH FROM entry_date) = $2
           AND EXTRACT(YEAR FROM entry_date) = $3
         ORDER BY entry_date ASC`,
        [user, new Date(`${month} 1, ${year}`).getMonth() + 1, Number('20' + year)]
    );
    const data = res.rows;

    if (!data.length) return null;

    let totalExpense = 0, totalIncome = 0;
    const categoryTotals = {};
    const tableData = [];
    const ids = [];

    data.forEach(row => {
        const amount = Number(row.amount);
        if (row.entry_type === 'expense') {
            totalExpense += amount;
            categoryTotals[row.type] = (categoryTotals[row.type] || 0) + Math.abs(amount);
        } else if (row.entry_type === 'income') {
            totalIncome += amount;
        }
        tableData.push([
            row.entry_date.toISOString().slice(0, 10),
            row.type,
            row.description,
            amount,
            row.entry_type,
            row.currency || 'INR'
        ]);
        ids.push(row.id);
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
        topCategory: topCategory[0]
    };
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
        await pool.query('DELETE FROM entries WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete entry.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
