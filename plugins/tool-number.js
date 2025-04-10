const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "tempnum",
    alias: ["getnumber", "tempnumber"],
    desc: "Generate temp numbers",
    category: "tools",
    react: "📱",
    use: ".tempnum <country-code>"
},
async (conn, m, { args, reply }) => {
    try {
        const code = args[0]?.toLowerCase();
        if (!code) return reply("❗ Example: `.tempnum us`");

        // Fetch data with timeout
        const { data } = await axios.get(
            `https://api.vreden.my.id/api/tools/fakenumber/listnumber?id=${code}`,
            { timeout: 10000 }
        );

        // Full-proof validation
        if (!data || 
            !data.result || 
            !Array.isArray(data.result) || 
            data.result.length === 0 ||
            !data.result[0]?.number
        ) {
            return reply(`❌ Invalid response for *${code.toUpperCase()}*!\nMaybe wrong country code?`);
        }

        // Safely extract country name
        const firstItem = data.result.find(item => item?.country) || {};
        const country = firstItem.country || code.toUpperCase();

        // Generate number list with fallbacks
        const numbers = data.result
            .slice(0, 15)
            .map((num, i) => `${i + 1}. ${num.number || 'N/A'}`)
            .join('\n');

        // Format message
        return reply(
            `╭──「 TEMP NUMBERS 」\n` +
            `│\n` +
            `│ • Country: ${country}\n` +
            `│ • Available:\n${numbers}\n` +
            `│\n` +
            `│ Use: .otpbox <number>\n` +
            `╰──「 @KHAN-MD 」`
        );

    } catch (err) {
        console.error("TEMP NUM ERROR:", err);
        return reply(`❌ Failed: ${err.message.includes("timeout") ? "API Timeout" : "Invalid Response"}`);
    }
});

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
