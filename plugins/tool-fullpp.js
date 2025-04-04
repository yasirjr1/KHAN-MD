const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')
const Jimp = require('jimp')

cmd({
    pattern: "fullpp",
    react: "🖼️",
    alias: ["setpp"],
    desc: "Set bot's profile picture",
    category: "owner",
    use: '.fullpp (reply to image)',
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator ,isDev, isAdmins, reply}) => {
try {
    // Owner check
    if (!isOwner) {
      return await conn.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: mek });
    }
    
    // Check if replied to a message
    if (!quoted) {
      return await conn.sendMessage(from, {
        text: "*🍁 Please reply to an image!*"
      }, { quoted: mek });
    }
    
    // Check if the quoted message is an image
    if (!quoted.message?.imageMessage) {
      return await conn.sendMessage(from, {
        text: "*⚠️ Please reply to an image message!*"
      }, { quoted: mek });
    }
    
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } })
    
    // Download the image
    const buffer = await quoted.download();
    
    // Process image with Jimp
    Jimp.read(buffer)
      .then(image => {
        // Make square if needed
        const size = Math.max(image.bitmap.width, image.bitmap.height);
        if (image.bitmap.width !== image.bitmap.height) {
          image.cover(size, size);
        }
        
        // Resize and quality
        image.resize(640, 640).quality(90);
        
        // Get buffer and update profile picture
        image.getBuffer(Jimp.MIME_JPEG, async (err, processedBuffer) => {
          if (err) throw err;
          
          await conn.updateProfilePicture(botNumber, processedBuffer);
          await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
          
          return await conn.sendMessage(from, {
            text: "✅ *Bot profile picture updated successfully!*"
          }, { quoted: mek });
        });
      })
      .catch(async e => {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        return await conn.sendMessage(from, {
          text: `❌ *Error processing image!*\n\n${e}`
        }, { quoted: mek });
      });
    
} catch (e) {
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    console.log(e);
    return await conn.sendMessage(from, {
      text: `❌ *Error occurred while updating profile picture!*\n\n${e}`
    }, { quoted: mek });
}
})
