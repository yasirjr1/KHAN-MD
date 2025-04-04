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
  desc: "Upload replied audio to WhatsApp status",
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
    // 1. Validate permissions and message
    if (!isOwner) {
      return await client.sendMessage(from, { text: "*📛 Owner only command*" }, { quoted: message });
    }

    if (!match.quoted || match.quoted.mtype !== "audioMessage") {
      return await client.sendMessage(from, { text: "*❌ Reply to a voice message*" }, { quoted: message });
    }

    // 2. Download and convert audio
    const buffer = await match.quoted.download();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
    const outputPath = path.join(tempDir, `status_${Date.now()}.opus`);
    await fs.promises.writeFile(inputPath, buffer);

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
          return reject(new Error(`FFmpeg error: ${stderr}`));
        }
        try {
          resolve(await fs.promises.readFile(outputPath));
        } finally {
          await cleanFile(outputPath);
        }
      });
      ffmpeg.on('error', reject);
    });

    // 3. Prepare message for status
    const statusMessage = {
      audio: convertedBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      contextInfo: {
        isForwarded: false
      }
    };

    // 4. Alternative status upload method
    await client.updateProfileStatus(convertedBuffer, {
      type: 'audio',
      isVoiceNote: true
    });

    // 5. Success confirmation
    await client.sendMessage(from, {
      text: "✅ Status updated! Check your WhatsApp status tab."
    }, { quoted: message });

  } catch (error) {
    console.error('Status Error:', error);
    await client.sendMessage(from, {
      text: `❌ Failed: ${error.message}\n\nPossible reasons:\n1. Your number can't post status\n2. Audio too long\n3. Server restrictions`
    }, { quoted: message });
  }
});
