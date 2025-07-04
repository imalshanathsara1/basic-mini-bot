const axios = require('axios');
const moment = require('moment');

exports.execute = async (sock, msg) => {
    const sender = msg.key.remoteJid;
    const currentTime = moment().format('MMMM Do YYYY, h:mm A');
    const imageUrl = 'https://yourdomain.com/bot-menu.jpg'; // Replace with your image

    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer'});
        const imageBuffer = Buffer.from(response.data, 'binary');

        await sock.sendMessage(sender, {
            image: imageBuffer,
            caption: `
╭━━━〔 🤖 WHATSAPP BOT MENU 〕━━━╮
┃ 🕒 Time: ${currentTime}
┃
┃ 👋.hello       – Greet the bot
┃ 🤖.alive       – Check bot status
┃ 🏓.ping        – Ping the bot
┃ 📋.menu        – Show this menu
┃ 🎵.song [name] – Download a song
┃ 🎬.video [name] – Download a video
┃ 🎤.lyrics [name] – Get lyrics
┃ 🎙️.voice [name] – Voice note
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
✨ Bot is working perfectly!
🌟 Public access enabled
            `.trim()
});
} catch (err) {
        await sock.sendMessage(sender, { text: '📋 Menu failed to load image.'});
}
}
