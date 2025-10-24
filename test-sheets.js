// Google Sheets Connection Test
const { google } = require('googleapis');
require('dotenv').config();

async function testGoogleSheetsConnection() {
    console.log('🔍 Testing Google Sheets connection...\n');
    
    try {
        // Parse the service account key (decode from base64)
        const credentialsJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
        const credentials = JSON.parse(credentialsJson);
        console.log('✅ Service account credentials loaded');
        console.log(`📧 Service account email: ${credentials.client_email}`);
        
        // Initialize Google Auth
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key.replace(/\\n/g, '\n'),
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        // Initialize Sheets API
        const sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API initialized');
        
        // Test connection by getting spreadsheet info
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        console.log(`📊 Testing connection to sheet: ${spreadsheetId}`);
        
        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });
        
        console.log('\n🎉 SUCCESS! Google Sheets connection working!');
        console.log(`📄 Spreadsheet title: "${response.data.properties.title}"`);
        console.log(`📋 Number of sheets: ${response.data.sheets.length}`);
        
        // List all sheets
        console.log('\n📝 Available sheets:');
        response.data.sheets.forEach((sheet, index) => {
            console.log(`   ${index + 1}. ${sheet.properties.title}`);
        });
        
        // Test writing data
        console.log('\n🧪 Testing write access...');
        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A1:H1',
            valueInputOption: 'RAW',
            resource: {
                values: [['Timestamp', 'Date', 'User', 'Type', 'Description', 'Amount', 'Entry Type', 'Currency']]
            }
        });
        
        console.log('✅ Write test successful! Headers added to Sheet1');
        
        // Test reading data back
        const readResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A1:H1',
        });
        
        console.log('✅ Read test successful!');
        console.log('📖 Headers read back:', readResponse.data.values[0]);
        
        console.log('\n🚀 Google Sheets integration is ready to use!');
        console.log('\n📋 Next steps:');
        console.log('   1. Start the app: npm start');
        console.log('   2. Add some expense entries');
        console.log('   3. Check your Google Sheet to see the data appear!');
        
    } catch (error) {
        console.error('\n❌ Error testing Google Sheets connection:');
        
        if (error.code === 403) {
            console.error('🔒 Permission denied! Please make sure:');
            console.error('   1. The Google Sheet is shared with the service account email');
            console.error(`   2. Email to share with: ${JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).client_email}`);
            console.error('   3. Give "Editor" permissions to the service account');
        } else if (error.code === 404) {
            console.error('🔍 Sheet not found! Please check:');
            console.error('   1. The GOOGLE_SHEET_ID is correct');
            console.error('   2. The sheet exists and is accessible');
        } else {
            console.error('Details:', error.message);
        }
        
        console.error('\n🛠️  Troubleshooting:');
        console.error('   1. Double-check the .env file configuration');
        console.error('   2. Ensure the Google Sheet ID is correct');
        console.error('   3. Verify service account permissions');
        console.error('   4. Make sure Google Sheets API is enabled in Google Cloud Console');
    }
}

// Run the test
testGoogleSheetsConnection();