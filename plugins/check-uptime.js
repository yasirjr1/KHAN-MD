const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');
const fs = require("fs");
const path = require("path");

cmd({
    pattern: "uptime2",
    alias: ["runtime2", "up2"],
    desc: "Check bot uptime only",
    category: "main",
    react: "⏱️",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const uptime = runtime(process.uptime());
        const started = new Date(Date.now() - process.uptime() * 1000).toLocaleString();

        const uptimeMsg = `╭─❖ *『 BOT UPTIME 』* ❖─╮
│
├─ ⏱️ *Uptime:* ${uptime}
├─ 📆 *Started:* ${started}
│
╰────────〔 ${config.BOT_NAME} v4.0.0 〕`;

        await conn.sendMessage(from, { 
            text: uptimeMsg,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363354023106228@newsletter',
                    newsletterName: config.OWNER_NAME,
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Uptime2 command error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
