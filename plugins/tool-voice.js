const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "voiceai",
    alias: ["vai", "aivoice"],
    desc: "Text to speech with different AI voices",
    category: "ai",
    filename: __filename
}, async (conn, m, store, {
    from,
    quoted,
    args,
    q,
    reply
}) => {
    try {
        // Split the command and text
        const [cmd, ...textParts] = args.split(" ");
        const text = textParts.join(" ");
        
        if (!text) {
            return reply("Please provide text after the command.\nExample: .voiceai hello");
        }

        // Send initial reaction
        await conn.sendMessage(from, {  
            react: { text: '⏳', key: m.key }  
        });

        // Voice model menu
        const voiceModels = [
            { number: "1", name: "Hatsune Miku", model: "miku" },
            { number: "2", name: "Nahida (Exclusive)", model: "nahida" },
            { number: "3", name: "Nami", model: "nami" },
            { number: "4", name: "Ana (Female)", model: "ana" },
            { number: "5", name: "Optimus Prime", model: "optimus_prime" },
            { number: "6", name: "Goku", model: "goku" },
            { number: "7", name: "Taylor Swift", model: "taylor_swift" },
            { number: "8", name: "Elon Musk", model: "elon_musk" },
            { number: "9", name: "Mickey Mouse", model: "mickey_mouse" },
            { number: "10", name: "Kendrick Lamar", model: "kendrick_lamar" },
            { number: "11", name: "Angela Adkinsh", model: "angela_adkinsh" },
            { number: "12", name: "Eminem", model: "eminem" }
        ];

        // Create menu text
        let menuText = "╭━━━〔 *AI VOICE MODELS* 〕━━━⊷\n";
        voiceModels.forEach(model => {
            menuText += `┃▸ ${model.number}. ${model.name}\n`;
        });
        menuText += "╰━━━⪼\n\n";
        menuText += `📌 *Reply with the number to select voice model for:*\n"${text}"`;

        // Send menu message
        const sentMsg = await conn.sendMessage(from, {  
            text: menuText
        }, { quoted: m });

        const messageID = sentMsg.key.id;

        // Listen for reply
        conn.ev.on("messages.upsert", async (msgData) => {  
            const receivedMsg = msgData.messages[0];  
            if (!receivedMsg.message) return;  

            const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;  
            const senderID = receivedMsg.key.remoteJid;  
            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;  

            if (isReplyToBot && senderID === from) {  
                await conn.sendMessage(senderID, {  
                    react: { text: '⬇️', key: receivedMsg.key }  
                });  

                const selectedNumber = receivedText.trim();
                const selectedModel = voiceModels.find(model => model.number === selectedNumber);

                if (!selectedModel) {
                    return reply("❌ Invalid option! Please reply with a number from the menu.");
                }

                try {
                    // Call the API
                    const apiUrl = `https://api.agatz.xyz/api/voiceover?text=${encodeURIComponent(text)}&model=${selectedModel.model}`;
                    
                    // Show processing message
                    await conn.sendMessage(from, {  
                        text: `🔊 Generating voice with ${selectedModel.name} model...`  
                    }, { quoted: receivedMsg });

                    const response = await fetch(apiUrl);
                    const data = await response.json();

                    if (data.status === 200) {
                        await conn.sendMessage(from, {  
                            audio: { url: data.data.oss_url },  
                            mimetype: "audio/mpeg",
                            ptt: true,
                            caption: `🎤 *${selectedModel.name} Voice*\n📝 *Text:* ${text}`
                        }, { quoted: receivedMsg });
                    } else {
                        reply("❌ Error generating voice. Please try again.");
                    }
                } catch (error) {
                    console.error("API Error:", error);
                    reply("❌ Error processing your request. Please try again.");
                }
            }  
        });

    } catch (error) {
        console.error("Error:", error);
        reply("❌ An error occurred. Please try again.");
    }
});
