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
  // Debugging setup
  const debugLog = [];
  const addDebug = (msg) => {
    debugLog.push(msg);
    console.log('DEBUG:', msg);
  };

  try {
    // 1. Validate permissions and input
    if (!isOwner) return await message.reply("*📛 Owner only command*");
    if (!message.quoted?.audio) return await message.reply("*❌ Reply to a voice message*");

    addDebug('Starting status upload process');

    // 2. Create temp directory
    const tempDir = path.join(__dirname, '../temp_status');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    addDebug(`Temp directory: ${tempDir}`);

    // 3. Download audio
    const buffer = await message.quoted.download();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
    await fs.promises.writeFile(inputPath, buffer);
    addDebug(`Downloaded audio (${buffer.length} bytes)`);

    // 4. Convert with EXACT WhatsApp voice status specs
    const outputPath = path.join(tempDir, `status_${Date.now()}.opus`);
    addDebug('Starting conversion...');

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libopus')
        .audioBitrate('64k')
        .audioFrequency(48000)
        .audioChannels(1)
        .outputOptions([
          '-vbr on',
          '-compression_level 10',
          '-application voip'
        ])
        .format('ogg')
        .on('start', (cmd) => addDebug(`FFmpeg command: ${cmd}`))
        .on('progress', (p) => addDebug(`Conversion progress: ${p.targetSize}KB`))
        .on('error', (err) => {
          addDebug(`Conversion error: ${err.message}`);
          reject(err);
        })
        .on('end', () => {
          addDebug('Conversion completed');
          resolve();
        })
        .save(outputPath);
    });

    // 5. Verify converted file
    const finalBuffer = await fs.promises.readFile(outputPath);
    addDebug(`Converted file size: ${finalBuffer.length} bytes`);

    if (finalBuffer.length < 1024) {
      throw new Error('Converted file too small - conversion failed');
    }

    // 6. Upload with ALL required parameters
    addDebug('Attempting status upload...');
    const uploadStart = Date.now();

    // METHOD 1: Primary upload approach
    try {
      await client.sendMessage('status@broadcast', {
        audio: finalBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        waveform: Buffer.from([0, 0, 0, 0, 0]), // Required dummy waveform
        contextInfo: {
          isForwarded: false,
          forwardingScore: 0,
          externalAdReply: {
            showAdAttribution: false
          }
        }
      });
      addDebug(`Upload completed in ${Date.now() - uploadStart}ms`);
    } catch (method1Error) {
      addDebug(`Method 1 failed: ${method1Error.message}`);
      
      // METHOD 2: Fallback approach
      try {
        await client.updateProfileStatus(finalBuffer, {
          type: 'audio',
          isVoiceNote: true,
          caption: ""
        });
        addDebug('Fallback method succeeded');
      } catch (method2Error) {
        addDebug(`Method 2 failed: ${method2Error.message}`);
        throw new Error(`Both methods failed:\n1. ${method1Error.message}\n2. ${method2Error.message}`);
      }
    }

    await message.reply("✅ Status updated successfully!\n" + 
      `• Format: Ogg/Opus\n` +
      `• Duration: ${Math.round(finalBuffer.length/64000)} seconds\n` +
      `• Size: ${Math.round(finalBuffer.length/1024)}KB`);

  } catch (error) {
    console.error('FULL ERROR:', error);
    const debugInfo = debugLog.join('\n• ');
    await message.reply(
      `❌ FAILED: ${error.message}\n\n` +
      `DEBUG LOG:\n• ${debugInfo}\n\n` +
      `TROUBLESHOOT:\n1. Try shorter audio (5s)\n` +
      `2. Use personal number\n3. Check FFmpeg install`
    );
  } finally {
    // Cleanup temp files
    ['inputPath', 'outputPath'].forEach(async (varName) => {
      if (global[varName] && fs.existsSync(global[varName])) {
        await fs.promises.unlink(global[varName]).catch(() => {});
      }
    });
  }
});
