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

// Predefined default values
const predefinedValues = {
    grossSalary: 133333.33,
    rent: 14000,
    food: 3000,
    licPremium: 1333,
    sip: 5000,
    ssy: 7500,
    nps: 4167,
    carEmi: 12000,
    bankDeposit: 5000,
    parentsExpenses: 20000,
    commute: 345,
    doctorVisits: 1500,
    supplementsAndClothes: 3000
};

// Render the form page with predefined values
app.get('/', (req, res) => {
    res.render('index', { predefinedValues, result: null });
});

// Handle form submission
app.post('/calculate', (req, res) => {
    const {
        grossSalary, rent, food, licPremium, sip, ssy, nps, carEmi, bankDeposit,
        parentsExpenses, commute, doctorVisits, supplementsAndClothes, unexpectedExpenses
    } = req.body;

    const parseFloatOrDefault = (value, defaultValue) => parseFloat(value) || defaultValue;

    const calculateTax = (grossSalary) => {
        let taxableIncome = grossSalary - 260000; // Basic exemption limit
        if (taxableIncome <= 0) return 0;

        let tax = 0;
        if (taxableIncome <= 250000) {
            tax = taxableIncome * 0.05;
        } else if (taxableIncome <= 500000) {
            tax = 250000 * 0.05 + (taxableIncome - 250000) * 0.1;
        } else if (taxableIncome <= 1000000) {
            tax = 250000 * 0.05 + 250000 * 0.1 + (taxableIncome - 500000) * 0.2;
        } else {
            tax = 250000 * 0.05 + 250000 * 0.1 + 500000 * 0.2 + (taxableIncome - 1000000) * 0.3;
        }
        return tax + (tax * 0.04); // Adding 4% health and education cess
    };

    const grossSalaryValue = parseFloatOrDefault(grossSalary, predefinedValues.grossSalary);
    const rentValue = parseFloatOrDefault(rent, predefinedValues.rent);
    const foodValue = parseFloatOrDefault(food, predefinedValues.food);
    const licPremiumValue = parseFloatOrDefault(licPremium, predefinedValues.licPremium);
    const sipValue = parseFloatOrDefault(sip, predefinedValues.sip);
    const ssyValue = parseFloatOrDefault(ssy, predefinedValues.ssy);
    const npsValue = parseFloatOrDefault(nps, predefinedValues.nps);
    const carEmiValue = parseFloatOrDefault(carEmi, predefinedValues.carEmi);
    const bankDepositValue = parseFloatOrDefault(bankDeposit, predefinedValues.bankDeposit);
    const parentsExpensesValue = parseFloatOrDefault(parentsExpenses, predefinedValues.parentsExpenses);
    const commuteValue = parseFloatOrDefault(commute, predefinedValues.commute);
    const doctorVisitsValue = parseFloatOrDefault(doctorVisits, predefinedValues.doctorVisits);
    const supplementsAndClothesValue = parseFloatOrDefault(supplementsAndClothes, predefinedValues.supplementsAndClothes);
    const unexpectedExpensesValue = parseFloatOrDefault(unexpectedExpenses, 0);

    const totalExpenses = rentValue + foodValue + licPremiumValue + sipValue + ssyValue + npsValue +
        carEmiValue + bankDepositValue + parentsExpensesValue + commuteValue + doctorVisitsValue +
        supplementsAndClothesValue;
    const totalMonthlyExpenses = totalExpenses + unexpectedExpensesValue;
    const taxDeduction = calculateTax(grossSalaryValue);
    const inHandSalary = grossSalaryValue - taxDeduction;
    const remainingAmount = inHandSalary - totalMonthlyExpenses;

    // Prepare CSV data
    const csvWriter = createObjectCsvWriter({
        path: 'financial_report.csv',
        header: [
            { id: 'grossSalary', title: 'Gross Salary' },
            { id: 'taxDeduction', title: 'Tax Deduction' },
            { id: 'inHandSalary', title: 'In-Hand Salary' },
            { id: 'totalExpenses', title: 'Total Expenses' },
            { id: 'unexpectedExpenses', title: 'Unexpected Expenses' },
            { id: 'totalMonthlyExpenses', title: 'Total Monthly Expenses' },
            { id: 'remainingAmount', title: 'Remaining Amount' }
        ]
    });

    const csvData = [{
        grossSalary: grossSalaryValue,
        taxDeduction,
        inHandSalary,
        totalExpenses,
        unexpectedExpenses: unexpectedExpensesValue,
        totalMonthlyExpenses,
        remainingAmount
    }];

    csvWriter.writeRecords(csvData)
        .then(() => console.log('CSV file was written successfully'));

    res.render('index', {
        predefinedValues,
        result: {
            grossSalary: grossSalaryValue,
            taxDeduction,
            inHandSalary,
            totalExpenses,
            unexpectedExpenses: unexpectedExpensesValue,
            totalMonthlyExpenses,
            remainingAmount
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
