const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');

cmd({
    pattern: "yt3",
    alias: ["play3", "music"],
    react: "🎵",
    desc: "Download audio from YouTube",
    category: "download",
    use: ".song <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a song name or YouTube URL!");

        let videoUrl, title;
        
        // Check if it's a URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
            title = videoInfo.title;
        } else {
            // Search YouTube
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
        }

        await reply("⏳ Downloading audio...");

        // Use API to get audio
        const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) return await reply("❌ Failed to download audio!");

        await conn.sendMessage(from, {
            audio: { url: data.result.download_url },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });

        await reply(`✅ *${title}* downloaded successfully!`);

    } catch (error) {
        console.error(error);
        await reply(`❌ Error: ${error.message}`);
    }
});

cmd({
    pattern: "play2",
    alias: ["ytplay", "songx"],
    react: "🎧",
    desc: "Play audio from YouTube",
    category: "download",
    use: ".play2 <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a song name or YouTube URL!");

        let videoId, title, thumbnail;
        
        // Check if it's a URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            // Extract video ID from URL
            videoId = q.split(/[=/]/).pop().split(/[?&]/)[0];
            const videoInfo = await yts({ videoId });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found!");
            videoId = search.videos[0].videoId;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply("⏳ Processing your request...");

        // Send thumbnail first
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: `*${title}*\n\nDownloading audio...`
        }, { quoted: mek });

        // Get audio with better error handling
        const apiUrl = `https://api.davidcyriltech.my.id/youtube/mp3?url=https://youtu.be/${videoId}`;
        
        try {
            const response = await fetch(apiUrl);
            
            // First check if response is OK
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            
            // Try to parse as JSON
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                const textResponse = await response.text();
                throw new Error(`Invalid JSON response: ${textResponse}`);
            }

            if (!data.success) {
                throw new Error(data.message || "Failed to download audio");
            }

            await conn.sendMessage(from, {
                audio: { url: data.result.downloadUrl },
                mimetype: 'audio/mpeg'
            }, { quoted: mek });

            await reply(`✅ *${title}* is ready to play!`);

        } catch (apiError) {
            console.error('API Error:', apiError);
            await reply(`❌ API Error: ${apiError.message}`);
        }

    } catch (error) {
        console.error('Command Error:', error);
        await reply(`❌ Error: ${error.message}`);
    }
});
