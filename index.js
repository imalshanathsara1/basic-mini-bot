js
import makeWASocket, {
  useSingleFileAuthState,
  DisconnectReason
} from '@whiskeysockets/baileys';
import { Boom} from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import yts from 'yt-search';
import { fileURLToPath} from 'url';
import { dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { state, saveState} = useSingleFileAuthState('./auth_info.json');

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
});

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect} = update;
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;

      console.log('🔁 Connection closed. Reconnecting:', shouldReconnect);

      if (shouldReconnect) {
        startBot();
}
} else if (connection === 'open') {
      console.log('✅ WhatsApp Bot Connected!');
}
});

  sock.ev.on('messages.upsert', async ({ messages}) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const sender = msg.key.remoteJid;

    if (text === 'hi') {
      await sock.sendMessage(sender, { text: 'Hello! I am your bot 🤖'});
}

    if (text?.startsWith('.song ')) {
      const query = text.replace('.song ', '').trim();
      let videoUrl = '';

      if (ytdl.validateURL(query)) {
        videoUrl = query;
} else {
        const searchResult = await yts(query);
        if (!searchResult.videos.length) {
          await sock.sendMessage(sender, { text: '❌ Song not found on YouTube'});
          return;
}
        videoUrl = searchResult.videos[0].url;
}

      const info = await ytdl.getInfo(videoUrl);
      const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
      const filePath = path.resolve(__dirname, `${title}.mp3`);

      await sock.sendMessage(sender, { text: `🎵 Downloading: ${title}`});

      const stream = ytdl(videoUrl, { filter: 'audioonly'});
      ffmpeg(stream)
.audioBitrate(128)
.save(filePath)
.on('end', async () => {
          const audio = fs.readFileSync(filePath);
          await sock.sendMessage(sender, {
            audio: audio,
            mimetype: 'audio/mp4',
            ptt: false
});
          fs.unlinkSync(filePath);
});
}
});
}

startBot();
