const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic admin auth middleware
function requireAdminAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authentication required');
    }
    const base64 = auth.split(' ')[1];
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'password';
    if (user === adminUser && pass === adminPass) return next();
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Invalid credentials');
}

// Paystack Configuration
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_YOUR_PUBLIC_KEY';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Store transactions (in production, use a database)
const transactions = [];

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Get bundles
app.get('/api/bundles', (req, res) => {
    const bundles = [
        { id: 1, name: 'Starter Bundle', data: '1GB', price: 4 },
        { id: 2, name: 'Basic Bundle', data: '2GB', price: 8 },
        { id: 3, name: 'Standard Bundle', data: '3GB', price: 18 },
        { id: 4, name: 'Premium Bundle', data: '4GB', price: 27 },
        { id: 5, name: 'Ultra Bundle', data: '5GB', price: 35 },
        { id: 6, name: 'Max Bundle', data: '6GB', price: 40 },
        { id: 7, name: 'Pro Bundle', data: '8GB', price: 50 }
    ];
    res.json(bundles);
});

// Initialize Paystack payment
app.post('/api/initialize-payment', async (req, res) => {
    try {
        const { email, amount, bundleId, phoneNumber, reference } = req.body;

        // Validation
        if (!email || !amount || !bundleId || !phoneNumber) {
            return res.status(400).json({ 
                status: false, 
                message: 'Missing required fields: email, amount, bundleId, phoneNumber' 
            });
        }

        // Create Paystack request
        const paystackData = {
            email: email,
            amount: amount * 100, // Convert to kobo (Paystack uses smallest currency unit)
            reference: reference || generateReference(),
            metadata: {
                bundleId: bundleId,
                phoneNumber: phoneNumber,
                description: `MTN Data Bundle Purchase`
            }
        };

        // Call Paystack API
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            paystackData,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.status) {
            res.json({
                status: true,
                message: 'Authorization URL created',
                data: response.data.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'Failed to initialize payment'
            });
        }
    } catch (error) {
        console.error('Payment initialization error:', error.message);
        res.status(500).json({
            status: false,
            message: error.message || 'Server error during payment initialization'
        });
    }
});

// Verify payment
app.get('/api/verify-payment/:reference', async (req, res) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({
                status: false,
                message: 'Reference is required'
            });
        }

        // Call Paystack API to verify
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        if (response.data.data.status === 'success') {
            const transactionData = {
                reference: reference,
                status: 'completed',
                amount: response.data.data.amount / 100, // Convert back to cedis
                email: response.data.data.customer.email,
                phoneNumber: response.data.data.metadata.phoneNumber,
                bundleId: response.data.data.metadata.bundleId,
                timestamp: new Date().toISOString()
            };

            // Save transaction
            transactions.push(transactionData);

            res.json({
                status: true,
                message: 'Payment verified successfully',
                data: transactionData
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error.message);
        res.status(500).json({
            status: false,
            message: error.message || 'Server error during verification'
        });
    }
});

// Webhook for Paystack - verify signature and auto-activate
app.post('/api/webhook/paystack', express.raw({ type: 'application/json' }), (req, res) => {
    try {
        const signature = req.headers['x-paystack-signature'];
        const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.body).digest('hex');
        if (hash !== signature) {
            console.warn('Invalid webhook signature');
            return res.status(401).send('invalid signature');
        }

        const event = JSON.parse(req.body.toString());

        if (event.event === 'charge.success') {
            const transactionData = {
                reference: event.data.reference,
                status: 'completed',
                amount: event.data.amount / 100,
                email: event.data.customer.email,
                phoneNumber: event.data.metadata.phoneNumber,
                bundleId: event.data.metadata.bundleId,
                timestamp: new Date().toISOString()
            };

            transactions.push(transactionData);

            // Auto-activate bundle (simulate)
            const activation = {
                status: true,
                message: `Bundle ${transactionData.bundleId} activated for ${transactionData.phoneNumber}`,
                data: {
                    phoneNumber: transactionData.phoneNumber,
                    bundleId: transactionData.bundleId,
                    reference: transactionData.reference,
                    activatedAt: new Date().toISOString()
                }
            };

            console.log('Webhook processed - payment successful:', transactionData);
            console.log('Auto-activation result:', activation.message);
        }

        res.json({ status: 'success' });
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get all transactions (for admin dashboard)
app.get('/api/transactions', requireAdminAuth, (req, res) => {
    res.json({
        status: true,
        count: transactions.length,
        data: transactions
    });
});

// Get transaction by reference
app.get('/api/transaction/:reference', (req, res) => {
    const { reference } = req.params;
    const transaction = transactions.find(t => t.reference === reference);

    if (transaction) {
        res.json({
            status: true,
            data: transaction
        });
    } else {
        res.status(404).json({
            status: false,
            message: 'Transaction not found'
        });
    }
});

// Activate bundle (simulate bundle activation)
app.post('/api/activate-bundle', requireAdminAuth, (req, res) => {
    try {
        const { phoneNumber, bundleId, reference } = req.body;

        if (!phoneNumber || !bundleId) {
            return res.status(400).json({
                status: false,
                message: 'Phone number and bundle ID required'
            });
        }

        // Simulate bundle activation
        const response = {
            status: true,
            message: `Bundle ${bundleId} activated for ${phoneNumber}`,
            data: {
                phoneNumber: phoneNumber,
                bundleId: bundleId,
                reference: reference,
                activatedAt: new Date().toISOString()
            }
        };

        // In production:
        // 1. Send API request to MTN to activate bundle
        // 2. Send SMS to customer
        // 3. Update database

        res.json(response);
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Serve admin UI with basic auth
app.get('/admin.html', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve static files for public site
app.use(express.static('.')); // Serve static files from current directory

// Helper function to generate reference
function generateReference() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `DBundl-${timestamp}-${random}`;
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  Asare Solomon - Data Bundles Backend     ║
║  Server running on http://localhost:${PORT}  ║
║                                            ║
║  Endpoints:                                ║
║  POST   /api/initialize-payment            ║
║  GET    /api/verify-payment/:reference     ║
║  POST   /api/webhook/paystack              ║
║  GET    /api/transactions                  ║
║  POST   /api/activate-bundle               ║
╚════════════════════════════════════════════╝
    `);
});

module.exports = app;
