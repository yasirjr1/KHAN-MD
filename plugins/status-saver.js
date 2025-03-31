const { cmd } = require("../command");

cmd({
  pattern: "send",
  alias: ["sendme", 'save'],
  react: '📤',
  desc: "Forwards quoted status message back to user",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from }) => {
  try {
    if (!message.quoted) return; // Silent exit if no quoted message

    const data = JSON.stringify(message.quoted, null, 2);
    const jsonData = JSON.parse(data);
    const isStatus = jsonData.extendedTextMessage?.contextInfo?.remoteJid;
    
    if (!isStatus) return; // Silent exit if not a status

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
        return; // Silent exit for unsupported types
    }

    await client.sendMessage(from, messageContent, { quoted: message });
  } catch (error) {
    console.error("Status Forward Error:", error);
    // No error reply to maintain silence
  }
});
