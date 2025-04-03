const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get complete user information",
    category: "utility",
    use: '.person [@tag or reply]',
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply, quoted }) => {
    try {
        // Determine target user JID - FIXED REPLY HANDLING
        let userJid = quoted ? quoted.sender : sender;
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        // Verify user exists - FIXED UNDEFINED CHECK
        const userCheck = await conn.onWhatsApp(userJid).catch(() => []);
        if (!userCheck || !userCheck[0]?.exists) {
            return reply("❌ User not found on WhatsApp");
        }
        const user = userCheck[0];

        // Get profile picture
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // FIXED NAME FETCHING - MULTI-SOURCE
        let userName = userJid.split('@')[0];
        try {
            // Try contactDB first
            const contact = await conn.contactDB?.get(userJid);
            if (contact?.name) {
                userName = contact.name;
            } else {
                // Try presence API
                const presence = await conn.presenceSubscribe(userJid);
                if (presence?.pushname) userName = presence.pushname;
            }
        } catch (e) {
            console.log("Name fetch error:", e);
        }

        // FIXED BIO FETCHING - PROPER HANDLING
        let bio = "No bio set";
        try {
            const statusData = await conn.fetchStatus(userJid);
            if (statusData?.status) {
                bio = statusData.status;
                if (statusData.setAt) {
                    bio += `\n⌚ Last updated: ${new Date(statusData.setAt * 1000).toLocaleString()}`;
                }
            }
        } catch (e) {
            console.log("Bio fetch error:", e);
            // Additional fallback for public bios
            try {
                const profile = await conn.getBusinessProfile(userJid);
                if (profile?.description) bio = profile.description;
            } catch {}
        }

        // Get group role if in group
        let groupRole = "";
        if (isGroup) {
            try {
                const groupData = await conn.groupMetadata(from);
                const participant = groupData.participants.find(p => p.id === userJid);
                if (participant) {
                    groupRole = participant.admin ? "👑 Admin" : "👥 Member";
                }
            } catch (e) {
                console.log("Group role error:", e);
            }
        }

        // Format the output
        const userInfo = `
*GC MEMBER INFORMATION 🧊*

📛 *Name:* ${userName}
🔢 *Number:* ${userJid.replace(/@.+/, '')}
📌 *Type:* ${user.isBusiness ? "💼 Business" : user.isEnterprise ? "🏢 Enterprise" : "👤 Personal"}

*📝 Bio:*
${bio}

*⚙️ Account Info:*
✅ Registered: ${user.isUser ? "Yes" : "No"}
🛡️ Verified: ${user.verifiedName ? "Yes" : "No"}
${groupRole ? `👥 Role: ${groupRole}` : ''}
`.trim();

        // Send response
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: userInfo,
            mentions: [userJid]
        }, { quoted: mek });

    } catch (e) {
        console.error("Person command error:", e);
        reply(`❌ Error: ${e.message || "Failed to fetch info"}`);
    }
});
