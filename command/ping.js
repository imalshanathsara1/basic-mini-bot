exports.execute = async (sock, msg) => {
    const sender = msg.key.remoteJid;
    const start = Date.now();

    // Send initial "Pinging..." message
    const sentMsg = await sock.sendMessage(sender, { text: '🏓 Pinging...'});

    const end = Date.now();
    const latency = end - start;

    // Edit the message with latency result
    await sock.sendMessage(sender, {
        text: `🏓 Pong! Response time: *${latency}ms*`,
        edit: sentMsg.key
});
};
