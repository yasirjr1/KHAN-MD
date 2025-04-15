const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menux",
    desc: "Show interactive menu system",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const menuCaption = `╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  🏮 *${config.BOT_NAME}* 🏮  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭────────────────────────
│ 🧑‍💼 Owner : *${config.OWNER_NAME}*
│ 🔧 Type : *NodeJs*
│ 🖥️ Platform : *${os.platform()}*
│ ⚙️ Mode : *${config.MODE}*
│ 🔣 Prefix : *${config.PREFIX}*
│ 🏷️ Version : *3.0.0 Bᴇᴛᴀ*
╰────────────────────────
╭────────────────────────
│ 🔢 *Reply with number* 🔢
│ *to select menu option*
╰────────────────────────
╭────────────────────────
│ 1️⃣  📥 *Download Menu*
│ 2️⃣  👥 *Group Menu*
│ 3️⃣  😄 *Fun Menu*
│ 4️⃣  👑 *Owner Menu*
│ 5️⃣  🤖 *AI Menu*
│ 6️⃣  🎎 *Anime Menu*
│ 7️⃣  🔄 *Convert Menu*
│ 8️⃣  📌 *Other Menu*
│ 9️⃣  💞 *Reactions Menu*
│ 🔟  🏠 *Main Menu*
╰────────────────────────
╭────────────────────────
│ 🛠️ *Example:* Reply "1"
│ for Download Menu
╰────────────────────────
> ${config.DESCRIPTION}`;

        const sentMsg = await conn.sendMessage(
            from,
            {
                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/7zfdcq.jpg' },
                caption: menuCaption,
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
            },
            { quoted: mek }
        );

        const messageID = sentMsg.key.id;

        // Complete menu data using single image
        const menuData = {
            '1': {
                title: "📥 Download Menu",
                content: `╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  📥 *DOWNLOAD MENU* 📥  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭────────────────────────
│ 🌐 *Social Media*
│ • facebook [url]
│ • tiktok [url]
│ • twitter [url]
│ • Insta [url]
│ • pins [url]
│ • pinterest [url]
╰────────────────────────
╭────────────────────────
│ 🎵 *Music/Video*
│ • spotify [query]
│ • play [song name]
│ • play2-10 [song name]
│ • audio [url]
│ • video [url]
│ • ytmp3 [yt url]
│ • ytmp4 [yt url]
│ • song [song name]
╰────────────────────────
╭────────────────────────
│ 📁 *Files/Apps*
│ • mediafire [url]
│ • apk [app name]
│ • img [query]
│ • gdrive [url]
╰────────────────────────
╭────────────────────────
│ 🛠️ *Tools*
│ • ssweb [url]
│ • tiks [tiktok url]
│ • fb2 [fb url]
╰────────────────────────
> ${config.DESCRIPTION}`
            },
            '2': {
                title: "👥 Group Menu",
                content: `╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  👥 *GROUP MENU* 👥  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭────────────────────────
│ 🛠️ *Group Management*
│ • grouplink
│ • add @user
│ • remove @user
│ • kick @user
│ • kickall
╰────────────────────────
╭────────────────────────
│ ⚡ *Admin Commands*
│ • promote @user
│ • demote @user
│ • mute [time]
│ • unmute
│ • lockgc
│ • unlockgc
╰────────────────────────
╭────────────────────────
│ 🏷️ *Tagging*
│ • tag @user
│ • hidetag [message]
│ • tagall
│ • tagadmins
╰────────────────────────
╭────────────────────────
│ ⚙️ *Settings*
│ • setwelcome [text]
│ • setgoodbye [text]
│ • updategname [name]
│ • updategdesc [text]
╰────────────────────────
> ${config.DESCRIPTION}`
            },
            // ... (other menu items follow same pattern)
            '10': {
                title: "🏠 Main Menu",
                content: `╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  🏠 *MAIN MENU* 🏠  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭────────────────────────
│ ℹ️ *Bot Info*
│ • ping
│ • runtime
│ • uptime
│ • repo
╰────────────────────────
╭────────────────────────
│ 🛠️ *Controls*
│ • menu
│ • menu2
│ • restart
│ • owner
╰────────────────────────
╭────────────────────────
│ 🏮 *Bot Status*
│ • alive
│ • live
╰────────────────────────
> ${config.DESCRIPTION}`
            }
        };

        // Listen for replies to this message
        conn.ev.on("messages.upsert", async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg.message) return;

            const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            
            if (isReplyToMenu) {
                const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
                const senderID = receivedMsg.key.remoteJid;

                await conn.sendMessage(senderID, {
                    react: { text: '✅', key: receivedMsg.key }
                });

                if (menuData[receivedText]) {
                    const selectedMenu = menuData[receivedText];
                    
                    await conn.sendMessage(
                        senderID,
                        {
                            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/7zfdcq.jpg' },
                            caption: `╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  ${selectedMenu.title}  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
${selectedMenu.content}`,
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
                        },
                        { quoted: receivedMsg }
                    );
                } else {
                    await conn.sendMessage(
                        senderID,
                        {
                            text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 1-10 to select a menu.\n\n*Example:* Reply with "1" for Download Menu\n\n> ${config.DESCRIPTION}`,
                        },
                        { quoted: receivedMsg }
                    );
                }
            }
        });

        setTimeout(() => {
            conn.ev.off("messages.upsert", arguments.callee);
        }, 300000);

    } catch (e) {
        console.log(e);
        reply(`❌ An error occurred: ${e}\n\n> ${config.DESCRIPTION}`);
    }
});
