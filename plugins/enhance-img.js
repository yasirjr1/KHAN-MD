const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require("path");
const { cmd } = require("../command");

cmd({
  pattern: "remini",
  alias: ["enhance", "rimini"],
  react: '✨', 
  desc: "Enhance image quality using AI",
  category: "utility",
  use: ".remini [reply to image]",
  filename: __filename
}, async (client, message, { reply, quoted }) => {
  try {
    // Check if quoted message exists and is an image
    const quotedMsg = quoted || message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType || !mimeType.startsWith('image/')) {
      return reply("Please reply to an image file (JPEG/PNG)");
    }

    // Download the image
    const mediaBuffer = await quotedMsg.download();
    
    // Get file extension
    let extension = mimeType.includes('image/jpeg') ? '.jpg' : 
                   mimeType.includes('image/png') ? '.png' : 
                   '.jpg'; // default

    const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    // Upload to Catbox
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), `image${extension}`);
    form.append('reqtype', 'fileupload');

    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    const imageUrl = uploadResponse.data;
    fs.unlinkSync(tempFilePath); // Clean up

    if (!imageUrl) throw "Failed to upload image";

    // Enhance image using Remini API
    const enhanceUrl = `https://apis.davidcyriltech.my.id/remini?url=${encodeURIComponent(imageUrl)}`;
    const enhanceResponse = await axios.get(enhanceUrl);

    if (!enhanceResponse.data.status) {
      throw enhanceResponse.data.error || "Enhancement failed";
    }

    // Send enhanced image back
    await client.sendMessage(message.from, {
      image: { url: enhanceResponse.data.url || enhanceResponse.data.image },
      caption: `> *© ✨ Powered by JawadTechX*`
    }, { quoted: message });

  } catch (error) {
    console.error('Remini Error:', error);
    await reply(`❌ Error: ${error.message || error}`);
  }
});
