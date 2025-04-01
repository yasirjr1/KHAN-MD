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
      return reply("⚠️ Please reply to a JPEG/PNG image file");
    }

    // Download the image
    const mediaBuffer = await quotedMsg.download();
    const fileSize = mediaBuffer.length;
    
    if (fileSize > 5 * 1024 * 1024) {
      return reply("❌ Image too large (max 5MB)");
    }

    // Upload to Catbox
    const form = new FormData();
    form.append('fileToUpload', mediaBuffer, 'image.jpg');
    
    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    const imageUrl = uploadResponse.data;
    if (!imageUrl) throw "Failed to upload image to Catbox";

    // Enhance image using Remini API
    const enhanceResponse = await axios.get(`https://apis.davidcyriltech.my.id/remini?url=${encodeURIComponent(imageUrl)}`, {
      responseType: 'arraybuffer', // Important for receiving image data
      timeout: 60000
    });

    // Check if response is actually an image
    const contentType = enhanceResponse.headers['content-type'];
    if (!contentType?.startsWith('image/')) {
      throw "API did not return a valid image";
    }

    // Send enhanced image back
    await client.sendMessage(message.from, {
      image: enhanceResponse.data, // Directly use the image buffer
      caption: `> © ✨ Powered by JawadTechX`
    }, { quoted: message });

  } catch (error) {
    console.error('Remini Error:', error);
    let errorMsg = "❌ Failed to enhance image";
    
    if (error.response?.status === 404) {
      errorMsg = "🔍 The enhancement API is currently unavailable";
    } else if (error.message) {
      errorMsg += `\nError: ${error.message}`;
    }
    
    await reply(errorMsg);
  }
});
