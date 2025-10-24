# 🔧 Google Sheets Setup Guide

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
- Open: https://console.cloud.google.com/
- Sign in with your Google account (the same one you'll use for the expense sheet)

### 1.2 Create New Project
1. Click on the project dropdown (top left)
2. Click "New Project"
3. Project Name: `Family-Expense-Tracker`
4. Click "Create"
5. Wait for project creation (1-2 minutes)

### 1.3 Select Your Project
- Make sure your new project is selected in the dropdown

---

## Step 2: Enable Google Sheets API

### 2.1 Navigate to APIs & Services
1. In the left sidebar, click "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click "Enable"
5. Wait for it to be enabled

---

## Step 3: Create Service Account

### 3.1 Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in details:
   - Service Account Name: `expense-tracker-service`
   - Service Account ID: `expense-tracker-service` (auto-filled)
   - Description: `Service account for family expense tracker`
4. Click "Create and Continue"
5. Skip the optional steps, click "Done"

### 3.2 Generate JSON Key
1. In the Credentials page, find your service account
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" → "Create New Key"
5. Select "JSON" format
6. Click "Create"
7. **IMPORTANT**: A JSON file will download automatically - keep it safe!

### 3.3 Note the Service Account Email
- From the JSON file, copy the `client_email` value
- It looks like: `expense-tracker-service@your-project-id.iam.gserviceaccount.com`
- **You'll need this email in the next step!**

---

## Step 4: Create Google Sheet

### 4.1 Create New Sheet
1. Go to https://sheets.google.com/
2. Click "Blank" to create new spreadsheet
3. Name it: `Family Expense Tracker`

### 4.2 Share Sheet with Service Account
1. Click "Share" button (top right)
2. In the "Add people and groups" field, paste your service account email
3. **Important**: Set permission to "Editor"
4. Uncheck "Notify people"
5. Click "Share"

### 4.3 Get Sheet ID
1. Look at your browser URL bar
2. Copy the ID between `/d/` and `/edit`
3. Example URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
4. Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

## Step 5: Configure Your App

### 5.1 Prepare JSON Key
1. Open the downloaded JSON file in a text editor
2. Copy the ENTIRE content (all the JSON)
3. **Make it a single line** - remove all line breaks and spaces between keys

### 5.2 Create .env File
```bash
# In your project directory, copy the example
cp .env.example .env
```

### 5.3 Edit .env File
```bash
# Replace with your actual values:

GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"family-expense-tracker-401234","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...","client_email":"expense-tracker-service@family-expense-tracker-401234.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/expense-tracker-service%40family-expense-tracker-401234.iam.gserviceaccount.com"}

PORT=3002
NODE_ENV=development
```

**🚨 IMPORTANT NOTES:**
- The JSON key must be on ONE single line in the .env file
- Don't share your .env file - it contains sensitive credentials
- Add .env to .gitignore (already done)

---

## Step 6: Test the Setup

### 6.1 Start Your App
```bash
npm start
```

### 6.2 Add a Test Expense
1. Open http://localhost:3002
2. Add a test expense
3. Check your Google Sheet - you should see a new "Expenses" tab created
4. Your expense should appear in the sheet!

### 6.3 Troubleshooting
If it doesn't work:

**Error: "sheets is not defined"**
- Check your GOOGLE_SERVICE_ACCOUNT_KEY in .env
- Make sure it's valid JSON on one line

**Error: "Permission denied"**
- Make sure you shared the sheet with the service account email
- Set permission to "Editor", not "Viewer"

**Error: "Sheet not found"**
- Double-check your GOOGLE_SHEET_ID
- Make sure the sheet exists and is accessible

---

## 🎉 Success!

Once working, your expenses will:
✅ Save locally on your phone (works offline)  
✅ Automatically sync to Google Sheets when online  
✅ Be accessible from any device via Google Sheets  
✅ Have automatic backup and version history  

You can now view and manage your expense data directly in Google Sheets, create additional reports, or share with family members!

---

## 📋 Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google Sheets API  
- [ ] Created service account
- [ ] Downloaded JSON key file
- [ ] Created Google Sheet
- [ ] Shared sheet with service account email (as Editor)
- [ ] Copied Sheet ID from URL
- [ ] Created .env file with correct values
- [ ] Tested by adding expense
- [ ] Verified data appears in Google Sheet

Need help with any step? Let me know! 🚀