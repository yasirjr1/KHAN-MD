const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cmd } = require("../command");
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(require('@ffmpeg-installer/ffmpeg').path);

cmd({
  pattern: "statusup",
  alias: ["poststatus"],
  react: '📢',
  desc: "Upload audio status (voice note)",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isOwner }) => {
  try {
    // 1. Validate permissions and input
    if (!isOwner) return await message.reply("*📛 Owner only command*");
    if (!message.quoted?.audio) return await message.reply("*❌ Reply to a voice message*");

    // 2. Create temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 3. Download and convert with precise WhatsApp requirements
    const buffer = await message.quoted.download();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
    const outputPath = path.join(tempDir, `status_${Date.now()}.opus`);
    
    await fs.promises.writeFile(inputPath, buffer);

    // 4. EXACT WhatsApp voice status specification
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libopus')
        .audioBitrate('64k')
        .audioFrequency(48000)
        .audioChannels(1)
        .outputOptions([
          '-vbr on',
          '-compression_level 10',
          '-application voip' // CRUCIAL for WhatsApp voice notes
        ])
        .format('ogg')
        .on('error', reject)
        .on('end', resolve)
        .save(outputPath);
    });

    // 5. Load converted file
    const finalBuffer = await fs.promises.readFile(outputPath);

    // 6. Upload with ALL required parameters
    await client.sendMessage('status@broadcast', {
      audio: finalBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      waveform: Buffer.from([0, 0, 0, 0, 0]), // Required dummy waveform
      contextInfo: { 
        externalAdReply: {
          showAdAttribution: false
        }
      }
    });

    await message.reply("✅ Status updated successfully!");

  } catch (error) {
    console.error('Status Error:', error);
    await message.reply(`❌ Failed: ${error.message}\nTry:\n1. Using personal number\n2. Shorter audio\n3. Restarting phone`);
  } finally {
    // Cleanup temp files
    [inputPath, outputPath].forEach(file => {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
});
