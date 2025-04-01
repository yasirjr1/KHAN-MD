const axios = require("axios");
const FormData = require('form-data');
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

    // Check image size (max 2MB for better API compatibility)
    if (mediaBuffer.length > 2 * 1024 * 1024) {
      return reply("❌ Image too large (max 2MB)");
    }

    // Create temporary file in memory
    const tempFile = {
      value: mediaBuffer,
      options: {
        filename: 'image.jpg',
        contentType: mimeType
      }
    };

    // Upload to Catbox with proper headers
    const form = new FormData();
    form.append('fileToUpload', tempFile.value, tempFile.options);

    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: {
        ...form.getHeaders(),
        'Accept': '*/*'
      },
      timeout: 30000
    });

    const imageUrl = uploadResponse.data;
    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw "Invalid image URL received from upload";
    }

    // Enhance image using Remini API with proper headers
    const enhanceResponse = await axios.get(`https://apis.davidcyriltech.my.id/remini?url=${encodeURIComponent(imageUrl)}`, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 60000,
      validateStatus: (status) => status < 500 // Don't throw for 412 errors
    });

    // Handle 412 error specifically
    if (enhanceResponse.status === 412) {
      return reply("❌ The image couldn't be enhanced (quality too low or content not supported)");
    }

    // Verify response is an image
    if (!enhanceResponse.headers['content-type']?.startsWith('image/')) {
      throw "API returned invalid image data";
    }

    // Send enhanced image back
    await client.sendMessage(message.from, {
      image: enhanceResponse.data,
      caption: `> ✨ Powered by JawadTechX`
    }, { quoted: message });

  } catch (error) {
    console.error('Remini Error:', error);
    let errorMsg = "❌ Failed to enhance image";
    
    if (error.response?.status === 404) {
      errorMsg = "🔍 The enhancement service is currently unavailable";
    } else if (error.message.includes('412')) {
      errorMsg = "❌ The image couldn't be enhanced (quality too low or content not supported)";
    } else if (error.message) {
      errorMsg += `\nError: ${error.message}`;
    }
    
    await reply(errorMsg);
  }
});
