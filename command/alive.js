const axios = require('axios');
const moment = require('moment');

exports.execute = async (sock, msg) => {
    const sender = msg.key.remoteJid;
    const currentTime = moment().format('MMMM Do YYYY, h:mm A');
    const imageUrl = 'https://yourdomain.com/bot-alive.jpg'; // Replace with your image

    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer'});
        const imageBuffer = Buffer.from(response.data, 'binary');

        await sock.sendMessage(sender, {
            image: imageBuffer,
            caption: `
✅ Bot Status: ONLINE

🧠 System: Operational
📡 Connection: Stable
🔋 Power: 100%
🕒 Time: ${currentTime}
👑 Identity: Lord of Crime

Select an option below 👇
            `.trim(),
            footer: '🤖 WhatsApp Bot by Lord of Crime',
            buttons: [
                { buttonId: '.menu', buttonText: { displayText: '📋 Menu'}, type: 1},
                { buttonId: '.ping', buttonText: { displayText: '🏓 Ping'}, type: 1},
                { buttonId: '.song Believer', buttonText: { displayText: '🎵 Song'}, type: 1}
            ],
            headerType: 4
});
} catch (err) { await sock.sendMessage(sender, { text: '✅ Bot is alive, but image failed to load.'});
}
};
