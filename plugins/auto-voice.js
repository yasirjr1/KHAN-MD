const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
  try {
    const url = 'https://raw.githubusercontent.com/XdTechPro/KHAN-DATA/main/autosticker/autovoice.json';
    const { data } = await axios.get(url);

    for (const text in data) {
      if (body.toLowerCase() === text.toLowerCase()) {
        if (config.AUTO_VOICE === 'true') {
          //if (isOwner) return;
          await conn.sendPresenceUpdate('recording', from);
          await conn.sendMessage(from, {
            audio: { url: data[text] },
            mimetype: 'audio/mpeg',
            ptt: true
          }, { quoted: mek });
        }
      }
    }
  } catch (err) {
    console.error("AutoVoice Error:", err.message);
  }
});
