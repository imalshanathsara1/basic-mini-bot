const { default: makeWASocket, useSingleFileAuthState, DisconnectReason} = require('@adiwajshing/baileys');
const { Boom} = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Use local auth.json for Glitch
const { state, saveState} = useSingleFileAuthState('./auth.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
});

    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async ({ messages}) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const sender = msg.key.remoteJid;

        if (text.startsWith('.')) {
            const [cmd,...args] = text.slice(1).split(' ');
            const commandPath = path.join(__dirname, 'commands', `${cmd}.js`);

            if (fs.existsSync(commandPath)) {
                const command = require(commandPath);
                await command.execute(sock, msg, args.join(' '));
} else {
                await sock.sendMessage(sender, { text: `❌ Unknown command:.${cmd}`});
}
}
});

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect} = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
}
});
}

startBot();

// ✅ Glitch requires a web server on port 3000
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain'});
    res.end('🤖 WhatsApp Bot is running on Glitch!');
}).listen(3000, () => {
    console.log('🌐 HTTP server running on port 3000 (for Glitch)');
});
