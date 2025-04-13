const { cmd } = require('../command');

cmd({
    pattern: "clear",
    alias: ["c", "deletechat"],
    desc: "Clear all messages in this chat",
    category: "owner",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ Owner-only command!");

        const chatType = isGroup ? "Group" : "Chat";
        
        // ✅ Correct Baileys method
        await conn.chatModify({ delete: true }, from);
        
        await reply(`✅ ${chatType} cleared successfully!`);

    } catch (e) {
        console.error("Clear Error:", e);
        reply(`❌ Failed to clear: ${e.message}`);
    }
});
