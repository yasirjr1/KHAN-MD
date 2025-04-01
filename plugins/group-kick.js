const config = require('../config');
const { cmd } = require('../command');

cmd({
  pattern: "kick",
  alias: ["k", "out", "getout", "remove", "hush", "dafa"],
  desc: "Removes a participant by replying to or mentioning their message. (Admins can also be kicked)",
  react: "🚪",
  category: "group",
  filename: __filename,
}, async (conn, mek, m, {
    from,
    quoted,
    isGroup,
    isAdmins,
    isOwner,
    participants,
    isBotAdmins,
    reply
}) => {
    try {
        // Check if the command is used in a group
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        // Only admins or the owner can use this command
        if (!isAdmins && !isOwner) return reply("❌ Only group admins or the owner can use this command.");
        // Check if the bot has admin privileges
        if (!isBotAdmins) return reply("❌ I need admin privileges to remove group members.");
        
        // Determine the target user using reply or mention
        let target;
        if (m.quoted) {
            target = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
        } else if (m.msg && m.msg.contextInfo && m.msg.contextInfo.mentionedJid && m.msg.contextInfo.mentionedJid.length > 0) {
            target = m.msg.contextInfo.mentionedJid[0];
        }
        
        if (!target) {
            return reply("❌ Please mention or reply to the message of the participant to remove.");
        }
        
        // Remove the participant from the group (admins can also be kicked)
        await conn.groupParticipantsUpdate(from, [target], "remove")
          .catch(err => {
              console.error(`⚠️ Failed to remove ${target}:`, err);
              return reply("❌ An error occurred while trying to remove the participant.");
          });
        
        // Extraire le tag à partir du JID (ex: "1234567890" sans "@s.whatsapp.net")
        const tag = target.split('@')[0];
        reply(`*@${tag} kicked Successfully*`, { mentions: [target] });
    } catch (error) {
        console.error('Error while executing kick:', error);
        reply('❌ An error occurred while executing the command.');
    }
});        await react("❌");
        return reply("❌ The bot cannot kick itself.");
    }

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(m.chat, [jid], "remove");
        await react("✅");
        reply(`Successfully removed @${number}`, { mentions: [jid] });
    } catch (error) {
        console.error("Kick command error:", error);
        await react("❌");
        reply("❌ Failed to remove the member.");
    }
});
