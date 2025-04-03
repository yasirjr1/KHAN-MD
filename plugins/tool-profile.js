const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get complete user profile information",
    category: "utility",
    use: '.person [@tag or reply]',
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply, quoted, participants }) => {
    try {
        // 1. DETERMINE TARGET USER
        let userJid = quoted?.sender || 
                     mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     sender;

        // 2. VERIFY USER EXISTS
        const [user] = await conn.onWhatsApp(userJid).catch(() => []);
        if (!user?.exists) return reply("❌ User not registered on WhatsApp");

        // 3. GET PROFILE PICTURE (EXISTING LOGIC)
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // 4. OPTIMIZED NAME FETCHING WITH FALLBACKS
        let userName = userJid.split('@')[0]; // Default to number
        try {
            // Try conn.getName first
            userName = await conn.getName(userJid).catch(() => userName);
            
            // If still number, try presence
            if (userName === userJid.split('@')[0]) {
                const presence = await conn.presenceSubscribe(userJid).catch(() => null);
                userName = presence?.pushname || userName;
            }
            
            // If still number, try participant info in groups
            if (isGroup && userName === userJid.split('@')[0]) {
                const member = participants.find(p => p.id === userJid);
                userName = member?.notify || member?.name || userName;
            }
        } catch (e) {
            console.log("Name fetch error:", e);
        }

        // 5. OPTIMIZED ABOUT/BIO FETCHING
        let about = '';
        try {
            // Try fetchStatus first
            const statusData = await conn.fetchStatus(userJid).catch(() => null);
            about = statusData?.status || '';
            
            // If empty, try business profile
            if (!about && user.isBusiness) {
                const businessProfile = await conn.getBusinessProfile(userJid).catch(() => null);
                about = businessProfile?.description || '';
            }
        } catch (e) {
            console.log("About fetch error:", e);
        }

        // 6. GET GROUP ROLE (EXISTING LOGIC)
        let groupRole = "";
        if (isGroup) {
            const participant = participants.find(p => p.id === userJid);
            groupRole = participant?.admin ? "👑 Admin" : "👥 Member";
        }

        // 7. FORMAT THE OUTPUT
        const userInfo = `
*GC MEMBER INFORMATION 🧊*

📛 *Name:* ${userName}
🔢 *Number:* ${userJid.replace(/@.+/, '')}
📌 *Account Type:* ${user.isBusiness ? "💼 Business" : user.isEnterprise ? "🏢 Enterprise" : "👤 Personal"}

*📝 About:* ${about || 'Not set'}

*⚙️ Account Info:*
✅ Registered: ${user.isUser ? "Yes" : "No"}
🛡️ Verified: ${user.verifiedName ? "✅ Verified" : "❌ Not verified"}
${isGroup ? `👥 *Group Role:* ${groupRole}` : ''}
`.trim();

        // 8. SEND THE RESULT
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: userInfo,
            mentions: [userJid]
        }, { quoted: mek });

    } catch (e) {
        console.error("Person command error:", e);
        reply(`❌ Error: ${e.message || "Failed to fetch profile"}`);
    }
});
