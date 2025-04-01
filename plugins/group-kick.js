const { cmd } = require('../command');

cmd({
    pattern: "kick",
    alias: ["k", "remove", "out", "dafa"],
    desc: "Removes a member from the group",
    category: "admin",
    react: "❌",
    filename: __filename
},
async (conn, m, { reply, q, isGroup, isAdmins, isOwner, isBotAdmins }) => {
    // Check if the command is used in a group
    if (!isGroup) return reply("❌ This command can only be used in groups.");

    // Check if the user is an admin or the owner
    if (!isAdmins && !isOwner) return reply("❌ Only group admins or the owner can use this command.");

    // Check if the bot is an admin
    if (!isBotAdmins) return reply("❌ I need to be an admin to kick members.");

    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0]; // If replying to a message, get the sender's number
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, ''); // If manually typing a number
    } else {
        return reply("❌ Please reply to a message or provide a number to remove.");
    }

    // Prevent kicking the bot itself
    const botNumber = conn.user.id.split(":")[0];
    if (number === botNumber) return reply("❌ The bot cannot kick itself.");

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(m.chat, [jid], "remove");
        reply(`✅ Successfully removed @${number}`, { mentions: [jid] });
    } catch (error) {
        console.error("Kick command error:", error);
        reply("❌ Failed to remove the member.");
    }
});
