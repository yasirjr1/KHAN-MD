const { cmd } = require('../command');

cmd({
    pattern: "clear",
    alias: ["purge", "deletechat"],
    desc: "Clear all messages in current chat",
    category: "owner",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!isOwner) return reply("❌ This command is only for the owner!");

        const chatType = isGroup ? "Group" : "Chat";
        
        // Method 1: Preferred way in latest Baileys
        await conn.sendMessage(from, { delete: { all: true } });
        
        // Alternative method if above doesn't work
        // await conn.chatModify({ delete: true }, from);
        
        await reply(`✅ ${chatType} cleared successfully!`);

    } catch (e) {
        console.error("Clear Error:", e);
        reply(`❌ Failed to clear chat: ${e.message}\nNote: Some WhatsApp versions may restrict clearing old messages.`);
    }
});
