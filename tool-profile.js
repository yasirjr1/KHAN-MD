const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get user information",
    category: "utility",
    use: '.person [@tag or reply]',
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply, quoted }) => {
    try {
        // Default to sender if no reply/quoted message
        let userJid = sender;
        
        // If message is a reply or has tagged user
        if (quoted) {
            userJid = quoted.sender;
        } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        // Get user details
        const user = await conn.onWhatsApp(userJid);
        if (!user || !user[0]?.exists) return reply("❌ User not found on WhatsApp");
        
        // Get profile picture
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }
        
        // Get status (bio)
        let status = "Not set";
        try {
            const statusObj = await conn.fetchStatus(userJid);
            if (statusObj.status) status = statusObj.status;
        } catch (e) {}
        
        // Get user name
        const contact = await conn.contactDB.get(userJid);
        const username = contact?.name || userJid.split('@')[0];
        
        // Check if user is banned (you can add your own logic here)
        const isBanned = false; // Replace with your ban check logic
        
        // Check if user is admin in current group
        let isAdmin = false;
        if (isGroup) {
            const groupData = await conn.groupMetadata(from);
            isAdmin = groupData.participants.find(p => p.id === userJid)?.admin || false;
        }
        
        // Format the information
        const userInfo = `
*👤 USER INFORMATION*

*• Name:* ${username}
*• JID:* ${userJid}
*• Bio:* ${status}
*• Verified:* ${user[0]?.isBusiness ? '✅ Business' : user[0]?.isEnterprise ? '✅ Enterprise' : '❌ No'}
*• Banned:* ${isBanned ? '✅ Yes' : '❌ No'}
*• Admin:* ${isAdmin ? '✅ Yes' : isGroup ? '❌ No' : 'N/A'}

*📱 WhatsApp Info*
*• Registered:* ${user[0]?.isUser ? '✅ Yes' : '❌ No'}
*• Business:* ${user[0]?.isBusiness ? '✅ Yes' : '❌ No'}
*• Enterprise:* ${user[0]?.isEnterprise ? '✅ Yes' : '❌ No'}
`;

        // Send the information with profile picture
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: userInfo,
            mentions: [userJid]
        }, { quoted: mek });
        
    } catch (e) {
        console.error(e);
        reply(`❌ Error fetching user information: ${e.message}`);
    }
});
