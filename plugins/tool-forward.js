const { cmd } = require("../command");

// Safety Configuration
const SAFETY = {
  MAX_JIDS: 15,
  DELAY: 5000, // 5 seconds
  DELAY_EVERY: 3,
  EXTRA_DELAY: 10000 // 10 seconds
};

cmd({
  pattern: "forward",
  alias: ["fwd", "blast"],
  desc: "Ultra-safe bulk forward",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isOwner }) => {
  try {
    // ===== [VALIDATION CHECKS] ===== //
    if (!isOwner) return await client.sendMessage(from, { 
      text: "*📛 Owner Only Command*" 
    }, { quoted: message });

    if (!message.quoted) return await client.sendMessage(from, { 
      text: "*🔎 Reply to a message*" 
    }, { quoted: message });

    // ===== [JID PROCESSING FIX] ===== //
    const rawJids = (match || "").split(/\s*,\s*/) // Fix: Handle null/undefined match
      .filter(jid => jid && /\d+/.test(jid)); // Only keep valid number formats

    if (!rawJids.length) return await client.sendMessage(from, {
      text: "*❗ Example: .forward 1234,5678,9012*"
    }, { quoted: message });

    const limitedJids = rawJids
      .slice(0, SAFETY.MAX_JIDS)
      .map(jid => jid.includes('@') ? jid : jid + '@g.us');

    // ===== [MEDIA HANDLING] ===== //
    const buffer = await message.quoted.download();
    const quoted = message.quoted;
    
    // [Rest of your media handling code...]
    
    // ===== [SAFE SENDING] ===== //
    let success = 0;
    const failedJids = [];
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const [index, jid] of limitedJids.entries()) {
      try {
        await client.sendMessage(jid, messageContent);
        success++;
        
        // Apply smart delays
        const isExtraDelay = (index + 1) % SAFETY.DELAY_EVERY === 0;
        await delay(isExtraDelay ? SAFETY.EXTRA_DELAY : SAFETY.DELAY);
        
      } catch (error) {
        failedJids.push(jid);
        await delay(SAFETY.DELAY); // Delay even on failure
      }
    }

    // [Rest of your reporting code...]

  } catch (error) {
    console.error("Forward Error:", error);
    await client.sendMessage(from, {
      text: `💢 Error: ${error.message}\n\n` +
            `⚠️ Please check:\n` +
            `1. JID formatting\n` +
            `2. Network connection\n` +
            `3. Message type support`
    }, { quoted: message });
  }
});
