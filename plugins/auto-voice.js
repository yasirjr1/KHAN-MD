const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
  try {
    if (config.AUTO_VOICE !== 'true') return;
    // if (isOwner) return; // Uncomment if you want to exclude owner

    // Use the correct JSON file URL
    const url = 'https://raw.githubusercontent.com/XdTechPro/KHAN-DATA/main/autovoice.json';
    const { data } = await axios.get(url);
    
    if (!data) {
      console.error("AutoVoice Error: No data received");
      return;
    }

    const lowerBody = body.toLowerCase().trim();
    
    for (const text in data) {
      if (text.toLowerCase() === lowerBody) {
        const audioUrl = data[text];
        
        // Verify the audio URL exists
        try {
          const headRes = await axios.head(audioUrl);
          if (headRes.status !== 200) {
            console.error(`AutoVoice Error: Audio file not found at ${audioUrl}`);
            continue;
          }
        } catch (headErr) {
          console.error(`AutoVoice Error: Could not verify audio URL ${audioUrl}`, headErr.message);
          continue;
        }
        
        await conn.sendPresenceUpdate('recording', from);
        
        await conn.sendMessage(from, {
          audio: { url: audioUrl },
          mimetype: 'audio/mp4', // Changed to audio/mp4 since you're using m4a files
          ptt: true
        }, { quoted: mek });
        
        return; // Exit after first match
      }
    }
  } catch (err) {
    console.error("AutoVoice Error:", err.message);
    // Optionally send an error message to the chat
     await conn.sendMessage(from, { text: `Error: ${err.message}` }, { quoted: mek });
  }
});
