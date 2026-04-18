# MongoDB Atlas Migration Guide

මේ guide එක use කරලා ඔයාගේ local MongoDB data Atlas එකට migrate කරන්න පුළුවන්.

## Prerequisites

- MongoDB tools installed (`mongodump`, `mongoexport`, `mongoimport`)
- MongoDB Atlas account (free tier එක ඇති)
- Local MongoDB running with data

## Step 1: Export Local Data

```bash
# ඔයාගේ local database එක export කරන්න
node exportData.js
```

මේකෙන් `mongodb-backup` folder එකක් හදලා හැම collection එකම export කරයි.

## Step 2: Setup MongoDB Atlas

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) එකට login වෙන්න
2. "Create a New Cluster" click කරන්න (M0 Free tier select කරන්න)
3. Cluster name එකක් දෙන්න (e.g., "restaurant-cluster")
4. Region එකක් select කරන්න (closest one)
5. "Create Cluster" click කරන්න (2-3 minutes යනවා)

## Step 3: Configure Database Access

1. Left sidebar එකේ "Database Access" click කරන්න
2. "Add New Database User" click කරන්න
3. Username හා Password එකක් දෙන්න (මතක තියාගන්න!)
4. "Built-in Role" එකේ "Read and write to any database" select කරන්න
5. "Add User" click කරන්න

## Step 4: Configure Network Access

1. Left sidebar එකේ "Network Access" click කරන්න
2. "Add IP Address" click කරන්න
3. Development සඳහා: "Allow Access from Anywhere" (0.0.0.0/0) select කරන්න
4. Production සඳහා: ඔයාගේ specific IP addresses add කරන්න
5. "Confirm" click කරන්න

## Step 5: Get Connection String

1. "Database" tab එකට යන්න
2. ඔයාගේ cluster එකේ "Connect" button එක click කරන්න
3. "Connect your application" select කරන්න
4. "Driver" එකේ "Node.js" select කරන්න
5. Connection string එක copy කරන්න

Connection string එක මෙහෙම වෙයි:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/restaurant?retryWrites=true&w=majority
```

## Step 6: Import Data to Atlas

```bash
# Atlas connection string එක use කරලා import කරන්න
node importData.js "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurant"
```

**Important:** 
- `<username>` හා `<password>` replace කරන්න ඔයාගේ database user credentials වලින්
- Connection string එක quotes වල දාන්න

## Step 7: Update Environment Variables

`.env` file එක update කරන්න:

```env
# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurant?retryWrites=true&w=majority

PORT=5000
JWT_SECRET=restaurant_management_secret_key_2026
JWT_EXPIRE=30d
NODE_ENV=production
```

## Step 8: Test Connection

```bash
# Server එක start කරලා test කරන්න
npm start
```

## Sharing with Team Members

### Option 1: Same Database User (Simple)
- Connection string එක share කරන්න team එක එක්ක
- හැමෝම same credentials use කරයි

### Option 2: Individual Users (Recommended)
1. Atlas එකේ "Database Access" එකට යන්න
2. Team member කෙනෙකුට user එකක් create කරන්න
3. ඔවුන්ගේ own connection string එක share කරන්න

### Option 3: Environment Template
1. `.env.example` file එක share කරන්න
2. Team members ඔවුන්ගේ own credentials fill කරයි

## Troubleshooting

### Authentication Failed
- Username/password correct ද check කරන්න
- Special characters (`@`, `#`, etc.) URL encode කරන්න

### Network Error
- IP address whitelist කරලා තියෙනවද check කරන්න
- Internet connection එක check කරන්න

### Import Failed
- `mongodb-backup` folder එක තියෙනවද check කරන්න
- MongoDB tools install කරලා තියෙනවද check කරන්න

## MongoDB Tools Installation

### Windows
```bash
# Chocolatey use කරන්න
choco install mongodb-database-tools
```

### macOS
```bash
# Homebrew use කරන්න
brew install mongodb-database-tools
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install mongodb-database-tools
```

## Useful Commands

```bash
# Check exported files
ls -lh mongodb-backup/

# Export single collection
mongoexport --uri="mongodb://localhost:27017/restaurant" --collection=users --out=users.json --jsonArray

# Import single collection
mongoimport --uri="your-atlas-uri" --collection=users --file=users.json --jsonArray --drop

# Backup entire database
mongodump --uri="mongodb://localhost:27017/restaurant" --out=./full-backup
```

## Free Tier Limits

MongoDB Atlas Free Tier (M0):
- 512 MB storage
- Shared RAM
- Shared vCPU
- No backup/restore
- Perfect for development and small projects

## Support

Issues තියෙනවනම්:
1. Atlas dashboard එකේ logs check කරන්න
2. Connection string එක correct ද verify කරන්න
3. Network access settings check කරන්න
