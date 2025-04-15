const config = require('../config');
const { cmd } = require('../command');

cmd({
  on: "body"
}, async (conn, m, { isGroup }) => {
  try {
    if (!config.MENTION_REPLY || !isGroup) return;
    if (!m.mentionedJid || m.mentionedJid.length === 0) return;

    const voiceClips = [
      "https://cdn.ironman.my.id/i/7p5plg.mp4",
      "https://cdn.ironman.my.id/i/l4dyvg.mp4",
      "https://cdn.ironman.my.id/i/4z93dg.mp4",
      "https://cdn.ironman.my.id/i/m9gwk0.mp4",
      "https://cdn.ironman.my.id/i/gr1jjc.mp4",
      "https://cdn.ironman.my.id/i/lbr8of.mp4",
      "https://cdn.ironman.my.id/i/0z95mz.mp4",
      "https://cdn.ironman.my.id/i/rldpwy.mp4",
      "https://cdn.ironman.my.id/i/lz2z87.mp4",
      "https://cdn.ironman.my.id/i/gg5jct.mp4"
    ];

    const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];
    const botNumber = conn.user.id.split(":")[0] + '@s.whatsapp.net';

    if (m.mentionedJid.includes(botNumber)) {
      await conn.sendMessage(m.chat, {
        audio: { url: randomClip },
        mimetype: 'audio/mp4',
        ptt: true,
        waveform: [99, 0, 99, 0, 99],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: config.BOT_NAME || "KHAN-MD 🥀",
            body: config.DESCRIPTION || "POWERED BY JAWAD TECHX 🤌💗",
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnailUrl: config.MENU_IMAGE_URL || "https://files.catbox.moe/c836ws.png",
            mediaUrl: "https://files.catbox.moe/l2t3e0.jpg",
            sourceUrl: "https://wa.me/message/INB2QVGXHQREO1",
            showAdAttribution: true
          }
        }
      }, { quoted: m }); // <-- sends as reply
    }
  } catch (e) {
    console.error(e);
    const ownerJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
    await conn.sendMessage(ownerJid, {
      text: `*Bot Error in Mention Handler:*\n${e.message}`
    });
  }
});
