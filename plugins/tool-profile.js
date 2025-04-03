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
async (conn, mek, m, { from, sender, isGroup, reply, quoted,cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "info"],
    desc: "Get complete user profile information",
    category: "utility",
    use: '.person [@tag or reply]',
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply, quoted, participants }) => {
    try {
        // 1. DETERMINE TARGET USER (FIXED VERSION)
        const who = quoted?.sender || 
                  (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) || 
                  (mek.fromMe ? conn.user.jid : sender);

        // 2. VERIFY USER EXISTS
        const [user] = await conn.onWhatsApp(who).catch(() => []);
        if (!user?.exists) return reply("❌ User not registered on WhatsApp");

        // 3. GET PROFILE PICTURE
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(who, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // 4. GET NAME (FIXED VERSION)
        let username;
        try {
            username = await conn.getName(who);
            // If still not getting proper name, try additional fallbacks
            if (!username || username === who.split('@')[0]) {
                const contact = await conn.contactDB?.get(who).catch(() => null);
                username = contact?.name || username;
            }
        } catch (e) {
            console.log("Name fetch error:", e);
            username = who.split('@')[0]; // Final fallback to number
        }

        // 5. GET ABOUT/BIO (FIXED VERSION)
        let about = '';
        try {
            const statusData = await conn.fetchStatus(who).catch(() => null);
            about = statusData?.status || '';
            
            // Additional check for business accounts
            if (!about && user.isBusiness) {
                const businessProfile = await conn.getBusinessProfile(who).catch(() => null);
                about = businessProfile?.description || '';
            }
        } catch (e) {
            console.log("About fetch error:", e);
        }

        // 6. GET GROUP ROLE
        let groupRole = "";
        if (isGroup) {
            const participant = participants.find(p => p.id === who);
            groupRole = participant?.admin ? "👑 Admin" : "👥 Member";
        }

        // 7. FORMAT THE OUTPUT
        const userInfo = `
*GC MEMBER INFORMATION 🧊*

📛 *Name:* ${username || who.split('@')[0]}
🔢 *Number:* ${who.replace(/@.+/, '')}
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
            mentions: [who]
        }, { quoted: mek });

    } catch (e) {
        console.error("Person command error:", e);
        reply(`❌ Error: ${e.message || "Failed to fetch profile"}`);
    }
});
