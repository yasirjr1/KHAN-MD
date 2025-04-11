const { cmd } = require("../command");

cmd({
    pattern: "onlinegc",
    alias: ["grouponline"],
    desc: "Check online status of group members",
    category: "tools",
    react: "🟢",
    use: ".onlinegc"
},
async (conn, m, { groupMetadata, participants }) => {
    try {
        if (!m.isGroup) return m.reply("❌ This command only works in groups!");
        
        const members = await Promise.all(participants.map(async (user) => {
            const status = await conn.presenceStatus(user.id);
            return {
                id: user.id,
                name: user.name || user.id.split('@')[0],
                status: status || 'offline'
            };
        }));

        const online = members.filter(m => m.status === 'online');
        const offline = members.filter(m => m.status !== 'online');

        let msg = `🟢 *Group Online Status* 🟢\n\n`;
        msg += `*Online Members (${online.length}):*\n`;
        msg += online.map(m => `• ${m.name}`).join('\n') + '\n\n';
        msg += `*Offline Members (${offline.length}):*\n`;
        msg += offline.map(m => `• ${m.name}`).join('\n');

        m.reply(msg);
    } catch (err) {
        console.error(err);
        m.reply("❌ Failed to check online status");
    }
});

cmd({
    pattern: "checkon",
    alias: ["userstatus"],
    desc: "Check if a user is online",
    category: "tools",
    react: "🔍",
    use: ".checkon @user"
},
async (conn, m, { mentioned }) => {
    try {
        if (!mentioned || !mentioned[0]) return m.reply("❌ Please mention a user!");
        
        const user = mentioned[0];
        const status = await conn.presenceStatus(user);
        
        m.reply(`👤 *User Status*\n\n` +
                `• Name: ${user.split('@')[0]}\n` +
                `• Status: ${status === 'online' ? '🟢 Online' : '🔴 Offline'}\n` +
                `• Last Seen: ${status.lastSeen || 'Unknown'}`);
    } catch (err) {
        console.error(err);
        m.reply("❌ Failed to check user status");
    }
});


cmd({
    pattern: "online",
    alias: ["onlinelist"],
    desc: "Check online contacts",
    category: "tools",
    react: "🟢",
    use: ".online"
},
async (conn, m) => {
    try {
        const contacts = await conn.fetchContacts();
        const onlineContacts = await Promise.all(contacts.map(async (contact) => {
            const status = await conn.presenceStatus(contact.id);
            return status === 'online' ? contact : null;
        })).then(res => res.filter(Boolean));

        let msg = `📱 *Online Contacts (${onlineContacts.length})*\n\n`;
        msg += onlineContacts.map(c => `• ${c.name || c.id.split('@')[0]}`).join('\n');
        
        m.reply(msg);
    } catch (err) {
        console.error(err);
        m.reply("❌ Failed to fetch online contacts");
    }
});
