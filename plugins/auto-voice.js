const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
  try {
    // Use the correct JSON file URL
    const url = 'https://raw.githubusercontent.com/XdTechPro/KHAN-DATA/main/autovoice.json';
    const { data } = await axios.get(url);

    for (const text in data) {
      if (body.toLowerCase() === text.toLowerCase()) {
        if (config.AUTO_VOICE === 'true') {
          // if (isOwner) return; // Uncomment if you want to exclude owner
          await conn.sendPresenceUpdate('recording', from);
          
          // Send the audio message
          await conn.sendMessage(from, {
            audio: { url: data[text] },
            mimetype: 'audio/mpeg',
            ptt: true
          }, { quoted: mek });
          
          // Add a small delay to ensure proper sending
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  } catch (err) {
    console.error("AutoVoice Error:", err.message);
    // Optionally send an error message to the chat
    // await conn.sendMessage(from, { text: `Error: ${err.message}` }, { quoted: mek });
  }
});
