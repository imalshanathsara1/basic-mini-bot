const { default: makeWASocket, useSingleFileAuthState, DisconnectReason} = require('@adiwajshing/baileys');
const { Boom} = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const http = require('http'); // Dummy server for Fly.io

// Use persistent path if running on Fly.io
const AUTH_PATH = process.env.FLY_APP_NAME? '/app/auth/auth.json': './auth.json';
const { state, saveState} = useSingleFileAuthState(AUTH_PATH);

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
