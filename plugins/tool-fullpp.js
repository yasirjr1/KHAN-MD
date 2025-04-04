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
    const mtype = quoted.mtype;
    
    // Process image
    const image = await Jimp.read(buffer);
    if (!image) throw new Error("Invalid image format");
    
    // Make square if needed
    const size = Math.max(image.bitmap.width, image.bitmap.height);
    if (image.bitmap.width !== image.bitmap.height) {
      const squareImage = new Jimp(size, size, 0x000000FF);
      squareImage.composite(image, (size - image.bitmap.width) / 2, (size - image.bitmap.height) / 2);
      image.clone(squareImage);
    }
    
    // Resize to WhatsApp requirements
    image.resize(640, 640);
    const processedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    
    // Update profile picture
    await conn.updateProfilePicture(botNumber, processedBuffer);
    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    
    return await conn.sendMessage(from, {
      text: "✅ *Bot profile picture updated successfully!*"
    }, { quoted: mek });
    
} catch (e) {
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    console.log(e);
    return await conn.sendMessage(from, {
      text: `❌ *Error occurred while updating profile picture!*\n\n${e}`
    }, { quoted: mek });
}
})
