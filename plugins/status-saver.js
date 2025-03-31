const { cmd } = require("../command");

cmd({
  pattern: "send",
  alias: ["sendme", 'vv3'],
  react: '📤',
  desc: "Forwards quoted message back to user",
  category: "utility",
  filename: __filename
}, async (client, m, match, { from, reply }) => { // Changed 'message' to 'm' for consistency
  try {
    if (!m.quoted) return reply("*Please Mention status*"); // Your requested change

    const buffer = await m.quoted.download();
    const mtype = m.quoted.mtype;
    const options = { quoted: m };

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: m.quoted.text || '',
          mimetype: m.quoted.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: m.quoted.text || '',
          mimetype: m.quoted.mimetype || "video/mp4"
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: m.quoted.ptt || false
        };
        break;
      default:
        return reply("❌ Only image, video, and audio messages are supported");
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("Forward Error:", error);
    reply("❌ Error forwarding message:\n" + error.message);
  }
});
