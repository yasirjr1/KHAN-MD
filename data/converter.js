const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  const tmp = path.join(__dirname, '../src', `${Date.now()}.${ext}`);
  const out = `${tmp}.${ext2}`;
  
  try {
    // Write input file
    await fs.promises.writeFile(tmp, buffer);
    
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegPath, [
        '-y',
        '-i', tmp,
        ...args,
        out
      ]);
      
      let stderr = '';
      
      ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpegProcess.on('error', (err) => {
        reject(new Error(`FFmpeg process error: ${err.message}`));
      });
      
      ffmpegProcess.on('close', async (code) => {
        try {
          await fs.promises.unlink(tmp); // Cleanup input file
          
          if (code !== 0) {
            return reject(new Error(`FFmpeg process exited with code ${code}. Error: ${stderr}`));
          }
          
          const outputData = await fs.promises.readFile(out);
          await fs.promises.unlink(out); // Cleanup output file
          resolve(outputData);
        } catch (e) {
          reject(new Error(`File operation error: ${e.message}`));
        }
      });
    });
  } catch (err) {
    // Cleanup if error occurs before spawn
    try { await fs.promises.unlink(tmp); } catch {}
    throw new Error(`Initial setup error: ${err.message}`);
  }
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-ac', '2',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3'
  ], ext, 'mp3');
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus');
}

module.exports = { toAudio, toPTT, ffmpeg };
