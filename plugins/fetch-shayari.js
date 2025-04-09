const { cmd } = require('../command');
const axios = require('axios');

// Fallback Urdu Shayaris
const urduShayaris = [
    "Dil ki baat labon tak na aane payi, \nHum woh hain jinki kahaani bhi adhoori hai",
    "Mohabbat mein humne kitni khata ki, \nKe sirf tumhe chahna hi sabse badi khata thi",
    "Teri yaad ka silsila chala gaya, \nAb to har saans mein teri khushboo basa hai"
];

// Fallback Romanized Hindi Shayaris
const hindiShayaris = [
    "Teri aankhon mein dekha to, \nDil ne kaha ye ghar bana lein",
    "Mohabbat sirf ek shabd nahi, \nYe to dil ki gehraiyon ka naam hai",
    "Tum mile to ye ehsaas hua, \nZindagi mein kuch kho kar bhi paaya hai"
];

cmd({
    pattern: "shayari2",
    alias: ["urdushayari"],
    desc: "Get random Urdu shayari",
    category: "fun",
    react: "✒️",
    filename: __filename
},
async (conn, m, { reply }) => {
    try {
        // Try API first
        const response = await axios.get('https://api.urdushayaris.com/v1/random', {
            timeout: 5000
        });
        
        if(response.data && response.data.status === "success") {
            return reply(`✒️ *Urdu Shayari:*\n\n"${response.data.shayari}"`);
        }
        
        // Fallback to local collection
        const randomIndex = Math.floor(Math.random() * urduShayaris.length);
        return reply(`✒️ *Urdu Shayari:*\n\n"${urduShayaris[randomIndex]}"\n\n(Using local collection)`);
        
    } catch (e) {
        console.error('API Error:', e.message);
        const randomIndex = Math.floor(Math.random() * urduShayaris.length);
        return reply(`✒️ *Urdu Shayari:*\n\n"${urduShayaris[randomIndex]}"\n\n(Using local collection)`);
    }
});

cmd({
    pattern: "shayari",
    alias: ["hindishayari", "poetry"],
    desc: "Get Hindi shayari in Roman script",
    category: "fun",
    react: "💘",
    filename: __filename
},
async (conn, m, { reply }) => {
    try {
        // Try reliable poetry API
        const response = await axios.get('https://poetrydb.org/random', {
            timeout: 5000
        });

        if(response.data && response.data[0]) {
            const lines = response.data[0].lines;
            const romanShayari = lines.join('\n');
            return reply(`💘 *Shayari:*\n\n"${romanShayari}"`);
        }
        
        // Fallback to local collection
        const randomIndex = Math.floor(Math.random() * hindiShayaris.length);
        return reply(`💘 *Shayari:*\n\n"${hindiShayaris[randomIndex]}"\n\n(Using local collection)`);
        
    } catch (e) {
        console.error('API Error:', e.message);
        const randomIndex = Math.floor(Math.random() * hindiShayaris.length);
        return reply(`💘 *Shayari:*\n\n"${hindiShayaris[randomIndex]}"\n\n(Using local collection)`);
    }
});
