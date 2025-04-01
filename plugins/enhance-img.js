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
      return reply("⚠️ Please reply to an image file (JPEG/PNG)");
    }

    // Download the image
    const mediaBuffer = await quotedMsg.download();
    const fileSize = mediaBuffer.length;
    
    if (fileSize > 5 * 1024 * 1024) { // 5MB limit
      return reply("❌ Image too large (max 5MB)");
    }

    // Get file extension
    let extension = mimeType.includes('image/jpeg') ? '.jpg' : 
                   mimeType.includes('image/png') ? '.png' : 
                   '.jpg';

    const tempFilePath = path.join(os.tmpdir(), `remini_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    // Upload to Catbox
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), `image${extension}`);
    form.append('reqtype', 'fileupload');

    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 30000 // 30 seconds timeout
    });

    const imageUrl = uploadResponse.data;
    fs.unlinkSync(tempFilePath); // Clean up

    if (!imageUrl) throw "Failed to upload image to Catbox";

    // Enhance image using Remini API
    const enhanceUrl = `https://apis.davidcyriltech.my.id/remini?url=${encodeURIComponent(imageUrl)}`;
    const enhanceResponse = await axios.get(enhanceUrl, { timeout: 60000 }); // 60 seconds timeout

    // Check for different possible response formats
    let enhancedImageUrl;
    if (enhanceResponse.data?.url) {
      enhancedImageUrl = enhanceResponse.data.url;
    } else if (enhanceResponse.data?.image) {
      enhancedImageUrl = enhanceResponse.data.image;
    } else if (enhanceResponse.data?.result?.url) {
      enhancedImageUrl = enhanceResponse.data.result.url;
    } else {
      throw "API returned no valid image URL";
    }

    // Verify the enhanced image exists
    const headResponse = await axios.head(enhancedImageUrl);
    if (!headResponse.headers['content-type']?.startsWith('image/')) {
      throw "Enhanced image verification failed";
    }

    // Send enhanced image back
    await client.sendMessage(message.from, {
      image: { url: enhancedImageUrl },
      caption: `> © Powered by JawadTechX`
    }, { quoted: message });

  } catch (error) {
    console.error('Remini Error:', error);
    let errorMsg = "❌ Failed to enhance image";
    
    if (error.response?.data?.error) {
      errorMsg += `\nReason: ${error.response.data.error}`;
    } else if (error.message) {
      errorMsg += `\nError: ${error.message}`;
    }
    
    await reply(errorMsg);
  }
});
