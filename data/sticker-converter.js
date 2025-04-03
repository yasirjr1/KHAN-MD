const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs');
const path = require('path');

class StickerConverter {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async convertStickerToImage(stickerBuffer) {
        const tempPath = path.join(this.tempDir, `sticker_${Date.now()}.webp`);
        const outputPath = path.join(this.tempDir, `image_${Date.now()}.png`);

        try {
            // Save sticker buffer to temp file
            await fs.promises.writeFile(tempPath, stickerBuffer);

            // Convert using wa-sticker-formatter
            const sticker = new Sticker(tempPath, {
                type: StickerTypes.FULL,
                pack: 'Converted',
                author: 'Sticker Converter',
                quality: 100,
            });

            // Get image buffer
            const imageBuffer = await sticker.toImage();

            // Cleanup
            await fs.promises.unlink(tempPath).catch(() => {});

            return imageBuffer;
        } catch (error) {
            // Cleanup if error occurs
            await fs.promises.unlink(tempPath).catch(() => {});
            await fs.promises.unlink(outputPath).catch(() => {});
            throw error;
        }
    }
}

module.exports = new StickerConverter();
