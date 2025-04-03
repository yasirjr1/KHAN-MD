const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
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
        // 1. DETERMINE TARGET USER
        const who = quoted?.sender || 
                  mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                  sender;

        // 2. VERIFY USER EXISTS
        const [user] = await conn.onWhatsApp(who).catch(() => []);
        if (!user?.exists) return reply("❌ User not registered on WhatsApp");

        // 3. GET PROFILE PICTURE
        let ppUrl = await conn.profilePictureUrl(who, 'image').catch(() => 
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png'
        );

        // 4. GET NAME WITH COMPLETE FALLBACK CHAIN
        let name = await conn.getName(who).catch(async () => {
            // Fallback 1: Check group participant info
            if (isGroup) {
                const member = participants.find(p => p.id === who);
                if (member?.notify) return member.notify;
            }
            // Fallback 2: Contact DB
            const contact = await conn.contactDB?.get(who).catch(() => null);
            if (contact?.name) return contact.name;
            // Fallback 3: Presence
            const presence = await conn.presenceSubscribe(who).catch(() => null);
            return presence?.pushname || who.split('@')[0];
        });

        // 5. GET BIO/ABOUT WITH COMPLETE FALLBACKS
        let about = (await conn.fetchStatus(who).catch(() => {})).status || '';
        if (!about) {
            // Business account fallback
            about = (await conn.getBusinessProfile(who).catch(() => {})).description || '';
        }

        // 6. GET GROUP ROLE
        let role = isGroup ? 
            participants.find(p => p.id === who)?.admin ? "👑 Admin" : "👥 Member" : "";

        // 7. FORMAT OUTPUT
        const info = `
*GC MEMBER INFORMATION ℹ️*

📛 *Name:* ${name}
🔢 *Number:* ${who.replace(/@.+/, '')}
📌 *Type:* ${user.isBusiness ? "💼 Business" : user.isEnterprise ? "🏢 Enterprise" : "👤 Personal"}

*📝 About:* ${about || "Not set"}

*⚙️ Account Info:*
✅ Registered: ${user.isUser ? "Yes" : "No"}
🛡️ Verified: ${user.verifiedName ? "Yes" : "No"}
${role ? `👥 *Role:* ${role}` : ''}
`.trim();

        // 8. SEND RESULT
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: info,
            mentions: [who]
        }, { quoted: mek });

    } catch (e) {
        console.error("Person command error:", e);
        reply(`❌ Error: ${e.message || "Failed to fetch info"}`);
    }
});
