const { cmd } = require('../command');

cmd({
  'on': "text"
}, async (conn, m, store, { from, isGroup, mentionedJidList }) => {
  try {
    const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
    
    // Only trigger on @mentions in groups
    if (!isGroup || !mentionedJidList.includes(botJid)) return;

    // Your 2 test audio URLs
    const audioList = [
      "https://github.com/XdTechPro/KHAN-DATA/raw/refs/heads/main/autovoice/Islamic.m4a",
      "https://github.com/XdTechPro/KHAN-DATA/raw/refs/heads/main/autovoice/menunew.m4a"
    ];

    // Send random audio
    await conn.sendMessage(from, {
      audio: { 
        url: audioList[Math.floor(Math.random() * audioList.length)] 
      },
      mimetype: 'audio/mp4',
      ptt: true // as voice message
    }, { quoted: m });

  } catch (error) {
    console.error("Audio reply error:", error);
  }
});
