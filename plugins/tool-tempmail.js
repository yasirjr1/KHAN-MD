const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "tempmail",
    alias: ["genmail"],
    desc: "Generate a new temporary email address",
    category: "utility",
    react: "📧",
    filename: __filename
},
async (conn, mek, m, { from, reply, prefix }) => {
    try {
        const response = await axios.get('https://apis.davidcyriltech.my.id/temp-mail');
        const { email, session_id, expires_at } = response.data;

        const message = `📧 *Temporary Email Generated*\n\n` +
                       `✉️ *Email Address:* ${email}\n` +
                       `🔑 *Session ID:* ${session_id}\n` +
                       `⏳ *Expires At:* ${new Date(expires_at).toLocaleString()}\n\n` +
                       `Use *${prefix}checkmail ${session_id}* to check your inbox`;

        await reply(message);

    } catch (e) {
        console.error('TempMail error:', e);
        reply(`❌ Error generating email: ${e.message}`);
    }
});

cmd({
    pattern: "checkmail",
    alias: ["inbox", "tmail", "mailinbox"],
    desc: "Check your temporary email inbox",
    category: "utility",
    react: "📬",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const sessionId = args[0];
        if (!sessionId) return reply('🔑 Please provide your session ID\nExample: .checkmail YOUR_SESSION_ID');

        const inboxUrl = `https://apis.davidcyriltech.my.id/temp-mail/inbox?id=${encodeURIComponent(sessionId)}`;
        const response = await axios.get(inboxUrl);

        if (!response.data.success) {
            return reply('❌ Invalid session ID or expired email');
        }

        const { inbox_count, messages } = response.data;

        if (inbox_count === 0) {
            return reply('📭 Your inbox is empty');
        }

        let messageList = `📬 *You have ${inbox_count} message(s)*\n\n`;
        messages.forEach((msg, index) => {
            messageList += `━━━━━━━━━━━━━━━━━━\n` +
                          `📌 *Message ${index + 1}*\n` +
                          `👤 *From:* ${msg.from}\n` +
                          `📝 *Subject:* ${msg.subject}\n` +
                          `⏰ *Date:* ${new Date(msg.date).toLocaleString()}\n\n` +
                          `📄 *Content:*\n${msg.body}\n\n`;
        });

        await reply(messageList);

    } catch (e) {
        console.error('CheckMail error:', e);
        reply(`❌ Error checking inbox: ${e.response?.data?.message || e.message}`);
    }
});
