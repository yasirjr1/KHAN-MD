const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StickerConverter {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.ensureTempDir();
        this.checkDependencies();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    checkDependencies() {
        try {
            // Check if ffmpeg is installed
            execSync('ffmpeg -version', { stdio: 'ignore' });
        } catch (e) {
            throw new Error('FFmpeg is not installed. Please install ffmpeg first.');
        }
    }

    async convertStickerToImage(stickerBuffer) {
        if (!stickerBuffer || stickerBuffer.length < 100) {
            throw new Error('Invalid sticker file - file too small or empty');
        }

        const tempPath = path.join(this.tempDir, `sticker_${Date.now()}.webp`);
        const outputPath = path.join(this.tempDir, `image_${Date.now()}.png`);

        try {
            await fs.promises.writeFile(tempPath, stickerBuffer);

            // First try with wa-sticker-formatter
            try {
                const sticker = new Sticker(tempPath, {
                    type: StickerTypes.FULL,
                    quality: 100,
                });
                return await sticker.toImage();
            } catch (formatterError) {
                console.log('Falling back to direct ffmpeg conversion');
                // Fallback to direct ffmpeg conversion
                execSync(`ffmpeg -y -i ${tempPath} ${outputPath}`);
                return await fs.promises.readFile(outputPath);
            }
        } catch (error) {
            console.error('Conversion error:', error);
            throw new Error(`Conversion failed: ${error.message}`);
        } finally {
            // Cleanup files
            await Promise.all([
                fs.promises.unlink(tempPath).catch(() => {}),
                fs.promises.unlink(outputPath).catch(() => {})
            ]);
        }
    }
}

module.exports = new StickerConverter();
