const config = require('../config')
const { cmd, commands } = require('../command')

cmd({
    pattern: "list",
    alias: ["listcmd","commands"],
    desc: "Show all available commands with descriptions",
    category: "menu",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        let menuText = `╭───『 *${config.BOT_NAME} COMMANDS* 』───⳹
│
│ *🛠️ BOT INFO*
│ • 👑 Owner : ${config.OWNER_NAME}
│ • ⚙️ Prefix : [${config.PREFIX}]
│ • 🌐 Platform : Heroku
│ • 📦 Version : 4.0.0
│
╰────────────────⳹\n`

        // Organize commands by category
        const categorized = {}
        Object.values(commands).forEach(cmd => {
            if (!categorized[cmd.category]) {
                categorized[cmd.category] = []
            }
            categorized[cmd.category].push(cmd)
        })

        // Generate menu for each category
        for (const [category, cmds] of Object.entries(categorized)) {
            menuText += `╭───『 *${category.toUpperCase()}* 』───⳹\n`
            
            cmds.forEach(c => {
                menuText += `┃▸📄 COMMAND: .${c.pattern}\n`
                if (c.desc) {
                    menuText += `┃▸❕ ${c.desc}\n`
                }
                if (c.alias && c.alias.length > 0) {
                    menuText += `┃▸🔹 Aliases: ${c.alias.map(a => `.${a}`).join(', ')}\n`
                }
                menuText += `│\n`
            })
            
            menuText += `╰────────────────⳹\n`
        }

        menuText += `\n> ${config.DESCRIPTION}`

        await conn.sendMessage(
            from,
            {
                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/7zfdcq.jpg' },
                caption: menuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true
                }
            },
            { quoted: mek }
        )

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})
