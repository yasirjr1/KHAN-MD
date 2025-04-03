const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get complete user information including bio",
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

        // Get user bio/status with improved error handling
        let bio = "No bio set";
        try {
            const statusData = await conn.fetchStatus(userJid);
            if (statusData?.status) {
                bio = statusData.status;
                // Add timestamp if available
                if (statusData.setAt) {
                    const bioDate = new Date(statusData.setAt * 1000);
                    bio += `\n\n*Last updated:* ${bioDate.toLocaleString()}`;
                }
            }
        } catch (bioError) {
            console.log("Bio fetch error:", bioError);
        }

        // Get user name with contactDB fallback
        let username = userJid.split('@')[0];
        try {
            const contact = await conn.contactDB?.get(userJid);
            if (contact?.name) username = contact.name;
        } catch (contactError) {
            console.log("Contact fetch error:", contactError);
        }

        // Check group admin status if in group
        let groupRole = "N/A";
        if (isGroup) {
            try {
                const groupData = await conn.groupMetadata(from);
                const participant = groupData.participants.find(p => p.id === userJid);
                if (participant) {
                    groupRole = participant.admin ? "Admin" : "Member";
                }
            } catch (groupError) {
                console.log("Group data error:", groupError);
            }
        }

        // Format the information
        const userInfo = `
*👤 USER PROFILE*

*• Name:* ${username}
*• JID:* ${userJid.replace(/@.+/, '')}
*• Account Type:* ${user.isBusiness ? "Business" : user.isEnterprise ? "Enterprise" : "Personal"}

*📝 Bio:*
${bio}

*📱 WhatsApp Info*
*• Registered:* ${user.isUser ? "Yes" : "No"}
*• Group Role:* ${groupRole}
*• Verified:* ${user.verifiedName ? "✅ Verified" : "❌ Not verified"}

*🕒 Last Seen:* ${user.isOnline ? "Online now" : "Offline"}
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
