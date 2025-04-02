const { cmd } = require("../command");

// Safety Configuration
const SAFETY = {
  MAX_JIDS: 15,
  BASE_DELAY: 5000, // 5 seconds
  EXTRA_DELAY: 10000, // 10 seconds every 3rd send
};

cmd({
  pattern: "forward",
  alias: ["fwd"],
  desc: "Ultra-safe bulk forward with media support",
  category: "owner",
  filename: __filename
}, async (client, message, args, { isOwner }) => {
  try {
    // ===== [VALIDATION CHECKS] ===== //
    if (!isOwner) return message.reply("*📛 Owner Only Command*");
    
    // Your exact quoted message check
    if (!message.quoted) {
      return message.reply("*🍁 Please reply to a message!*");
    }

    // ===== [JID PROCESSING] ===== //
    let rawJids = [];
    if (typeof args === 'string') {
      rawJids = args.split(/[\s,]+/);
    } else if (Array.isArray(args)) {
      rawJids = args.flatMap(arg => arg.split(/[\s,]+/));
    }

    const validJids = rawJids
      .map(jid => jid.trim().replace('@g.us', ''))
      .filter(jid => /^\d+$/.test(jid))
      .map(jid => `${jid}@g.us`)
      .slice(0, SAFETY.MAX_JIDS);

    if (validJids.length === 0) {
      return message.reply(
        "❌ Invalid group JIDs\n" +
        "Format: .fwd 12345678 87654321\n" +
        "OR: .fwd 1234@g.us,5678@g.us"
      );
    }

    // ===== [YOUR EXACT MEDIA HANDLING CODE] ===== //
    const buffer = await message.quoted.download();
    const mtype = message.quoted.mtype;
    const options = { quoted: message };

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

    // ===== [SAFE SENDING WITH DELAYS] ===== //
    const results = [];
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const [index, jid] of validJids.entries()) {
      try {
        await client.sendMessage(jid, messageContent);
        results.push({ jid, status: '✅' });
        
        // Apply smart delays
        const isExtraDelay = (index + 1) % 3 === 0;
        await delay(isExtraDelay ? SAFETY.EXTRA_DELAY : SAFETY.BASE_DELAY);
        
      } catch (error) {
        results.push({ jid, status: '❌', error: error.message });
        await delay(SAFETY.BASE_DELAY);
      }
    }

    // ===== [RESULT REPORTING] ===== //
    const successCount = results.filter(r => r.status === '✅').length;
    let report = `🛡️ *Forward Results*\n\n` +
                 `📤 Success: ${successCount}/${validJids.length}\n` +
                 `⏱ Delays: ${SAFETY.BASE_DELAY/1000}s base (${SAFETY.EXTRA_DELAY/1000}s every 3rd)\n` +
                 `📦 Media Type: ${mtype.replace('Message', '')}\n`;

    const failed = results.filter(r => r.status === '❌');
    if (failed.length > 0) {
      report += `\n❌ Failed (${failed.length}):\n` +
                failed.slice(0, 3).map(f => 
                  `${f.jid.replace('@g.us', '')}: ${f.error.substring(0, 30)}...`
                ).join('\n');
    }

    await message.reply(report);

  } catch (error) {
    console.error("Forward Error:", error);
    await message.reply(
      `💢 Error: ${error.message.substring(0, 100)}\n\n` +
      `⚠️ Please check:\n` +
      `1. Media type support\n` +
      `2. Group permissions\n` +
      `3. Bot connectivity`
    );
  }
});
