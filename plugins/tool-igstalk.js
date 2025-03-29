const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "igstalk",
    description: "Fetch Instagram profile details.",
    category: "utility",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    if (args.length === 0) return reply("⚠️ Please provide an Instagram username! Example: .igstalk jawadik.35");
    
    const username = args[0];
    const apiUrl = `https://apizell.web.id/stalk/instagram?username=${username}`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!data.status) return reply("❌ Failed to fetch profile details. Please check the username!");
        
        const result = data.result;
        let caption = `📸 *Instagram Stalk*
━━━━━━━━━━━━━━━━
👤 *Name:* ${result.full_name}
🔹 *Username:* @${result.username}
🔒 *Private:* ${result.is_private ? "Yes" : "No"}
✅ *Verified:* ${result.is_verified ? "Yes" : "No"}
👥 *Followers:* ${result.follower_count}
👣 *Following:* ${result.following_count}
📸 *Posts:* ${result.media_count}
📝 *Bio:* ${result.biography || "N/A"}
🔗 *Link:* ${result.external_url || "N/A"}`;
        
        await conn.sendMessage(m.chat, {
            image: { url: result.profile_pic_url_hd },
            caption: caption
        }, { quoted: mek });
        
    } catch (error) {
        console.error("Error fetching Instagram profile:", error);
        reply("❌ Failed to fetch profile. Please try again later.");
    }
});
