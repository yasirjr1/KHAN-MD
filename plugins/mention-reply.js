const config = require('../config');
const { cmd } = require('../command');

cmd({
  on: "body"
}, async (conn, m, { isGroup, reply, q, text }) => {
  try {
    if (!isGroup) return;
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

    const isBotMentioned = m.mentionedJid.includes(botNumber);

    if (isBotMentioned) {
      await conn.sendMessage(m.chat, {
        audio: { url: randomClip },
        mimetype: 'audio/mp4',
        ptt: true,
        waveform: [99, 0, 99, 0, 99],
        contextInfo: {
          forwardingScore: 55555,
          isForwarded: true,
          externalAdReply: {
            title: "KHAN-MD 🥀",
            body: "POWERED BY JAWAD TECHX 🤌💗",
            mediaType: 4,
            thumbnailUrl: "https://files.catbox.moe/c836ws.png",
            mediaUrl: "https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j",
            sourceUrl: "https://wa.me/message/INB2QVGXHQREO1",
            showAdAttribution: true
          }
        }
      });
    }
  } catch (e) {
    console.error(e);
    const ownerJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
    await conn.sendMessage(ownerJid, {
      text: `*Bot Error in Mention Handler:*\n${e.message}`
    });
  }
});
