const { cmd } = require("../command");
const config = require("../config");

// Online Group Members Check with Metadata
cmd({
    pattern: "onlinegc",
    alias: ["grouponline"],
    desc: "Check online status of group members",
    category: "group",
    react: "🟢",
    use: ".onlinegc",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, participants, groupMetadata, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command only works in groups!");
        
        // Get group metadata
        const { subject, id, owner } = groupMetadata;
        const members = await Promise.all(participants.map(async (user) => {
            const status = await conn.presenceStatus(user.id);
            return {
                id: user.id,
                name: user.notify || user.id.split('@')[0],
                status: status || 'offline'
            };
        }));

        const online = members.filter(m => m.status === 'online');
        const offline = members.filter(m => m.status !== 'online');

        let msg = `*🟢 Group Online Status 🟢*\n`;
        msg += `*Group:* ${subject}\n`;
        msg += `*ID:* ${id}\n`;
        msg += `*Owner:* @${owner.split('@')[0]}\n\n`;
        msg += `*Online (${online.length}):*\n`;
        msg += online.map((m, i) => `${i+1}. @${m.id.split('@')[0]}`).join('\n') + '\n\n';
        msg += `*Offline (${offline.length}):*\n`;
        msg += offline.map((m, i) => `${i+1}. @${m.id.split('@')[0]}`).join('\n');

        reply(msg, { mentions: participants.map(p => p.id) });
    } catch (e) {
        console.error(e);
        reply("❌ Failed to check online status");
    }
});

// Online Contacts Check with Metadata
cmd({
    pattern: "online",
    alias: ["onlinelist"],
    desc: "Check online contacts",
    category: "tools",
    react: "📱",
    use: ".online",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    try {
        const contacts = await conn.fetchContacts();
        const onlineContacts = await Promise.all(contacts.map(async (contact) => {
            const status = await conn.presenceStatus(contact.id);
            return status === 'online' ? contact : null;
        })).then(res => res.filter(Boolean));

        let msg = `*📱 Online Contacts (${onlineContacts.length})*\n\n`;
        msg += onlineContacts.map((c, i) => {
            const name = c.notify || c.id.split('@')[0];
            return `${i+1}. ${name} (${c.id.split('@')[0]})`;
        }).join('\n');
        
        reply(msg);
    } catch (e) {
        console.error(e);
        reply("❌ Failed to fetch online contacts");
    }
});

// Enhanced User Status Check with Metadata
cmd({
    pattern: "checkon",
    alias: ["userstatus"],
    desc: "Check if a user is online",
    category: "tools",
    react: "🔍",
    use: ".checkon @user",
    filename: __filename
},
async (conn, mek, m, { mentioned, reply }) => {
    try {
        if (!mentioned || !mentioned[0]) return reply("❌ Please mention a user!");
        
        const user = mentioned[0];
        const status = await conn.presenceStatus(user);
        const contact = await conn.getContact(user);
        const profile = await conn.profilePictureUrl(user, 'image').catch(() => null);
        
        let msg = `*👤 User Status Report*\n\n`;
        msg += `• Name: ${contact.notify || user.split('@')[0]}\n`;
        msg += `• Number: ${user.split('@')[0]}\n`;
        msg += `• Status: ${status === 'online' ? '🟢 Online' : '🔴 Offline'}\n`;
        msg += `• Last Seen: ${status.lastSeen || 'Unknown'}\n`;
        
        if (profile) {
            await conn.sendMessage(m.chat, { 
                image: { url: profile },
                caption: msg
            }, { quoted: mek });
        } else {
            reply(msg);
        }
    } catch (e) {
        console.error(e);
        reply("❌ Failed to check user status");
    }
});
