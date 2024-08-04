const express = require('express');
const bodyParser = require('body-parser');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Render the form page
app.get('/', (req, res) => {
    res.render('index');
});

// Handle form submission
app.post('/calculate', (req, res) => {
    const {
        grossSalary, rent, food, licPremium, sip, ssy, nps, carEmi, bankDeposit,
        parentsExpenses, commute, doctorVisits, supplementsAndClothes, unexpectedExpenses
    } = req.body;

    const defaultValues = {
        rent: 14000, food: 3000, licPremium: 1333, sip: 5000, ssy: 7500,
        nps: 4167, carEmi: 12000, bankDeposit: 5000, parentsExpenses: 20000,
        commute: 345, doctorVisits: 1500, supplementsAndClothes: 3000
    };

    const parseFloatOrDefault = (value, defaultValue) => parseFloat(value) || defaultValue;

    const calculateTax = (grossSalary) => {
        let taxableIncome = grossSalary - 260000; // Assuming 80C and other deductions
        if (taxableIncome <= 250000) return 0;
        let tax = 0;
        if (taxableIncome <= 500000) {
            tax = (taxableIncome - 250000) * 0.05;
        } else if (taxableIncome <= 1000000) {
            tax = 250000 * 0.05 + (taxableIncome - 500000) * 0.2;
        } else {
            tax = 250000 * 0.05 + 500000 * 0.2 + (taxableIncome - 1000000) * 0.3;
        }
        return tax + (tax * 0.04); // Adding 4% health and education cess
    };

    const rentValue = parseFloatOrDefault(rent, defaultValues.rent);
    const foodValue = parseFloatOrDefault(food, defaultValues.food);
    const licPremiumValue = parseFloatOrDefault(licPremium, defaultValues.licPremium);
    const sipValue = parseFloatOrDefault(sip, defaultValues.sip);
    const ssyValue = parseFloatOrDefault(ssy, defaultValues.ssy);
    const npsValue = parseFloatOrDefault(nps, defaultValues.nps);
    const carEmiValue = parseFloatOrDefault(carEmi, defaultValues.carEmi);
    const bankDepositValue = parseFloatOrDefault(bankDeposit, defaultValues.bankDeposit);
    const parentsExpensesValue = parseFloatOrDefault(parentsExpenses, defaultValues.parentsExpenses);
    const commuteValue = parseFloatOrDefault(commute, defaultValues.commute);
    const doctorVisitsValue = parseFloatOrDefault(doctorVisits, defaultValues.doctorVisits);
    const supplementsAndClothesValue = parseFloatOrDefault(supplementsAndClothes, defaultValues.supplementsAndClothes);
    const unexpectedExpensesValue = parseFloatOrDefault(unexpectedExpenses, 0);

    const totalExpenses = rentValue + foodValue + licPremiumValue + sipValue + ssyValue + npsValue +
        carEmiValue + bankDepositValue + parentsExpensesValue + commuteValue + doctorVisitsValue +
        supplementsAndClothesValue;
    const totalMonthlyExpenses = totalExpenses + unexpectedExpensesValue;
    const taxDeduction = calculateTax(parseFloatOrDefault(grossSalary, 133333.33));
    const inHandSalary = parseFloatOrDefault(grossSalary, 133333.33) - taxDeduction;
    const remainingAmount = inHandSalary - totalMonthlyExpenses;

    const records = [{
        month: 'Current Month',
        grossSalary: parseFloatOrDefault(grossSalary, 133333.33).toFixed(2),
        taxDeduction: taxDeduction.toFixed(2),
        inHandSalary: inHandSalary.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        unexpectedExpenses: unexpectedExpensesValue.toFixed(2),
        totalMonthlyExpenses: totalMonthlyExpenses.toFixed(2),
        remainingAmount: remainingAmount.toFixed(2),
    }];

    const csvWriter = createObjectCsvWriter({
        path: 'financial_report.csv',
        header: [
            { id: 'month', title: 'Month' },
            { id: 'grossSalary', title: 'Gross Salary' },
            { id: 'taxDeduction', title: 'Tax Deduction' },
            { id: 'inHandSalary', title: 'In-Hand Salary' },
            { id: 'totalExpenses', title: 'Total Monthly Expenses' },
            { id: 'unexpectedExpenses', title: 'Unexpected Expenses' },
            { id: 'totalMonthlyExpenses', title: 'Total Monthly Expenses with Unexpected' },
            { id: 'remainingAmount', title: 'Remaining Amount' },
        ],
    });

    csvWriter.writeRecords(records)
        .then(() => {
            res.send(`
                <h1>Financial Report</h1>
                <p>Gross Salary: ₹${records[0].grossSalary}</p>
                <p>Tax Deduction: ₹${records[0].taxDeduction}</p>
                <p>In-Hand Salary: ₹${records[0].inHandSalary}</p>
                <p>Total Expenses: ₹${records[0].totalExpenses}</p>
                <p>Unexpected Expenses: ₹${records[0].unexpectedExpenses}</p>
                <p>Total Monthly Expenses with Unexpected: ₹${records[0].totalMonthlyExpenses}</p>
                <p>Remaining Amount: ₹${records[0].remainingAmount}</p>
                <a href="/">Back to Form</a>
            `);
        })
        .catch(err => {
            console.error('Error writing CSV file', err);
            res.status(500).send('An error occurred.');
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
