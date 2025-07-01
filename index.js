const { Client, MessageMedia} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const ffmpeg = require('ffmpeg-static');
const { exec} = require('child_process');
const fs = require('fs');
const path = require('path');

// 🟢 WhatsApp client (no session saving)
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
}
});

// 📸 Show QR code in terminal
client.on('qr', (qr) => {
  console.log('📱 Scan this QR code to connect WhatsApp:');
  qrcode.generate(qr, { small: true});
});

// ✅ Connected
client.on('ready', () => {
  console.log('✅ WhatsApp bot connected!');
});

// 🎵.song command
client.on('message', async (message) => {
  const msg = message.body.toLowerCase();

  if (msg.startsWith('.song ')) {
    const query = msg.replace('.song ', '');
    const results = await ytSearch(query + ' sinhala song');

    if (!results.videos.length) {
      return message.reply('😢 සින්දුවක් හමු නොවුණා.');
}

    const video = results.videos[0];
    const title = video.title.replace(/[^\w\s]/gi, '');
    const url = video.url;
    const output = `${title}.mp3`;
    const filePath = path.join(__dirname, output);

    message.reply(`⬇️ "${title}" download වෙමින් පවතී...`);

    const stream = ytdl(url, { filter: 'audioonly'});
    const ffmpegCmd = `${ffmpeg} -i pipe:0 -vn -acodec libmp3lame -ab 128k "${filePath}"`;
    const ffmpegProcess = exec(ffmpegCmd);

    stream.pipe(ffmpegProcess.stdin);

    ffmpegProcess.on('close', async () => {
      try {
        const media = MessageMedia.fromFilePath(filePath);
        await message.reply(media, { caption: `🎵 ${title}`});
        fs.unlinkSync(filePath);
} catch (err) {
        console.error('❌ File send error:', err);
        await message.reply('😓 සින්දුව යවන්න බැරි වුණා.');
}
});
}
});
client.initialize();
