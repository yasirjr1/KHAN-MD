const { cmd } = require('../command');

cmd({
    pattern: "promote",
    alias: ["p", "admin", "makeadmin"],
    desc: "Promotes a member to group admin",
    category: "admin",
    react: "⬆️",
    filename: __filename
},
async (conn, m, { reply, q, react, isGroup, isAdmin }) => {
    // Check if the command is used in a group
    if (!isGroup) {
        await react("❌");
        return reply("❌ This command can only be used in groups.");
    }

    // Check if the user is an admin
    if (!isAdmin) {
        await react("❌");
        return reply("❌ Only group admins can use this command.");
    }

    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0]; // If replying to a message, get the sender's number
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, ''); // If manually typing a number
    } else {
        await react("❌");
        return reply("❌ Please reply to a message or provide a number to promote.");
    }

    // Prevent promoting the bot itself
    const botNumber = conn.user.id.split(":")[0];
    if (number === botNumber) {
        await react("❌");
        return reply("❌ The bot cannot promote itself.");
    }

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(m.chat, [jid], "promote");
        await react("✅");
        reply(`Successfully promoted @${number} to admin.`, { mentions: [jid] });
    } catch (error) {
        console.error("Promote command error:", error);
        await react("❌");
        reply("❌ Failed to promote the member.");
    }
});

