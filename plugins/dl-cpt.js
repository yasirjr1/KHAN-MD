const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "cpt",
    alias: ["capcut", "capcut-dl"],
    desc: "To download Capcut templates",
    react: '🎥',
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.startsWith("http")) {
            return reply("❌ Please provide a valid Capcut link.");
        }

        // Show loading indicator
        await conn.sendMessage(from, {
            react: {
                text: '⏳',
                key: mek.key
            }
        });

        const response = await axios.get(`https://api.diioffc.web.id/api/download/capcut?url=${encodeURIComponent(q)}`);
        const data = response.data;

        if (!data || data.status !== true || !data.result || !data.result.url) {
            return reply("⚠️ Failed to fetch Capcut content. Please check the link and try again.");
        }

        // Send the downloaded video
        await conn.sendMessage(from, {
            video: { url: data.result.url },
            mimetype: "video/mp4",
            caption: `📥 *Capcut Template Downloaded*\n` +
                     `🎥 *Title:* ${data.result.title}\n` +
                     `📏 *Size:* ${data.result.size}\n\n` +
                     `_© Powered by JawadTechX_`
        }, { quoted: mek });

    } catch (error) {
        console.error("Error:", error);
        reply("❌ An error occurred while processing your request. Please try again.");
    }
});
