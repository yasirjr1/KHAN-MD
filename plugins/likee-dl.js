const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "likee",
    alias: ["lkdl", "likee-dl"],
    desc: "Download Likee videos without watermark",
    react: '🎥',
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.startsWith("http")) {
            return reply("❌ Please provide a valid Likee link.");
        }

        // Show loading indicator
        await conn.sendMessage(from, {
            react: {
                text: '⏳',
                key: mek.key
            }
        });

        const response = await axios.get(`https://bk9.fun/download/likee?url=${encodeURIComponent(q)}`);
        const data = response.data;

        if (!data || data.status !== true || !data.BK9) {
            return reply("⚠️ Failed to fetch Likee content. Please check the link and try again.");
        }

        const videoUrl = data.BK9.withoutwatermark;

        // Send the downloaded video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: `📥 *Likee Video Downloaded*\n\n` +
                     `🎥 *Title:* ${data.BK9.title}\n\n` +
                     `_© Powered by Jawad Tech X_`
        }, { quoted: mek });

    } catch (error) {
        console.error("Error:", error);
        reply("❌ An error occurred while processing your request. Please try again.");
    }
});
