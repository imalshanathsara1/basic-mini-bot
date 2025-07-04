const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

exports.execute = async (sock, msg, query) => {
    const sender = msg.key.remoteJid;

    if (!query) {
        await sock.sendMessage(sender, {
            text: '🎵 Please provide a song name.\n\nExample: `.song Shape of You`'
});
        return;
}

    await sock.sendMessage(sender, { text: `🔍 Searching for "${query}"...`});

    try {
        const result = await yts(query);
        const video = result.videos[0];

        if (!video) {
            await sock.sendMessage(sender, { text: '❌ Song not found.'});
            return;
}

        const stream = ytdl(video.url, { filter: 'audioonly'});
        const filePath = path.resolve(__dirname, `../temp_${Date.now()}.mp3`);
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream);

        writeStream.on('finish', async () => {
            const audio = fs.readFileSync(filePath);
            await sock.sendMessage(sender, {
                audio,
                mimetype: 'audio/mp4',
                ptt: false
});
            fs.unlinkSync(filePath);
});

        writeStream.on('error', async () => {
            await sock.sendMessage(sender, { text: '⚠️ Error writing audio file.'});
});

} catch (err) {
        console.error('🎵 Song error:', err);
        await sock.sendMessage(sender, { text: '⚠️ Error downloading the song.'});
}
};
