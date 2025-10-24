# 🌟 Family Expense Tracker - Complete Setup Guide

## 📱 What We've Built

A comprehensive, mobile-first expense tracking Progressive Web App (PWA) with:

### ✅ **Core Features Implemented**
- **Mobile-Responsive Design**: Touch-friendly UI, optimized for phones
- **Google Sheets Integration**: Data syncs to your personal Google Sheet
- **Offline Support**: Works without internet, syncs when online
- **Advanced Search & Filtering**: Find transactions by any criteria
- **Recurring Transactions**: Auto-process monthly EMIs, salary, etc.
- **Budget Management**: Set limits with smart alerts
- **Visual Analytics**: Interactive charts and graphs
- **PWA Features**: Install as app, works offline
- **Advanced Reporting**: Export to PDF, CSV, JSON

### 🚀 **Getting Started**

## 1. Google Sheets Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Family Expense Tracker"
3. Enable Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Download the JSON key file

### Step 2: Create Google Sheet
1. Create a new Google Sheet
2. Copy the Sheet ID from the URL (between `/d/` and `/edit`)
3. Share the sheet with your service account email (from JSON file)
4. Give it "Editor" permissions

### Step 3: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your details:
GOOGLE_SHEET_ID=your-google-sheet-id-here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## 2. Installation & Running

```bash
# Install dependencies
npm install

# Start the application
npm start

# Or for development with auto-reload
npm run dev
```

## 3. Mobile Usage

### 📱 **Install as PWA**
1. Open app in mobile browser
2. Look for "Install App" button or browser's "Add to Home Screen"
3. Install for offline use

### 💰 **Add Transactions**
- Tap "➖ Add Expense" or "➕ Add Income"
- Fill details and submit
- Works offline, syncs automatically

### 📊 **View Reports**
- Tap "📊 View Summary" for monthly overview
- Use "🔍 Search & Filter" to find specific transactions
- Check "📋 Reports" for detailed analytics

### 💡 **Smart Features**
- **Recurring**: Set up monthly EMIs, salary auto-processing
- **Budget**: Set spending limits with alerts
- **Charts**: Visual spending analysis
- **Sync**: Data automatically backs up to Google Sheets

## 4. Key Features Explained

### 🔄 **Recurring Transactions**
- Set up monthly salary, EMI payments
- Auto-processes when due
- Never miss regular payments

### 💰 **Budget Management**
- Set category-wise spending limits
- Get alerts at 80%, 90%, 100%
- Track progress with visual bars

### 🔍 **Advanced Search**
- Search by description, amount, date
- Filter by category, user, transaction type
- Export search results

### 📊 **Visual Analytics**
- Pie charts showing expense breakdown
- Line charts for spending trends
- Bar charts for income vs expenses
- Budget progress visualization

### 📋 **Comprehensive Reports**
- Monthly, quarterly, yearly reports
- Category-wise analysis
- Export to CSV, PDF, JSON
- Shareable report links

### 🔌 **Offline Features**
- All data stored locally (IndexedDB)
- Works without internet
- Auto-syncs when online
- Background sync for seamless experience

## 5. Family Usage Tips

### 👨‍👩‍👧‍👦 **Multi-User Setup**
- Each family member has their own profile (A = Ashi, S = Sanju)
- Combined reports show family overview
- Individual budgets and analytics

### 📱 **Mobile Optimization**
- Designed for thumb-friendly navigation
- Large touch targets (48px minimum)
- Horizontal scrolling for tables
- Pull-to-refresh support

### 🔐 **Data Security**
- Data stored locally on device
- Optional Google Sheets backup
- No third-party data sharing
- Privacy-first design

## 6. Troubleshooting

### ❓ **Common Issues**

**Google Sheets not syncing?**
- Check service account permissions
- Verify GOOGLE_SHEET_ID in .env
- Check internet connection

**App not installing as PWA?**
- Use Chrome/Safari browser
- Ensure HTTPS (for production)
- Check manifest.json accessibility

**Offline mode not working?**
- Check service worker registration
- Clear browser cache and reload
- Verify IndexedDB support

**Budget alerts not showing?**
- Enable notifications in browser settings
- Check alert settings in Budget section
- Verify budget amounts are set correctly

## 7. Advanced Configuration

### 🔧 **Environment Variables**
```bash
PORT=3002                    # Server port
NODE_ENV=production         # Environment mode
GOOGLE_SHEET_ID=...        # Your Google Sheet ID
GOOGLE_SERVICE_ACCOUNT_KEY=... # Service account JSON
```

### 📊 **Custom Categories**
Edit the category lists in:
- `views/index.ejs` (form options)
- `public/script.js` (filter options)

### 🎨 **Theming**
Customize colors in `public/style.css`:
- Primary gradient: `#667eea` to `#764ba2`
- Success color: `#51cf66`
- Error color: `#ff6b6b`
- Warning color: `#ffa726`

## 8. Deployment Options

### 🌐 **Local Network**
```bash
# Run on local network (accessible by all family devices)
npm start
# Access via http://[your-ip]:3002
```

### ☁️ **Cloud Deployment**
- **Render.com**: Connect GitHub repo, auto-deploy
- **Vercel**: Deploy with `vercel` command
- **Netlify**: Drag-and-drop build folder
- **Heroku**: Git push deployment

### 📱 **Self-Hosted**
- Run on Raspberry Pi for home server
- Use ngrok for external access
- Set up domain with SSL certificate

## 9. Backup & Recovery

### 💾 **Data Export**
- Go to Reports → "Export All Data"
- Downloads complete JSON backup
- Includes expenses, budgets, recurring transactions

### 📥 **Data Import**
- Currently manual (future enhancement)
- JSON structure documented in export files

## 🎉 **Congratulations!**

Your Family Expense Tracker is now ready! 

### **What You Can Do Now:**
✅ Track daily expenses and income  
✅ Set up budgets and get alerts  
✅ Create recurring transactions  
✅ Generate detailed reports  
✅ Use offline on mobile  
✅ Sync data to Google Sheets  
✅ Install as mobile app  

### **Next Steps:**
1. Install as PWA on all family phones
2. Set up Google Sheets integration
3. Configure recurring transactions (salary, EMIs)
4. Set monthly budgets
5. Start tracking your family's expenses!

---

**Need Help?** Check the troubleshooting section or review the comprehensive features we've built. This is a full-featured expense tracker that rivals commercial apps! 🚀