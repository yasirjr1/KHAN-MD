const { cmd } = require("../command");

cmd({
  pattern: "send",
  alias: ["sendme", 'vv3'],
  react: '📤',
  desc: "Forwards a status message to your chat",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from }) => {
  try {
    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*❌ Please reply to a status message!*"
      }, { quoted: message });
    }

    // Enhanced status detection that works for both your own and others' statuses
    const isStatus = match.quoted?.key?.remoteJid === "status@broadcast" || 
                    (match.quoted?.key?.id?.startsWith("3EB0") && 
                     match.contextInfo?.isForwarded === false);

    if (!isStatus) {
      return await client.sendMessage(from, {
        text: "*⚠️ This command only works on status messages!*\n\n_Reply directly to a status update (image/video), whether it's yours or someone else's._"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const options = { quoted: message };

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: match.quoted.text || '',
          mimetype: match.quoted.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: match.quoted.text || '',
          mimetype: match.quoted.mimetype || "video/mp4"
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "*❌ Only image and video statuses are supported.*"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("Status Forward Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error forwarding status:\n" + error.message
    }, { quoted: message });
  }
});
