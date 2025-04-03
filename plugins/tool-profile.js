const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get complete user information including name and bio",
    category: "utility",
    use: '.person [@tag or reply]',
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply, quoted }) => {
    try {
        // Determine target user JID
        let userJid = sender;
        if (quoted) userJid = quoted.sender;
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        // Verify user exists on WhatsApp
        const [user] = await conn.onWhatsApp(userJid) || [];
        if (!user?.exists) return reply("❌ User not found on WhatsApp");

        // Get profile picture with fallback
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // [NEW] Get proper formatted name with multiple fallbacks
        let userName = "Unknown";
        try {
            // 1. Try contactDB first
            const contact = await conn.contactDB?.get(userJid);
            if (contact?.name) {
                userName = contact.name;
            } else {
                // 2. Try getting pushname from presence
                const presence = await conn.presenceSubscribe(userJid);
                if (presence?.pushname) {
                    userName = presence.pushname;
                } else {
                    // 3. Fallback to JID
                    userName = userJid.split('@')[0];
                }
            }
        } catch (nameError) {
            console.log("Name fetch error:", nameError);
            userName = userJid.split('@')[0]; // Final fallback
        }

        // Get user bio/status
        let bio = "No Bio Founded";
        let bioTimestamp = "";
        try {
            const statusData = await conn.fetchStatus(userJid);
            if (statusData?.status) {
                bio = statusData.status;
                if (statusData.setAt) {
                    const bioDate = new Date(statusData.setAt * 1000);
                    bioTimestamp = `\n⌚ Last updated: ${bioDate.toLocaleString()}`;
                }
            }
        } catch (bioError) {
            console.log("Bio fetch error:", bioError);
        }

        // Check group admin status if in group
        let groupRole = "";
        if (isGroup) {
            try {
                const groupData = await conn.groupMetadata(from);
                const participant = groupData.participants.find(p => p.id === userJid);
                groupRole = participant?.admin ? "👑 Admin" : "👥 Member";
            } catch (groupError) {
                console.log("Group data error:", groupError);
            }
        }

        // Format the information
        const userInfo = `
*👤 PROFILE INFORMATION MEMBER*

📛 *Name:* ${userName}
🔢 *Number:* ${userJid.replace(/@.+/, '')}
📌 *Account Type:* ${user.isBusiness ? "💼 Business" : user.isEnterprise ? "🏢 Enterprise" : "👤 Personal"}

📝 *Bio:*
${bio}${bioTimestamp}

*📱 WhatsApp Info*
✅ *Registered:* ${user.isUser ? "Yes" : "No"}
🛡️ *Verified:* ${user.verifiedName ? "✅ Verified" : "❌ Not verified"}
${groupRole ? `👥 *Group Role:* ${groupRole}` : ''}

🌐 *Status:* ${user.isOnline ? "🟢 Online" : "🔴 Offline"}
`.trim();

        // Send the information with profile picture
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: userInfo,
            mentions: [userJid]
        }, { quoted: mek });

    } catch (e) {
        console.error("Person command error:", e);
        reply(`❌ Error: ${e.message || "Failed to fetch user information"}`);
    }
});
