#!/usr/bin/env node

// Google Sheets Connection Test Script
const { google } = require('googleapis');
require('dotenv').config();

async function testGoogleSheetsConnection() {
    console.log('🔍 Testing Google Sheets Connection...\n');
    
    // Check environment variables
    console.log('1. Checking environment variables...');
    
    if (!process.env.GOOGLE_SHEET_ID) {
        console.log('❌ GOOGLE_SHEET_ID not found in .env file');
        return;
    }
    console.log('✅ GOOGLE_SHEET_ID found:', process.env.GOOGLE_SHEET_ID);
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in .env file');
        return;
    }
    console.log('✅ GOOGLE_SERVICE_ACCOUNT_KEY found (length:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY.length, 'chars)');
    
    try {
        // Parse service account key (decode from base64)
        console.log('\n2. Parsing service account credentials...');
        const credentialsJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
        const credentials = JSON.parse(credentialsJson);
        console.log('✅ Service account email:', credentials.client_email);
        console.log('✅ Project ID:', credentials.project_id);
        
        // Create auth client
        console.log('\n3. Creating authentication client...');
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key.replace(/\\n/g, '\n'),
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        // Initialize sheets API
        const sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API client created');
        
        // Test connection by getting spreadsheet info
        console.log('\n4. Testing connection to your spreadsheet...');
        const response = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
        });
        
        console.log('✅ Successfully connected to spreadsheet!');
        console.log('📊 Spreadsheet title:', response.data.properties.title);
        console.log('📋 Number of sheets:', response.data.sheets.length);
        
        // List existing sheets
        console.log('\n5. Existing sheets:');
        response.data.sheets.forEach((sheet, index) => {
            console.log(`   ${index + 1}. ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} rows)`);
        });
        
        // Test write access
        console.log('\n6. Testing write access...');
        const testData = [
            ['Test Timestamp', 'Test Date', 'User', 'Type', 'Description', 'Amount', 'Entry Type', 'Currency'],
            [new Date().toISOString(), new Date().toISOString().split('T')[0], 'S', 'Test', 'Connection Test', 10, 'expense', 'INR']
        ];
        
        // Check if Expenses sheet exists, create if not
        const expenseSheetExists = response.data.sheets.some(sheet => sheet.properties.title === 'Expenses');
        
        if (!expenseSheetExists) {
            console.log('📝 Creating Expenses sheet...');
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
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
            console.log('✅ Expenses sheet created');
            
            // Add headers
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Expenses!A1:H1',
                valueInputOption: 'RAW',
                resource: {
                    values: [testData[0]]
                }
            });
            console.log('✅ Headers added to Expenses sheet');
        }
        
        // Add test data
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Expenses!A:H',
            valueInputOption: 'RAW',
            resource: {
                values: [testData[1]]
            }
        });
        
        console.log('✅ Test data written successfully!');
        
        console.log('\n🎉 CONNECTION TEST SUCCESSFUL!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Environment variables configured');
        console.log('   ✅ Service account authentication working');
        console.log('   ✅ Spreadsheet accessible');
        console.log('   ✅ Read access confirmed');
        console.log('   ✅ Write access confirmed');
        console.log('   ✅ Expenses sheet ready');
        
        console.log('\n🚀 Your app is ready to use Google Sheets!');
        console.log(`📊 Check your spreadsheet: https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`);
        
    } catch (error) {
        console.log('\n❌ CONNECTION TEST FAILED!');
        console.error('Error details:', error.message);
        
        if (error.message.includes('Invalid JSON')) {
            console.log('\n💡 Fix: Check your GOOGLE_SERVICE_ACCOUNT_KEY in .env file');
            console.log('   - Make sure it\'s valid JSON');
            console.log('   - Should be on one line');
            console.log('   - No line breaks or extra spaces');
        }
        
        if (error.message.includes('permission')) {
            console.log('\n💡 Fix: Check spreadsheet permissions');
            console.log('   - Share the spreadsheet with your service account email');
            console.log('   - Set permission to "Editor"');
            console.log('   - Service account email is in the JSON key file');
        }
        
        if (error.message.includes('not found')) {
            console.log('\n💡 Fix: Check your GOOGLE_SHEET_ID');
            console.log('   - Copy from the spreadsheet URL');
            console.log('   - Should be between /d/ and /edit in the URL');
        }
    }
}

// Run the test
testGoogleSheetsConnection().catch(console.error);