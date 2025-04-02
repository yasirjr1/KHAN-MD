const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

class Converter {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async cleanFiles(...files) {
        for (const file of files) {
            if (file && fs.existsSync(file)) {
                await fs.promises.unlink(file).catch(console.error);
            }
        }
    }

    async ffmpeg(buffer, args = [], ext = '', ext2 = '') {
        const timestamp = Date.now();
        const tmp = path.join(this.tempDir, `${timestamp}.${ext}`);
        const out = path.join(this.tempDir, `${timestamp}.${ext2}`);

        try {
            await fs.promises.writeFile(tmp, buffer);
            
            return new Promise((resolve, reject) => {
                const ffmpegProcess = spawn(ffmpegPath, [
                    '-y',
                    '-i', tmp,
                    ...args,
                    out
                ], {
                    stdio: 'pipe',
                    timeout: 60000
                });

                let stderr = '';
                const timer = setTimeout(() => {
                    ffmpegProcess.kill();
                    reject(new Error('Conversion timed out (60s)'));
                }, 60000);

                ffmpegProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                ffmpegProcess.on('error', (err) => {
                    clearTimeout(timer);
                    reject(err);
                });

                ffmpegProcess.on('close', async (code) => {
                    clearTimeout(timer);
                    try {
                        await this.cleanFiles(tmp);
                        
                        if (code !== 0) {
                            throw new Error(`FFmpeg failed (code ${code})\n${stderr}`);
                        }

                        if (!fs.existsSync(out)) {
                            throw new Error('Output file not created');
                        }

                        const result = await fs.promises.readFile(out);
                        await this.cleanFiles(out);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        } catch (err) {
            await this.cleanFiles(tmp, out);
            throw err;
        }
    }

    async toAudio(buffer, ext) {
        return this.ffmpeg(buffer, [
            '-vn',
            '-ac', '2',
            '-b:a', '128k',
            '-ar', '44100',
            '-f', 'mp3'
        ], ext, 'mp3');
    }

    async toPTT(buffer, ext) {
        return this.ffmpeg(buffer, [
            '-vn',
            '-c:a', 'libopus',
            '-b:a', '128k',
            '-vbr', 'on',
            '-compression_level', '10'
        ], ext, 'opus');
    }
}

module.exports = new Converter();
