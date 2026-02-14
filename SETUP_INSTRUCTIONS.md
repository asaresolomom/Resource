# Setup Instructions for Node.js Backend

## Quick Start Guide

### Step 1: Install Node.js
- Download from: https://nodejs.org/ (LTS version recommended)
- Install it on your computer

### Step 2: Add Your Paystack Keys
1. Go to: https://dashboard.paystack.com/settings/developer
2. Copy your **Public Key** and **Secret Key**
3. Open the `.env` file in this folder
4. Replace the placeholder keys:
   ```
   PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY
   PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY
   ```

### Step 3: Install Dependencies
Open PowerShell in this folder and run:
```powershell
npm install
```

This will install all required packages:
- express (web server)
- cors (enable cross-origin requests)
- axios (make HTTP requests)
- dotenv (read environment variables)

### Step 4: Start the Server
Run this command in PowerShell:
```powershell
npm start
```

You should see:
```
╔════════════════════════════════════════════╗
║  Asare Solomon - Data Bundles Backend     ║
║  Server running on http://localhost:5000   ║
╚════════════════════════════════════════════╝
```

### Step 5: Test the Server
Open your browser and go to: http://localhost:5000/api/health

You should see: `{"status":"Server is running","timestamp":"..."}`

---

## API Endpoints Available

### 1. Get All Bundles
```
GET http://localhost:5000/api/bundles
```
Returns all available data bundles

### 2. Initialize Payment
```
POST http://localhost:5000/api/initialize-payment
```
Request body:
```json
{
  "email": "customer@example.com",
  "amount": 50,
  "bundleId": 7,
  "phoneNumber": "+233541737072"
}
```

### 3. Verify Payment
```
GET http://localhost:5000/api/verify-payment/DBundl-XXXXX
```
Check if a payment was successful

### 4. Get All Transactions
```
GET http://localhost:5000/api/transactions
```
View all completed transactions

### 5. Activate Bundle
```
POST http://localhost:5000/api/activate-bundle
```
Request body:
```json
{
  "phoneNumber": "+233541737072",
  "bundleId": 7,
  "reference": "DBundl-XXXXX"
}
```

---

## Keeping the Server Running

To keep the server running after closing PowerShell:

### Option 1: Use PM2 (Recommended)
```powershell
npm install -g pm2
pm2 start server.js --name "DataBundles"
pm2 startup
pm2 save
```

### Option 2: Create a Batch File
Create a file named `start-server.bat` in the folder:
```batch
@echo off
npm start
pause
```

Then double-click `start-server.bat` to start the server

---

## Troubleshooting

**Error: "npm is not recognized"**
- Node.js not installed properly. Restart your computer after installing Node.js

**Error: "Cannot find module 'express'"**
- Run `npm install` first

**Error: "Port 5000 is already in use"**
- Change PORT in `.env` file to 5001 or 5002
- Or find and close the app using port 5000

**Error: "Invalid Paystack keys"**
- Make sure you copied the keys correctly from your Paystack dashboard
- Use test keys (pk_test_, sk_test_) first for testing
- Then switch to live keys (pk_live_, sk_live_) for production

---

## Next Steps

1. ✅ Install Node.js
2. ✅ Add your Paystack keys to `.env`
3. ✅ Run `npm install`
4. ✅ Run `npm start`
5. ✅ Test at http://localhost:5000/api/health

The frontend (index.html) is already configured to work with this backend!

Need help? Contact: +233 541 737 072 (WhatsApp)

## ngrok & Webhook (optional - for real webhook testing)

1. Install ngrok from https://ngrok.com and login.
2. Run from PowerShell in project folder:

```powershell
ngrok http 5000
```

3. Copy the HTTPS URL ngrok gives (for example `https://abcd1234.ngrok.io`).
4. In Paystack Dashboard → Settings → Webhooks, add the URL:

```
<YOUR_NGROK_URL>/api/webhook/paystack
```

5. Set webhook to send `charge.success` events. Your local server will receive them and record transactions.

## Admin Page

Open the admin UI to view and activate orders after starting the server:

```
http://localhost:5000/admin.html
```

Use the table to refresh transactions and click **Activate** to call the `/api/activate-bundle` endpoint.
