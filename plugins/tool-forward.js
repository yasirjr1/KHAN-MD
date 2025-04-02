const { cmd } = require("../command");

// Safety Configuration
const SAFETY = {
  MAX_JIDS: 20, // Increased limit
  BASE_DELAY: 3000, // 3 seconds
  EXTRA_DELAY: 8000, // 8 seconds every 5th send
};

cmd({
  pattern: "forward",
  alias: ["fwd"],
  desc: "Bulk forward with media support",
  category: "owner",
  filename: __filename
}, async (client, message, args, { isOwner }) => {
  try {
    if (!isOwner) return message.reply("*📛 Owner Only Command*");
    if (!message.quoted) return message.reply("*🍁 Please reply to a message!*");

    // ===== [FIXED JID PROCESSING] ===== //
    let input = typeof args === 'string' ? args : args.join(' ');
    const rawJids = input.split(',')
      .map(jid => jid.trim())
      .filter(jid => jid.length > 0);

    const validJids = rawJids.map(jid => {
      // Keep JID as-is if already formatted correctly
      if (/^\d+@g\.us$/.test(jid)) return jid;
      // Remove any existing @g.us if malformed
      const cleanJid = jid.replace(/@g\.us/g, '');
      // Only keep if it's all numbers
      return /^\d+$/.test(cleanJid) ? `${cleanJid}@g.us` : null;
    }).filter(jid => jid !== null)
      .slice(0, SAFETY.MAX_JIDS);

    if (validJids.length === 0) {
      return message.reply(
        "❌ No valid group JIDs found\n" +
        "Examples:\n" +
        ".fwd 120363411055156472@g.us,120363333939099948@g.us\n" +
        ".fwd 120363411055156472 120363333939099948"
      );
    }

    // ===== [YOUR MEDIA HANDLING CODE] ===== //
    const buffer = await message.quoted.download();
    const mtype = message.quoted.mtype;
    
    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: message.quoted.text || '',
          mimetype: message.quoted.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: message.quoted.text || '',
          mimetype: message.quoted.mimetype || "video/mp4"
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: message.quoted.ptt || false
        };
        break;
      default:
        return message.reply("❌ Only image, video, and audio messages are supported");
    }

    // ===== [SENDING WITH DELAYS] ===== //
    const startTime = Date.now();
    let successCount = 0;
    const failedJids = [];

    for (const [index, jid] of validJids.entries()) {
      try {
        await client.sendMessage(jid, messageContent);
        successCount++;
        
        // Progress update every 5 sends
        if ((index + 1) % 5 === 0) {
          await message.reply(`🔄 Sent to ${index + 1}/${validJids.length} groups...`);
        }

        // Apply delays
        const isExtraDelay = (index + 1) % 5 === 0;
        await new Promise(resolve => setTimeout(resolve, 
          isExtraDelay ? SAFETY.EXTRA_DELAY : SAFETY.BASE_DELAY));
        
      } catch (error) {
        failedJids.push({ jid, error: error.message.substring(0, 50) });
        await new Promise(resolve => setTimeout(resolve, SAFETY.BASE_DELAY));
      }
    }

    // ===== [FINAL REPORT] ===== //
    const duration = Math.round((Date.now() - startTime) / 1000);
    let report = `✅ *Forward Complete*\n\n` +
                 `📊 Success: ${successCount}/${validJids.length}\n` +
                 `⏱ Duration: ${duration}s\n` +
                 `📦 Media Type: ${mtype.replace('Message', '')}\n`;

    if (failedJids.length > 0) {
      report += `\n❌ Failed (${failedJids.length}):\n` +
                failedJids.slice(0, 3).map(f => 
                  `${f.jid.replace('@g.us', '')}: ${f.error}`
                ).join('\n');
      if (failedJids.length > 3) report += `\n...and ${failedJids.length - 3} more`;
    }

    await message.reply(report);

  } catch (error) {
    console.error("Forward Error:", error);
    await message.reply(
      `💢 Critical Error\n` +
      `${error.message.substring(0, 100)}\n\n` +
      `Please check:\n` +
      `1. JID formatting\n` +
      `2. Media type\n` +
      `3. Bot permissions`
    );
  }
});
