const express = require('express');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3001;
const excelPath = path.join(__dirname, 'data.xlsx');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function getMonthSheetName(month, year) {
    return `${month}-${year}`;
}

function adjustColumnWidths(worksheet) {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const colWidths = jsonData[0].map((_, colIndex) => {
        return {
            wch: Math.max(
                ...jsonData.map(row => (row[colIndex] ? row[colIndex].toString().length : 0))
            )
        };
    });
    worksheet['!cols'] = colWidths;
}

function appendToExcel(selection, type, description, amount, entryType) {
    const date = new Date();
    const sheetName = date.toLocaleString('default', { month: 'short' }) + '-' + date.getFullYear().toString().slice(-2) + selection;
    const workbook = XLSX.readFile(excelPath);
    let worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        worksheet = XLSX.utils.aoa_to_sheet([]);
        workbook.SheetNames.push(sheetName);
        workbook.Sheets[sheetName] = worksheet;
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const numericAmount = entryType === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
    const row = [date.toLocaleDateString(), type, description, numericAmount, entryType, 'INR'];

    jsonData.push(row);
    const newSheet = XLSX.utils.aoa_to_sheet(jsonData);
    adjustColumnWidths(newSheet); // Adjust column widths
    workbook.Sheets[sheetName] = newSheet;
    XLSX.writeFile(workbook, excelPath);
}

function getSummaryData(sheetName, user) {
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[sheetName + user];
    if (!worksheet) return null;

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    let totalExpense = 0;
    let totalIncome = 0;
    const categoryTotals = {};

    data.forEach(row => {
        let amount, entryType, category;

        // if (user === 'A') {
        amount = row[3];
        entryType = row[4];
        category = row[1];
        // } else if (user === 'S') {
        //   amount = row[9];
        //  entryType = row[10];
        // category = row[7];
        // }

        if (entryType === 'expense') {
            totalExpense += amount;
            categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(amount);
        } else if (entryType === 'income') {
            totalIncome += amount;
        }
    });

    const total = totalExpense + totalIncome;
    const expensePercentage = total ? (totalExpense / total) * 100 : 0;
    const incomePercentage = total ? (totalIncome / total) * 100 : 0;
    const topCategory = Object.entries(categoryTotals).reduce((max, cur) => cur[1] > max[1] ? cur : max, ['', 0]);

    return {
        data,
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

app.get('/download', (req, res) => {
    res.download(excelPath, 'data.xlsx', (err) => {
        if (err) {
            console.error('Error downloading the file:', err);
            res.status(500).send('Error downloading the file');
        }
    });
});

app.post('/submit', (req, res) => {
    const { selection, type, description, amount, entryType } = req.body;
    appendToExcel(selection, type, description, amount, entryType);
    res.json({ success: true });
});

app.post('/add-expense', (req, res) => {
    const { selection, type, description, amount } = req.body;
    appendToExcel(selection, type, description, amount, 'expense');
    res.json({ success: true, message: 'Expense added successfully' });
});

app.post('/add-income', (req, res) => {
    const { selection, type, description, amount } = req.body;
    appendToExcel(selection, type, description, amount, 'income');
    res.json({ success: true, message: 'Income added successfully' });
});

app.get('/summary', (req, res) => {
    const { month, year, user } = req.query;
    if (!month || !year) return res.status(400).send('Month and Year required');
    const summary = getSummaryData(getMonthSheetName(month, year), user);
    if (!summary) return res.status(404).send('No data found');
    res.json(summary);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
