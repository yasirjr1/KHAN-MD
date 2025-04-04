const fs = require('fs');
const path = require('path');
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
  // Create temp directory if not exists
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const cleanFile = async (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      try { await fs.promises.unlink(filePath) } catch {}
    }
  };

  try {
    if (!isOwner) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to an audio message!*"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;

    if (mtype !== "audioMessage") {
      return await client.sendMessage(from, {
        text: "*❌ Only audio messages can be uploaded to status as voice notes.*"
      }, { quoted: message });
    }

    // Generate unique temp file names
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.opus`);

    // Save original audio to temp file
    await fs.promises.writeFile(inputPath, buffer);

    // Convert to WhatsApp-compatible Opus format
    const convertedBuffer = await new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        '-y',
        '-i', inputPath,
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-compression_level', '10',
        outputPath
      ], { timeout: 30000 });

      let errorOutput = '';
      ffmpeg.stderr.on('data', (data) => errorOutput += data.toString());

      ffmpeg.on('close', async (code) => {
        await cleanFile(inputPath);
        
        if (code !== 0) {
          await cleanFile(outputPath);
          return reject(new Error(`FFmpeg failed: ${errorOutput}`));
        }

        try {
          const result = await fs.promises.readFile(outputPath);
          await cleanFile(outputPath);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });

      ffmpeg.on('error', reject);
    });

    // Upload to status
    await client.sendMessage(
      'status@broadcast',
      {
        audio: convertedBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      }
    );

    await client.sendMessage(from, {
      text: "✅ Audio successfully uploaded to your status!"
    }, { quoted: message });

  } catch (error) {
    console.error("Status Error:", error);
    await client.sendMessage(from, {
      text: `❌ Failed to upload status:\n${error.message}`
    }, { quoted: message });
  }
});
