const axios = require("axios");
const { cmd } = require("../command");
const { fetchGif, gifToVideo } = require("../lib/fetchGif");

// Command for random boy (bacha)
cmd({
  pattern: "bacha",
  alias: ["boy", "larka"],
  desc: "Tags a random user as your bacha with anime boy image",
  react: "👦",
  category: "fun",
  filename: __filename
}, async (conn, mek, store, { isGroup, groupMetadata, reply, sender }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    const participants = groupMetadata.participants.map(user => user.id);
    const eligibleParticipants = participants.filter(id => id !== sender && !id.includes(conn.user.id.split('@')[0]));
    
    if (eligibleParticipants.length < 1) {
      return reply("❌ Not enough participants to choose a bacha!");
    }

    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const randomUser = eligibleParticipants[randomIndex];

    // Fetch random anime boy image
    const apiUrl = "https://api.waifu.im/random/?selected_tags=maid&is_nsfw=false";
    const res = await axios.get(apiUrl);
    const imageUrl = res.data.images[0].url;

    const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    const message = `👦 *Here's your bacha!* \n\n@${randomUser.split("@")[0]} is now your boy! 😊\n\nTake good care of him! 💙`;

    await conn.sendMessage(
      mek.chat,
      { 
        image: Buffer.from(imageBuffer.data), 
        caption: message,
        mentions: [randomUser] 
      },
      { quoted: mek }
    );

  } catch (error) {
    console.error("❌ Error in .bacha command:", error);
    reply(`❌ *Error in .bacha command:*\n\`\`\`${error.message}\`\`\``);
  }
});

// Command for random girl (bachi)
cmd({
  pattern: "bachi",
  alias: ["girl", "larki"],
  desc: "Tags a random user as your bachi with anime girl image",
  react: "👧",
  category: "fun",
  filename: __filename
}, async (conn, mek, store, { isGroup, groupMetadata, reply, sender }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    const participants = groupMetadata.participants.map(user => user.id);
    const eligibleParticipants = participants.filter(id => id !== sender && !id.includes(conn.user.id.split('@')[0]));
    
    if (eligibleParticipants.length < 1) {
      return reply("❌ Not enough participants to choose a bachi!");
    }

    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const randomUser = eligibleParticipants[randomIndex];

    // Fetch random anime girl image
    const apiUrl = "https://api.waifu.im/random/?selected_tags=waifu&is_nsfw=false";
    const res = await axios.get(apiUrl);
    const imageUrl = res.data.images[0].url;

    const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    const message = `👧 *Here's your bachi!* \n\n@${randomUser.split("@")[0]} is now your girl! 😊\n\nTake good care of her! 💖`;

    await conn.sendMessage(
      mek.chat,
      { 
        image: Buffer.from(imageBuffer.data), 
        caption: message,
        mentions: [randomUser] 
      },
      { quoted: mek }
    );

  } catch (error) {
    console.error("❌ Error in .bachi command:", error);
    reply(`❌ *Error in .bachi command:*\n\`\`\`${error.message}\`\`\``);
  }
});
