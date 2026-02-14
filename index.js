// Default bundles (fallback if backend is not available)
const defaultBundles = [
    { id: 1, name: 'Starter Bundle', data: '1GB', price: 4, validity: '7 days', description: 'MTN Up2U - Perfect for light browsing and social media' },
    { id: 2, name: 'Basic Bundle', data: '2GB', price: 8, validity: '7 days', description: 'MTN Up2U - Great for everyday browsing' },
    { id: 3, name: 'Standard Bundle', data: '3GB', price: 18, validity: '14 days', description: 'MTN Up2U - Good for streaming and social media' },
    { id: 4, name: 'Premium Bundle', data: '4GB', price: 27, validity: '14 days', description: 'MTN Up2U - Perfect for video calls and streaming' },
    { id: 5, name: 'Ultra Bundle', data: '5GB', price: 35, validity: '30 days', description: 'MTN Up2U - Excellent for power users' },
    { id: 6, name: 'Max Bundle', data: '6GB', price: 40, validity: '30 days', description: 'MTN Up2U - Heavy usage bundle with great value' },
    { id: 7, name: 'Pro Bundle', data: '8GB', price: 50, validity: '30 days', description: 'MTN Up2U - Maximum data for unlimited browsing and streaming' }
];

// Bundles used by the frontend; will be populated from backend when possible
let bundles = defaultBundles.slice();

// Try to load bundles from backend API
async function loadBundlesFromServer() {
    try {
        const res = await fetch('/api/bundles');
        if (!res.ok) throw new Error('Server returned ' + res.status);
        const data = await res.json();
        if (Array.isArray(data)) {
            bundles = data;
        } else if (data.data) {
            bundles = data.data;
        }
    } catch (err) {
        console.warn('Could not load bundles from backend, using default bundles.', err.message);
        bundles = defaultBundles.slice();
    }
}

// Ensure we try loading from server on startup
loadBundlesFromServer();

// Current selected bundle
let selectedBundle = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    await loadBundlesFromServer();
    displayBundles();
});

// Display all bundles
function displayBundles() {
    const bundlesGrid = document.querySelector('.bundles-grid');
    bundlesGrid.innerHTML = '';

    bundles.forEach(bundle => {
        const bundleCard = document.createElement('div');
        bundleCard.className = 'bundle-card';
        bundleCard.innerHTML = `
            <div class="bundle-header">
                <h3>${bundle.name}</h3>
                <span class="data-amount">${bundle.data}</span>
            </div>
            <div class="bundle-details">
                <p class="description">${bundle.description}</p>
                <p class="validity">⏱️ Valid for ${bundle.validity}</p>
            </div>
            <div class="bundle-footer">
                <p class="price">GH₵${bundle.price.toLocaleString()}</p>
                <button class="buy-button" onclick="openModal(${bundle.id})">
                    Buy Now
                </button>
            </div>
        `;
        bundlesGrid.appendChild(bundleCard);
    });
}

// Open transaction modal
function openModal(bundleId) {
    selectedBundle = bundles.find(b => b.id === bundleId);
    
    if (selectedBundle) {
        document.getElementById('bundleName').value = selectedBundle.name + ' (' + selectedBundle.data + ')';
        document.getElementById('bundlePrice').value = 'GH₵' + selectedBundle.price;
        document.getElementById('phoneNumber').value = '';
        document.getElementById('transactionModal').style.display = 'block';
    }
}

// Close modal
function closeModal() {
    document.getElementById('transactionModal').style.display = 'none';
    selectedBundle = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Initiate payment - Route to Paystack or MTN Mobile Money
function initiatePayment() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;

    // Validation
    if (!phoneNumber) {
        alert('Please enter your MTN phone number');
        return;
    }

    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }

    if (!selectedBundle) {
        alert('No bundle selected');
        return;
    }

    // Route to appropriate payment method
    if (paymentMethod === 'paystack') {
        initiatePaystackBackendPayment(phoneNumber);
    } else if (paymentMethod === 'mtn-momo') {
        initiateMTNMoMoPayment(phoneNumber);
    }
}

// Paystack Backend Payment Handler
function initiatePaystackBackendPayment(phoneNumber) {
    // Show loading
    const payButton = document.querySelector('.pay-button');
    const originalText = payButton.innerText;
    payButton.innerText = 'Processing...';
    payButton.disabled = true;

    // Generate email from phone number as placeholder
    const email = `user-${phoneNumber}@databundles.local`;
    const reference = generateUniqueReference();
    
    // Call backend to initialize Paystack payment
    fetch('/api/initialize-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            amount: selectedBundle.price,
            bundleId: selectedBundle.id,
            phoneNumber: phoneNumber,
            reference: reference
        })
    })
    .then(response => response.json())
    .then(data => {
        payButton.innerText = originalText;
        payButton.disabled = false;

        if (data.status && data.data) {
            // Open Paystack payment page
            if (PaystackPop) {
                const handler = PaystackPop.setup({
                    key: 'pk_live_ae6e4053a84a33d802ef561a3e62af667f69231e',
                    email: email,
                    amount: selectedBundle.price * 100,
                    ref: data.data.reference,
                    onClose: function() {
                        alert('Payment window closed.');
                    },
                    onSuccess: function(response) {
                        verifyPaystackPayment(response.reference, phoneNumber, email);
                    }
                });
                handler.openIframe();
            }
        } else {
            alert('Failed to initialize payment: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: Backend server not running. Please ensure Node.js server is running (see SETUP_INSTRUCTIONS.md)');
        payButton.innerText = originalText;
        payButton.disabled = false;
    });
}

// Verify Paystack Payment
function verifyPaystackPayment(reference, phoneNumber, email) {
    fetch(`/api/verify-payment/${reference}`)
    .then(response => response.json())
    .then(data => {
        if (data.status) {
            // Payment successful
            saveTransactionLocally({
                reference: reference,
                bundle: selectedBundle.name,
                data: selectedBundle.data,
                amount: selectedBundle.price,
                phoneNumber: phoneNumber,
                email: email,
                paymentMethod: 'Paystack',
                timestamp: new Date().toISOString(),
                status: 'completed',
                seller: 'Asare Solomon'
            });

            alert(`✅ Payment Successful!\n\nYour ${selectedBundle.data} bundle will be activated shortly.\nYou'll receive SMS confirmation at ${phoneNumber}.`);
            
            closeModal();
            document.getElementById('transactionForm').reset();
        } else {
            alert('Payment verification failed: ' + (data.message || 'Please try again'));
        }
    })
    .catch(error => {
        console.error('Verification error:', error);
        alert('Could not verify payment. Please check your transaction manually.');
    });
}

// MTN Mobile Money Payment Handler - Direct Payment Flow
function initiateMTNMoMoPayment(phoneNumber) {
    // Get the seller's MTN number (you should update this)
    const sellerMTNNumber = '+233541737072'; // Asare Solomon's MTN number

    const paymentData = {
        reference: generateUniqueReference(),
        bundle: selectedBundle.name,
        data: selectedBundle.data,
        amount: selectedBundle.price,
        phoneNumber: phoneNumber,
        paymentMethod: 'MTN Mobile Money',
        timestamp: new Date().toISOString(),
        status: 'pending',
        seller: 'Asare Solomon',
        sellerPhone: sellerMTNNumber
    };

    // Show payment instructions
    const instructions = `
✅ PAYMENT INSTRUCTIONS

Your Order: ${selectedBundle.data} Bundle
Price: GH₵${selectedBundle.price}
Reference: ${paymentData.reference}

HOW TO PAY:

Option 1: Using your MTN Phone
1. Dial: *170#
2. Select "Send Money"
3. Enter: ${sellerMTNNumber}
4. Amount: ${selectedBundle.price}
5. Enter your MTN PIN

Option 2: Send Money via USSD
1. Dial: *170*370#
2. Follow the prompts
3. Enter seller number: ${sellerMTNNumber}
4. Amount: GH₵${selectedBundle.price}

After payment, your ${selectedBundle.data} bundle will be activated within 2 minutes.

Reference Code: ${paymentData.reference}

For support, WhatsApp: ${sellerMTNNumber}
    `;

    alert(instructions);
    
    // Log transaction locally
    saveTransactionLocally(paymentData);
    
    // Close modal and reset form
    closeModal();
    document.getElementById('transactionForm').reset();
}

// Paystack Payment Handler
function initiatePaystackPayment(phoneNumber, email) {
    // Initialize Paystack payment
    const handler = PaystackPop.setup({
        key: 'pk_live_YOUR_PAYSTACK_PUBLIC_KEY_HERE', // Replace with your Paystack public key
        email: email,
        amount: selectedBundle.price * 100, // Convert cedis to pesewas (100 pesewas = 1 cedi)
        ref: generateUniqueReference(),
        onClose: function() {
            alert('Payment window closed.');
        },
        onSuccess: function(response) {
            handlePaystackSuccess(response, phoneNumber, email);
        },
        onError: function(error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again or use MTN Mobile Money.');
        }
    });

    handler.openIframe();
}

// Generate unique reference for transaction
function generateUniqueReference() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `DBundl-${timestamp}-${random}`;
}

// Handle successful Paystack payment
function handlePaystackSuccess(response, phoneNumber, email) {
    // Send payment confirmation to your backend
    const paymentData = {
        reference: response.reference,
        bundle: selectedBundle.name,
        data: selectedBundle.data,
        amount: selectedBundle.price,
        phoneNumber: phoneNumber,
        email: email,
        paymentMethod: 'Paystack',
        timestamp: new Date().toISOString(),
        status: 'completed',
        seller: 'Asare Solomon'
    };

    // You should send this to your backend server
    console.log('Paystack payment successful:', paymentData);
    
    // Log to localStorage for demo purposes
    saveTransactionLocally(paymentData);

    // Show success message
    alert(`Success! Your ${selectedBundle.data} MTN data bundle has been purchased via Paystack. You will receive SMS confirmation at ${phoneNumber}.`);
    
    // Close modal and reset form
    closeModal();
    document.getElementById('transactionForm').reset();
}

// Save transaction locally (for demo)
function saveTransactionLocally(data) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(data);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Optional: Function to verify payment with Paystack backend
function verifyPaymentWithBackend(reference) {
    // This should be called from your backend
    // Example:
    /*
    fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: reference })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Process the successful payment
            processSuccessfulPayment(data);
        }
    });
    */
}

// Optional: Add custom validation for phone numbers
function validateGhanaianPhone(phone) {
    // Ghanaian phone number validation (MTN, Vodafone, AirtelTigo)
    const ghanaianPhoneRegex = /^(\+233|0)[0-9]{9}$/;
    return ghanaianPhoneRegex.test(phone);
}
