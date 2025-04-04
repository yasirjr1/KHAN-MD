const fs = require('fs');
const path = require('path');
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
  // Enhanced debug system
  const debug = {
    log: [],
    add: (msg) => {
      console.log('DEBUG:', msg);
      debug.log.push(msg);
      return msg;
    },
    getLog: () => debug.log.join('\n• ')
  };

  // Temp file management
  const tempFiles = [];
  const cleanUp = async () => {
    for (const file of tempFiles) {
      try {
        if (fs.existsSync(file)) await fs.promises.unlink(file);
      } catch {}
    }
  };

  try {
    // 1. Initial validations
    if (!isOwner) {
      debug.add('Failed: Not owner');
      return await message.reply("❌ Owner only command");
    }

    if (!message.quoted?.audio) {
      debug.add('Failed: No quoted audio');
      return await message.reply("❌ Reply to a voice message");
    }

    debug.add('Starting status upload process');

    // 2. Prepare temp directory
    const tempDir = path.join(__dirname, '../temp_status');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    debug.add(`Using temp dir: ${tempDir}`);

    // 3. Download original audio
    const buffer = await message.quoted.download();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
    await fs.promises.writeFile(inputPath, buffer);
    tempFiles.push(inputPath);
    debug.add(`Saved input audio (${buffer.length} bytes)`);

    // 4. Convert to WhatsApp-compatible format
    const outputPath = path.join(tempDir, `status_${Date.now()}.opus`);
    tempFiles.push(outputPath);

    debug.add('Starting audio conversion...');
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libopus')
        .audioBitrate('64k')
        .audioFrequency(48000)
        .audioChannels(1)
        .outputOptions([
          '-vbr on',
          '-compression_level 10',
          '-application voip' // Critical for WhatsApp
        ])
        .format('ogg')
        .on('start', (cmd) => debug.add(`FFmpeg command: ${cmd}`))
        .on('progress', (p) => debug.add(`Progress: ${Math.round(p.percent)}%`))
        .on('error', (err) => {
          debug.add(`Conversion failed: ${err.message}`);
          reject(err);
        })
        .on('end', () => {
          debug.add('Conversion completed');
          resolve();
        })
        .save(outputPath);
    });

    // 5. Verify converted file
    const finalBuffer = await fs.promises.readFile(outputPath);
    debug.add(`Converted file size: ${finalBuffer.length} bytes`);
    
    if (finalBuffer.length < 1024) {
      throw new Error('Converted file too small (likely conversion failed)');
    }

    // 6. Attempt status upload (multiple methods)
    debug.add('Attempting status upload...');
    let uploadSuccess = false;
    const uploadMethods = [
      {
        name: 'status@broadcast',
        method: async () => {
          await client.sendMessage('status@broadcast', {
            audio: finalBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            waveform: Buffer.alloc(5), // Required
            contextInfo: {
              isForwarded: false,
              externalAdReply: { showAdAttribution: false }
            }
          });
        }
      },
      {
        name: 'updateProfileStatus',
        method: async () => {
          await client.updateProfileStatus(finalBuffer, {
            type: 'audio',
            isVoiceNote: true
          });
        }
      }
    ];

    for (const method of uploadMethods) {
      try {
        debug.add(`Trying upload method: ${method.name}`);
        await method.method();
        uploadSuccess = true;
        debug.add(`Upload succeeded via ${method.name}`);
        break;
      } catch (err) {
        debug.add(`Method ${method.name} failed: ${err.message}`);
      }
    }

    if (!uploadSuccess) {
      throw new Error('All upload methods failed');
    }

    // 7. Final confirmation
    await message.reply("✅ Status uploaded successfully!\n" +
      `• Format: Ogg/Opus\n` +
      `• Size: ${Math.round(finalBuffer.length/1024)}KB`);

  } catch (error) {
    debug.add(`FINAL ERROR: ${error.message}`);
    console.error('FULL ERROR TRACE:', error);
    
    await message.reply(
      `❌ Failed to upload status\n\n` +
      `Technical Details:\n` +
      `• Error: ${error.message}\n` +
      `• Debug Log:\n${debug.getLog()}\n\n` +
      `Possible Solutions:\n` +
      `1. Try with personal (non-business) number\n` +
      `2. Test with shorter audio (5 seconds)\n` +
      `3. Check FFmpeg installation\n` +
      `4. Verify account can post status manually`
    );
  } finally {
    await cleanUp();
  }
});
