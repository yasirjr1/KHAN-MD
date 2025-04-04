const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cmd } = require("../command");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

cmd({
  pattern: "statusup",
  alias: ["uploadstatus", "poststatus"],
  react: '📢',
  desc: "Upload replied audio to WhatsApp status (as voice note)",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isOwner }) => {
  // Temp directory setup
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const cleanFile = async (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      try { await fs.promises.unlink(filePath) } catch {}
    }
  };

  try {
    // Permission check
    if (!isOwner) {
      return await client.sendMessage(from, { text: "*📛 Owner only command*" }, { quoted: message });
    }

    // Validate quoted message
    if (!match.quoted || match.quoted.mtype !== "audioMessage") {
      return await client.sendMessage(from, { text: "*❌ Reply to a voice message*" }, { quoted: message });
    }

    // 1. Download and prepare audio
    const buffer = await match.quoted.download();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
    const outputPath = path.join(tempDir, `status_${Date.now()}.opus`);
    await fs.promises.writeFile(inputPath, buffer);

    // 2. Convert to WhatsApp-compatible format
    const convertedBuffer = await new Promise((resolve, reject) => {
      const args = [
        '-y', '-i', inputPath,
        '-vn', '-c:a', 'libopus',
        '-b:a', '64k', '-ar', '48000',
        '-ac', '1', '-vbr', 'on',
        '-compression_level', '10',
        '-f', 'ogg', outputPath
      ];
      
      const ffmpeg = spawn(ffmpegPath, args, { timeout: 30000 });
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => stderr += data.toString());
      ffmpeg.on('close', async (code) => {
        await cleanFile(inputPath);
        if (code !== 0) {
          await cleanFile(outputPath);
          return reject(new Error(`FFmpeg failed: ${stderr}`));
        }
        try {
          resolve(await fs.promises.readFile(outputPath));
        } finally {
          await cleanFile(outputPath);
        }
      });
      ffmpeg.on('error', reject);
    });

    // 3. Generate required hashes
    const fileHash = crypto.createHash('sha256').update(convertedBuffer).digest('hex');
    const fileEncSha256 = crypto.createHash('sha256').update(convertedBuffer).digest('base64');

    // 4. Upload to status with all required parameters
    await client.sendMessage('status@broadcast', {
      audio: convertedBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      fileSha256: fileHash,
      fileEncSha256: fileEncSha256,
      fileLength: convertedBuffer.length,
      seconds: Math.floor(convertedBuffer.length / 16000), // Approximate duration
      mediaKeyTimestamp: Date.now(),
      contextInfo: {}
    }, {
      upload: true,
      mediaUploadTimeoutMs: 60000
    });

    // 5. Confirm successful upload
    await client.sendMessage(from, {
      text: "✅ Status updated! (May take 1-2 minutes to appear)"
    }, { quoted: message });

  } catch (error) {
    console.error('Status Upload Error:', error);
    await client.sendMessage(from, {
      text: `❌ Failed: ${error.message}\n\nNote: Some numbers can't post status updates`
    }, { quoted: message });
  }
});
