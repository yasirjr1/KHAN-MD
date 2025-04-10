const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "tempnum",
    alias: ["fakenum"],
    desc: "Generate temporary numbers",
    category: "tools",
    react: "✅",
    use: ".tempnum us"
},
async (conn, m, { args, reply }) => {
    try {
        const code = args[0]?.toLowerCase() || 'us';
        
        // Ultra-safe API call
        const { data } = await axios.get(
            `https://api.vreden.my.id/api/tools/fakenumber/listnumber?id=${code}`,
            { 
                timeout: 8000,
                validateStatus: () => true // Accept all status codes
            }
        );

        // Military-grade validation
        const validData = (
            data &&
            Array.isArray(data?.result) &&
            data.result.length > 0 &&
            typeof data.result[0]?.number === 'string'
        );

        if (!validData) {
            let errorMsg = "⚠️ Invalid API Response Structure!";
            if (data?.result?.length === 0) errorMsg = `📭 No numbers found for *${code.toUpperCase()}*`;
            return reply(errorMsg);
        }

        // Bulletproof data extraction
        const safeResult = data.result.filter(item => 
            item?.number && item?.country
        );

        // Formatting with nuclear safety
        const numbersList = safeResult
            .slice(0, 10)
            .map((item, index) => 
                `${index + 1}. ${item.number.replace(/(\d{3})(\d{3})(\d{4})/, "+$1-$2-$3")}`
            )
            .join('\n');

        return reply(
            `╭──「 𝗧𝗘𝗠𝗣 𝗡𝗨𝗠𝗕𝗘𝗥𝗦 」\n` +
            `│\n` +
            `│ 🌐 𝗖𝗼𝘂𝗻𝘁𝗿𝘆: ${safeResult[0]?.country || code.toUpperCase()}\n` +
            `│ 📞 𝗡𝘂𝗺𝗯𝗲𝗿𝘀:\n${numbersList}\n` +
            `│\n` +
            `╰──「 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗞𝗛𝗔𝗡-𝗠𝗗 」`
        );

    } catch (err) {
        console.error("Final Boss Error:", err);
        return reply("🔧 Temporary outage - try again later!");
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
