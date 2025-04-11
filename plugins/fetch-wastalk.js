const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "wastalk",
    desc: "Fetch WhatsApp channel info using a given URL",
    category: "search",
    react: "🛰️",
    filename: __filename
}, 
async (conn, mek, m, { args, from, reply }) => {
    try {
        if (!args[0]) return reply("Please provide a WhatsApp Channel link.\n\nExample:\n.wastalk <channel_link>");

        const url = `https://apis-keith.vercel.app/stalker/wachannel?url=${encodeURIComponent(args[0])}`;
        const res = await axios.get(url);

        if (!res.data.status) return reply("Failed to fetch channel data.");

        const { title, followers, description, img } = res.data.result;

        const caption = `╭━━〔 *WhatsApp Channel Info* 〕━━┈⊷
┃◈ *📢 Title:* ${title}
┃◈ *👥 Followers:* ${followers}
┃◈ *📝 Description:*
┃◈ ${description.replace(/\*/g, '')}
╰━━━━━━━━━━━━━━━⊷`;

        await conn.sendMessage(from, {
            image: { url: img },
            caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363354023106228@newsletter',
                    newsletterName: 'JawadTechX',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("Error in wastalk command:", err);
        reply("An error occurred while fetching channel data.");
    }
});
