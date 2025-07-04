const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const QRCode = require('qrcode');

let sock = null;
let ownerNumber = null; // Will be set when bot connects

async function startBot() {
    try {
        console.log('🚀 Starting WhatsApp Bot...');

        const { state, saveCreds } = await useMultiFileAuthState('./auth');

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['WhatsApp Bot', 'Chrome', '4.0.0'],
            logger: pino({ level: 'silent' })
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n=================================');
                console.log('📱 SCAN QR CODE TO LOGIN');
                console.log('=================================\n');
                console.log('🌐 QR code available at: http://0.0.0.0:5000');

                qrcode.generate(qr, { small: true });

                // Update web server QR
                try {
                    const qrImage = await QRCode.toDataURL(qr);
                    const base64Data = qrImage.replace('data:image/png;base64,', '');

                    const { updateQR } = require('./server.js');
                    updateQR(base64Data);

                    console.log('✅ QR code updated for web preview');
                } catch (err) {
                    console.log('❌ Failed to update web QR:', err.message);
                }
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp Connected Successfully!');
                console.log('🤖 Bot is now active and ready to use!');

                // Set owner number (the person who connected the bot)
                if (sock && sock.user) {
                    // Extract just the phone number part (before the colon)
                    ownerNumber = sock.user.id.split(':')[0];
                    console.log(`👑 Owner set to: ${ownerNumber}`);
                    console.log(`👑 Full ID: ${sock.user.id}`);
                }

                // Clear QR code after connection
                try {
                    const { updateQR } = require('./server.js');
                    updateQR(null);
                } catch (err) {
                    console.log('❌ Failed to clear QR:', err.message);
                }
            }

            if (connection === 'close') {
                // Clear QR code on disconnect
                try {
                    const { updateQR } = require('./server.js');
                    updateQR(null);
                    console.log('🗑️ Cleared old QR code');
                } catch (err) {
                    console.log('❌ Failed to clear QR:', err.message);
                }

                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    console.log('🔄 Reconnecting...');
                    setTimeout(() => startBot(), 3000);
                } else {
                    console.log('❌ Logged out. Clearing auth state...');

                    // Clear authentication state to prevent loops
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const authPath = path.join(__dirname, 'auth');

                        if (fs.existsSync(authPath)) {
                            fs.rmSync(authPath, { recursive: true, force: true });
                            console.log('🗑️ Cleared authentication state');
                        }
                    } catch (err) {
                        console.log('❌ Failed to clear auth state:', err.message);
                    }

                    console.log('🔄 Restarting with fresh authentication...');
                    setTimeout(() => startBot(), 5000);
                }
            }
        });

        // Handle incoming messages
        sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.key.fromMe && m.type === 'notify') {
                const from = message.key.remoteJid;
                const messageText = message.message?.conversation || 
                                 message.message?.extendedTextMessage?.text || '';

                console.log(`📨 Message from ${from}: ${messageText}`);

                // Check if sender is owner or allow all users
                const senderNumber = from.replace('@s.whatsapp.net', '');
                const isOwner = ownerNumber && senderNumber === ownerNumber;
                
                console.log(`🔍 Comparing: sender="${senderNumber}" vs owner="${ownerNumber}"`);
                
                if (isOwner) {
                    console.log(`👑 Processing message from OWNER ${senderNumber}`);
                } else {
                    console.log(`✅ Processing message from user ${senderNumber}`);
                }

                // Bot commands
                const lower = messageText.toLowerCase().trim();

                // Basic responses
                if (lower === 'hello' || lower === 'hi') {
                    await sock.sendMessage(from, { text: '👋 Hello! WhatsApp bot is working perfectly!\n\nSend *.menu* to see all commands.' });
                    console.log(`✅ Replied "hello" to ${from}`);
                    return;
                }

                if (lower === '.alive' || lower === '.ping') {
                    await sock.sendMessage(from, { text: '🤖 Bot is alive and working!\n✅ All systems operational!' });
                    console.log(`✅ Replied "alive" to ${from}`);
                    return;
                }

                if (lower === '.menu' || lower === '.help') {
                    const isOwner = ownerNumber && senderNumber === ownerNumber;
                    const accessType = isOwner ? `👑 *Owner Access*` : `🌐 *Public Access*`;
                    
                    const menu = `🤖 *WHATSAPP BOT*
${accessType}

📋 *Available Commands:*

👋 *hello* - Greet the bot
🤖 *.alive* - Check bot status
🏓 *.ping* - Ping the bot
📋 *.menu* - Show this menu

✨ Bot is working perfectly!
${isOwner ? '👑 You are the bot owner!' : '🌟 Welcome! This bot is public!'}`;

                    await sock.sendMessage(from, { text: menu });
                    console.log(`✅ Sent ${isOwner ? 'OWNER' : 'USER'} menu to ${from}`);
                    return;
                }

                

                // Owner-only commands (check before unrecognized commands)
                if (ownerNumber && senderNumber === ownerNumber) {
                    if (lower === '.owner' || lower === '.admin') {
                        await sock.sendMessage(from, { 
                            text: `👑 *OWNER PANEL*\n\n✅ You are verified as the bot owner!\n📱 Your number: ${senderNumber}\n🤖 Bot status: Active\n🔧 Available owner commands:\n\n🔧 *.owner* - Show this panel\n🔧 *.admin* - Same as .owner\n\n✨ More owner features coming soon!` 
                        });
                        console.log(`✅ Sent owner panel to ${from}`);
                        return;
                    }
                }

                // Default response for unrecognized commands
                if (lower.startsWith('.')) {
                    await sock.sendMessage(from, { 
                        text: `❓ Unknown command: "${lower}"\n\nSend *.menu* to see all available commands.` 
                    });
                    return;
                }

                // Auto-response for any other message
                if (messageText.trim()) {
                    const isOwner = ownerNumber && senderNumber === ownerNumber;
                    const greeting = isOwner ? 
                        `👑 Hi Owner! I received your message: "${messageText}"\n\nSend *.menu* or *.owner* to see what I can do!` :
                        `👋 Hi! I received your message: "${messageText}"\n\nSend *.menu* to see what I can do!`;
                        
                    await sock.sendMessage(from, { text: greeting });
                    console.log(`✅ Auto-replied to ${isOwner ? 'OWNER' : 'USER'} ${from}`);
                }
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        setTimeout(() => startBot(), 5000);
    }
}

// Start web server only once
let serverStarted = false;
if (!serverStarted) {
    require('./server.js');
    serverStarted = true;
}

console.log('🎯 WhatsApp Bot Starting...');
console.log('📱 Scan the QR code to connect your WhatsApp!');

startBot();
