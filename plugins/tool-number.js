const { cmd, commands } = require("../command");
const axios = require("axios");

cmd({
    pattern: "templist",
    alias: ["tempnumberlist", "tempnlist", "listnumbers"],
    desc: "Show list of countries with temp numbers",
    category: "tools",
    react: "🌍",
    filename: __filename,
    use: ".templist"
},
async (conn, m, { reply }) => {
    try {
        const { data } = await axios.get("https://api.vreden.my.id/api/tools/fakenumber/country");

        if (!data || !data.result) return reply("❌ Couldn't fetch country list.");

        const countries = data.result.map((c, i) => `*${i + 1}.* ${c.title} \`(${c.id})\``).join("\n");

        await reply(`🌍 *Total Available Countries:* ${data.result.length}\n\n${countries}`);
    } catch (e) {
        console.error("TEMP LIST ERROR:", e);
        reply("❌ Failed to fetch temporary number country list.");
    }
});

cmd({
    pattern: "tempnum",
    alias: ["getnumber", "gennumber", "fakenumber"],
    desc: "Get temporary numbers for specific country",
    category: "tools",
    react: "📱",
    filename: __filename,
    use: ".tempnum <country_code>"
},
async (conn, m, { args, reply }) => {
    const countryCode = args[0]?.toLowerCase();
    if (!countryCode) return reply("❌ Missing country code!\nExample: `.tempnum us`");

    try {
        const { data } = await axios.get(`https://api.vreden.my.id/api/tools/fakenumber/listnumber?id=${countryCode}`);
        
        // Validate API response structure
        if (!data || !Array.isArray(data.result) || data.result.length === 0) {
            return reply("⚠️ No numbers found or invalid country code!");
        }

        // Safely extract first entry's country
        const firstEntry = data.result[0] || {};
        const country = firstEntry.country || "Unknown Country";

        // Generate number list
        const numberList = data.result
            .map((num, index) => `${index + 1}. ${num.number || 'Invalid Number'}`)
            .join('\n');

        return reply(
            `╭───[ 📱 TEMP NUMBERS ]───◆\n` +
            `│ 🌐 Country: ${country}\n` +
            `│ 🔢 Available Numbers:\n` +
            `${numberList}\n` +
            `│\n│ ✨ Use: \`.otpbox <number>\` to check OTPs\n` +
            `╰───[ Powered by KHAN MD ]───◆`
        );
        
    } catch (error) {
        console.error("Temp Number Error:", error);
        return reply("❌ Failed to fetch numbers. API might be down!");
    }
});
cmd({
    pattern: "otpbox",
    alias: ["otp", "getnum", "tempotp"],
    desc: "Check inbox of a temp number",
    category: "tools",
    react: "📨",
    filename: __filename,
    use: ".otpbox <number>"
},
async (conn, m, { args, reply }) => {
    const number = args[0];
    if (!number) return reply("❌ Please provide a number.\n\nExample: `.otpbox +16600887591`");

    try {
        const response = await axios.get(`https://api.vreden.my.id/api/tools/fakenumber/message?nomor=${encodeURIComponent(number)}`);
        const messages = response.data?.result;

        if (!messages || messages.length === 0) {
            return reply("❌ No messages found for this number.");
        }

        let text = `╭─「 *OTP Inbox* 」\n│ *Number:* ${number}\n│ *Total Messages:* ${messages.length}\n│\n`;

        for (let i = 0; i < Math.min(10, messages.length); i++) {
            const msg = messages[i];
            text += `│ ${i + 1}. *From:* ${msg.from}\n`;
            text += `│     *Time:* ${msg.time_wib}\n`;
            text += `│     *Message:* ${msg.content}\n│\n`;
        }

        text += `╰─ Powered by *KHAN MD*`;

        await reply(text);
    } catch (e) {
        console.error("OTPBOX ERROR:", e);
        reply("❌ Failed to fetch messages. Make sure the number is correct.");
    }
});
