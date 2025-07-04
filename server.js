const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Serve static files
app.use(express.static('public'));

// Store QR code data
let currentQR = null;

// API endpoint to get QR code
app.get('/api/qr', (req, res) => {
    if (currentQR) {
        res.json({ qr: currentQR, timestamp: new Date().toISOString() });
    } else {
        res.json({ qr: null, message: 'No QR code available' });
    }
});

// API endpoint to get bot status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'active', 
        message: 'WhatsApp Bot is running',
        timestamp: new Date().toISOString()
    });
});

// Function to update QR code
function updateQR(qrData) {
    currentQR = qrData;
    console.log(qrData ? '✅ QR code updated' : '🗑️ QR code cleared');
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running at http://0.0.0.0:${PORT}`);
    console.log(`📱 Open this URL to view QR code in browser`);
});

module.exports = { updateQR };



