const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: 'igstalk',
    desc: 'Fetch Instagram user details',
    category: 'stalk',
    react: '📸',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply('Please provide an Instagram username.');
        const username = args[0];
        const apiUrl = `https://apizell.web.id/stalk/instagram?username=${username}`;

        const { data } = await axios.get(apiUrl);

        if (!data.status) return reply('User not found or API error.');

        const user = data.result;
        const profilePic = user.profile_pic_url_hd || user.profile_pic_url;
        const bioLink = user.bio_links?.[0]?.url || 'None';
        const externalUrl = user.external_url || 'None';

        const message = `*Instagram Profile Stalk*

` +
            `👤 *Username:* ${user.username}
` +
            `📛 *Full Name:* ${user.full_name}
` +
            `🔒 *Private:* ${user.is_private ? 'Yes' : 'No'}
` +
            `✅ *Verified:* ${user.is_verified ? 'Yes' : 'No'}
` +
            `👥 *Followers:* ${user.follower_count}
` +
            `👣 *Following:* ${user.following_count}
` +
            `📝 *Posts:* ${user.media_count}
` +
            `📄 *Biography:* ${user.biography}
` +
            `🔗 *External URL:* ${externalUrl}
` +
            `🌐 *Bio Link:* ${bioLink}`;

        await conn.sendMessage(from, { image: { url: profilePic }, caption: message }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply('An error occurred while fetching the profile.');
    }
});
