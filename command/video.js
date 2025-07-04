const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

exports.execute = async (sock, msg, query) => {
    const sender = msg.key.remoteJid;

    if (!query) {
        await sock.sendMessage(sender, { text: '🎬 Please provide a video name.\nExample: `.video Despacito`'});
        return;
}

    await sock.sendMessage(sender, { text: `🔍 Searching for "${query}"...`});

    try {
        const result = await yts(query);
        const video = result.videos[0];
        if (!video) return sock.sendMessage(sender, { text: '❌ Video not found.'});

        const stream = ytdl(video.url, { quality: '18'}); // 360p MP4
        const filePath = path.resolve(__dirname, `../temp_${Date.now()}.mp4`);
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream);

        writeStream.on('finish', async () => {
            const videoBuffer = fs.readFileSync(filePath);
            await sock.sendMessage(sender, {
                video: videoBuffer,
                caption: `🎬 *${video.title}*`
});
            fs.unlinkSync(filePath);
});

} catch (err) {
        console.error('🎬 Video error:', err);
        await sock.sendMessage(sender, { text: '⚠️ Error downloading the video.'});
}
};
