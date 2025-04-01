const { cmd } = require('../command');

cmd({
    pattern: "add",
    alias: ["a", "invite"],
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
    
    // Check if the user is the bot owner
    if (m.sender.split("@")[0] !== botOwner) {
        await react("❌");
        return reply("❌ Only the bot owner can use this command.");
    }

    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0]; // If replying to a message, get the sender's number
    } else if (q && q.match(/^\d{10,15}$/)) {
        number = q; // If manually typing a number
    } else {
        await react("❌");
        return reply("❌ Please reply to a message or provide a valid number.");
    }

    // Prevent adding the bot itself
    const botNumber = conn.user.id.split(":")[0];
    if (number === botNumber) {
        await react("❌");
        return reply("❌ The bot cannot add itself.");
    }

    const userToAdd = `${number}@s.whatsapp.net`;

    try {
        await conn.groupParticipantsUpdate(m.chat, [userToAdd], "add");
        await react("✅");
        reply(`✅ Successfully added @${number} to the group.`, { mentions: [userToAdd] });
    } catch (error) {
        console.error("Add command error:", error);
        await react("❌");
        reply("❌ Failed to add the member. Make sure the number is valid and not restricted from being added.");
    }
});
