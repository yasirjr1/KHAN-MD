const { cmd } = require("../command");

// Anti-ban configuration
const SAFETY = {
  MAX_JIDS: 15,               // Reduced from 20 to be extra safe
  DELAY: 7000,                // Increased to 7 seconds
  DELAY_EVERY: 3,             // Add extra delay every 3 sends
  EXTRA_DELAY: 15000          // 15 second delay
};

cmd({
  pattern: "forward",
  alias: ["fwd", "blast"],
  desc: "Owner Only - Ultra-safe bulk forward",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isOwner }) => {
  try {
    // ===== [VALIDATION CHECKS] ===== //
    if (!isOwner) return await client.sendMessage(from, { 
      text: "*📛 Owner Only Command*" 
    }, { quoted: message });

    if (!match.quoted) return await client.sendMessage(from, { 
      text: "*🔎 Reply to a message*" 
    }, { quoted: message });

    // ===== [JID PROCESSING] ===== //
    const rawJids = match.split(',')
      .map(jid => jid.trim().replace(/\s+/g, ''))
      .filter(jid => jid.match(/\d+/g)); // Only keep valid number formats

    if (!rawJids.length) return await client.sendMessage(from, {
      text: "*❗ Example: .forward 1234,5678,9012*"
    }, { quoted: message });

    const limitedJids = rawJids
      .slice(0, SAFETY.MAX_JIDS)
      .map(jid => jid.includes('@') ? jid : jid + '@g.us');

    // ===== [MEDIA HANDLING] ===== //
    const buffer = await match.quoted.download();
    const quoted = match.quoted;
    let messageContent = {};

    // Supported media types mapping
    const mediaHandlers = {
      imageMessage: () => ({
        image: buffer,
        caption: quoted.text || '',
        mimetype: quoted.mimetype || "image/jpeg"
      }),
      videoMessage: () => ({
        video: buffer,
        caption: quoted.text || '',
        mimetype: quoted.mimetype || "video/mp4"
      }),
      audioMessage: () => ({
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: quoted.ptt || false
      }),
      stickerMessage: () => ({
        sticker: buffer,
        mimetype: quoted.mimetype || "image/webp"
      }),
      documentMessage: () => ({
        document: buffer,
        mimetype: quoted.mimetype,
        fileName: quoted.fileName || "Document"
      }),
      extendedTextMessage: () => ({
        text: quoted.text
      })
    };

    if (!mediaHandlers[quoted.mtype]) {
      return await client.sendMessage(from, {
        text: `❌ Unsupported type: ${quoted.mtype || 'unknown'}`
      }, { quoted: message });
    }

    messageContent = mediaHandlers[quoted.mtype]();

    // ===== [SAFE SENDING WITH DELAYS] ===== //
    let success = 0;
    const failedJids = [];
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const [index, jid] of limitedJids.entries()) {
      try {
        // Send message
        await client.sendMessage(jid, messageContent);
        success++;

        // Apply delays
        if (index < limitedJids.length - 1) {
          // Extra delay every N sends
          if ((index + 1) % SAFETY.DELAY_EVERY === 0) {
            await delay(SAFETY.EXTRA_DELAY);
          } else {
            await delay(SAFETY.DELAY);
          }
        }

      } catch (error) {
        failedJids.push(jid.split('@')[0]);
        console.error(`Failed ${jid}:`, error);
        // Even on failure, maintain delay pattern
        await delay(SAFETY.DELAY);
      }
    }

    // ===== [REPORT GENERATION] ===== //
    let report = `🛡️ *Ultra-Safe Forward Complete*\n\n` +
                 `📤 Success: ${success}/${limitedJids.length}\n` +
                 `⏱️ Delays: ${SAFETY.DELAY/1000}s (${SAFETY.EXTRA_DELAY/1000}s every ${SAFETY.DELAY_EVERY} sends)\n`;

    if (rawJids.length > SAFETY.MAX_JIDS) {
      report += `\n⚠️ Limited to first ${SAFETY.MAX_JIDS} JIDs (${rawJids.length - SAFETY.MAX_JIDS} omitted)\n`;
    }

    if (failedJids.length) {
      report += `\n❌ Failed: ${failedJids.slice(0, 5).join(', ')}` +
                (failedJids.length > 5 ? ` (+${failedJids.length - 5} more)` : '');
    }

    await client.sendMessage(from, { text: report }, { quoted: message });

  } catch (error) {
    console.error("Forward Error:", error);
    await client.sendMessage(from, {
      text: `💢 Critical Error:\n${error.message}\n\n` +
            `⚠️ Stopped forwarding for safety`
    }, { quoted: message });
  }
});
