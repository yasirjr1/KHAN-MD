const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');
const fs = require("fs");
const path = require("path");

// Get greeting based on time
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅 Good Morning";
    if (hour < 17) return "🌞 Good Afternoon";
    return "🌙 Good Evening";
}

cmd({
    pattern: "alive",
    alias: ["status", "online"],
    desc: "Check bot status and system information",
    category: "main",
    react: "💻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
        const uptime = runtime(process.uptime());
        const cpuModel = os.cpus()[0].model;
        const load = os.loadavg().map(v => v.toFixed(2)).join(', ');
        const osVersion = `${os.type()} ${os.release()}`;
        const nodeVersion = process.version;
        const userJID = conn?.user?.id || "Not detected";

        // Dynamically count commands using the 'cmd' structure
        const pluginDir = path.join(__dirname, "../plugin");
        const commandFiles = fs.readdirSync(pluginDir).filter(file => file.endsWith(".js"));
        let totalCommands = 0;
        for (const file of commandFiles) {
            const filePath = path.join(pluginDir, file);
            const plugin = require(filePath);
            if (Array.isArray(plugin)) {
                totalCommands += plugin.filter(cmd => cmd?.pattern).length;
            } else if (plugin?.pattern) {
                totalCommands += 1;
            }
        }

        const statusMsg = `╭───〔 *${config.BOT_NAME} STATUS* 〕───⳹
│ ${getGreeting()} *${m.pushName || 'User'}!*
│
├─ ❯ *🖥️ SYSTEM INFO*
│     ├─ ⏱️ *Uptime:* ${uptime}
│     ├─ 🧠 *Memory:* ${usedMem}MB / ${totalMem}MB
│     ├─ ⚙️ *CPU:* ${os.cpus().length} Core - ${cpuModel}
│     ├─ 💻 *Load Avg:* ${load}
│     ├─ 🧮 *Platform:* ${osVersion} (${os.arch()})
│     └─ 🟩 *NodeJS:* ${nodeVersion}
│
├─ ❯ *🤖 BOT INFO*
│     ├─ 👑 *Owner:* ${config.OWNER_NAME}
│     ├─ 🧬 *Version:* 4.0.0
│     ├─ 🔌 *Mode:* ${config.MODE}
│     ├─ 📲 *User:* ${userJID}
│     └─ 🧾 *Commands:* ${totalCommands} total
│
╰─────〔 ⚡ Powered by ${config.OWNER_NAME} 〕`;

        await conn.sendMessage(from, { 
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/juroe8.jpg' },
            caption: statusMsg,
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
        console.error("Alive command error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
