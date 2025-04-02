const converter = require('../data/converter');
const { cmd } = require('../command');

cmd({
    pattern: 'tomp3',
    desc: 'Convert media to audio',
    category: 'audio',
    react: '🎵',
    filename: __filename
}, async (client, match, message, { from }) => {
    try {
        if (!match.quoted) {
            return await client.sendMessage(from, {
                text: "*🔊 Reply to a video/audio message to convert*"
            }, { quoted: message });
        }

        const mtype = match.quoted.mtype;
        if (!['videoMessage', 'audioMessage'].includes(mtype)) {
            return await client.sendMessage(from, {
                text: "❌ Only video/audio messages can be converted"
            }, { quoted: message });
        }

        if (match.quoted.seconds > 300) {
            return await client.sendMessage(from, {
                text: "⏱️ Media too long (max 5 minutes)"
            }, { quoted: message });
        }

        const processingMsg = await client.sendMessage(from, {
            text: "🔄 Converting to audio..."
        }, { quoted: message });

        try {
            const buffer = await match.quoted.download();
            if (!buffer || buffer.length < 1024) {
                throw new Error('Invalid media file');
            }

            const ext = mtype === 'videoMessage' ? 'mp4' : 'm4a';
            const audio = await converter.toAudio(buffer, ext);

            await client.sendMessage(from, {
                audio: audio,
                mimetype: 'audio/mpeg',
                fileName: 'converted.mp3'
            }, { quoted: message });

        } catch (e) {
            console.error('Conversion error:', e);
            await client.sendMessage(from, {
                text: `❌ Failed to convert:\n${e.message}`
            }, { quoted: message });
        } finally {
            await processingMsg.delete().catch(() => {});
        }
    } catch (e) {
        console.error('Command error:', e);
        await client.sendMessage(from, {
            text: "⚠️ An unexpected error occurred"
        }, { quoted: message });
    }
});

cmd({
    pattern: 'toptt',
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (client, match, message, { from }) => {
    try {
        if (!match.quoted) {
            return await client.sendMessage(from, {
                text: "*🗣️ Reply to a video/audio message to convert to voice*"
            }, { quoted: message });
        }

        const mtype = match.quoted.mtype;
        if (!['videoMessage', 'audioMessage'].includes(mtype)) {
            return await client.sendMessage(from, {
                text: "❌ Only video/audio messages can be converted"
            }, { quoted: message });
        }

        if (match.quoted.seconds > 60) {
            return await client.sendMessage(from, {
                text: "⏱️ Media too long for voice (max 1 minute)"
            }, { quoted: message });
        }

        const processingMsg = await client.sendMessage(from, {
            text: "🔄 Converting to voice message..."
        }, { quoted: message });

        try {
            const buffer = await match.quoted.download();
            if (!buffer || buffer.length < 1024) {
                throw new Error('Invalid media file');
            }

            const ext = mtype === 'videoMessage' ? 'mp4' : 'm4a';
            const ptt = await converter.toPTT(buffer, ext);

            await client.sendMessage(from, {
                audio: ptt,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: message });

        } catch (e) {
            console.error('PTT Conversion error:', e);
            await client.sendMessage(from, {
                text: `❌ Failed to create voice message:\n${e.message}`
            }, { quoted: message });
        } finally {
            await processingMsg.delete().catch(() => {});
        }
    } catch (e) {
        console.error('PTT Command error:', e);
        await client.sendMessage(from, {
            text: "⚠️ An error occurred while processing voice message"
        }, { quoted: message });
    }
});
