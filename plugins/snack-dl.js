const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "snackvideo",
    alias: ["snack", "snackdl", "snackvid"],
    desc: "Download SnackVideo without watermark",
    category: "downloader",
    react: '🥤',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("*Please provide a SnackVideo link.*");
        if (!q.includes("snackvideo.com")) return reply("*Invalid SnackVideo link*");

        reply("⏳ *Fetching video...*");

        const { data } = await axios.get("https://api.giftedtech.web.id/api/download/snackdl", {
            params: { apikey: "gifted", url: q }
        });

        if (!data.success || !data.result) {
            return reply("*Failed to download video. Try again later.*");
        }

        const { title, media, author, like, comment, share } = data.result;

        await conn.sendMessage(from, {
            video: { url: media },
            mimetype: "video/mp4",
            caption: `*🍿 Snack Video Downloader*\n\n` +
                     `*🎬 Title:* ${title}\n` +
                     `*👤 Creator:* ${author}\n` +
                     `*❤️ Likes:* ${like}\n` +
                     `*💬 Comments:* ${comment}\n` +
                     `*🔄 Shares:* ${share}\n\n` +
                     `_*© Powered by KHAN MD v-4*_`
        }, { quoted: mek });

    } catch (error) {
        console.error("Error:", error);
        reply("*🚫 Failed to process video*");
    }
});
