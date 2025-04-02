const { toAudio, toPTT } = require('../data/converter');
const { cmd } = require('../command');

cmd({
    pattern: 'tomp3',
    desc: 'Convert video to MP3 audio',
    category: 'audio',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        if (!m.quoted || m.quoted.mtype !== 'videoMessage') {
            return reply('Please reply to a video message to convert it to MP3');
        }
        
        const processingMsg = await reply('⏳ Converting to MP3... Please wait');
        
        try {
            const media = await m.quoted.download();
            const audio = await toAudio(media, 'mp4');
            
            await conn.sendMessage(
                m.from, 
                { 
                    document: audio, 
                    mimetype: 'audio/mpeg', 
                    fileName: 'converted.mp3' 
                }, 
                { quoted: m }
            );
            
            // Delete processing message after success
            await processingMsg.delete();
        } catch (e) {
            console.error('Conversion error:', e);
            await reply('❌ Failed to convert video to MP3. Please try again.');
            await processingMsg.delete();
        }
    } catch (e) {
        console.error('Command error:', e);
        reply('❌ An error occurred while processing your request');
    }
});

cmd({
    pattern: 'toptt',
    desc: 'Convert video to PTT audio',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        if (!m.quoted || m.quoted.mtype !== 'videoMessage') {
            return reply('Please reply to a video message to convert it to PTT');
        }
        
        const processingMsg = await reply('⏳ Converting to PTT... Please wait');
        
        try {
            const media = await m.quoted.download();
            const ptt = await toPTT(media, 'mp4');
            
            await conn.sendMessage(
                m.from, 
                { 
                    audio: ptt, 
                    mimetype: 'audio/ogg; codecs=opus', 
                    ptt: true 
                }, 
                { quoted: m }
            );
            
            // Delete processing message after success
            await processingMsg.delete();
        } catch (e) {
            console.error('Conversion error:', e);
            await reply('❌ Failed to convert video to PTT. Please try again.');
            await processingMsg.delete();
        }
    } catch (e) {
        console.error('Command error:', e);
        reply('❌ An error occurred while processing your request');
    }
});
