const { cmd } = require('../command');

cmd({
    pattern: "add",
    desc: "Adds a member to the group",
    category: "owner",
    react: "➕",
    filename: __filename
},
async (conn, m, { reply, q, react, isGroup }) => {
    // Check if the command is used in a group
    if (!isGroup) {
        await react("❌");
        return reply("❌ This command can only be used in groups.");
    }

    // Get the bot owner's number dynamically
    const botOwner = conn.user.id.split(":")[0];
    const senderNumber = m.sender.split("@")[0];

    // Restrict command usage to the bot owner only
    if (senderNumber !== botOwner) {
        await react("❌");
        return reply("❌ Only the bot owner can use this command.");
    }

    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0]; // If replying to a message, get the sender's number
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, ''); // If manually typing a number
    } else {
        await react("❌");
        return reply("❌ Please reply to a message or provide a number to add.");
    }

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(m.chat, [jid], "add");
        await react("✅");
        reply(`Successfully added @${number}`, { mentions: [jid] });
    } catch (error) {
        console.error("Add command error:", error);
        await react("❌");
        reply("❌ Failed to add the member.");
    }
});
