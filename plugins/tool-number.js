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
    alias: ["getnumber", "gennumber", "tempnumber", "fakenumber"],
    desc: "Get temp numbers for specific country ID",
    category: "tools",
    react: "📱",
    filename: __filename,
    use: ".tempnum <country_id>"
},
async (conn, m, { args, reply }) => {
    const id = args[0]?.toLowerCase();
    if (!id) return reply("❌ Please provide a country ID.\n\nExample: `.tempnum us`");

    try {
        const res = await axios.get(`https://api.vreden.my.id/api/tools/fakenumber/listnumber?id=${id}`);
        const data = res.data?.result;

        if (!data || data.length === 0) {
            return reply("❌ No temporary numbers found or invalid country ID.");
        }

        const randomFive = data.sort(() => 0.5 - Math.random()).slice(0, 5);

        let txt = `╭───〔 *📱 Fake Numbers Generator* 〕\n`;
        txt += `│ 🌍 *Country:* ${randomFive[0].country}\n`;
        txt += `│ 📦 *Available:* ${data.length} numbers\n│\n`;
        txt += `│ 🎲 *Random 5 Numbers:*\n`;

        randomFive.forEach((item, i) => {
            txt += `│ ${i + 1}. ☎️ ${item.number}\n`;
        });

        txt += `│\n│ 🔎 *Use:* \`.otpbox <number>\` to check inbox\n`;
        txt += `╰─ Powered by *KHAN MD*`;

        await reply(txt);
    } catch (err) {
        console.error("❌ TEMPNUM ERROR:", err);
        reply("❌ Failed to fetch temporary numbers. Please try again later.");
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
