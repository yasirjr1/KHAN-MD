const { cmd } = require('../command');
const axios = require("axios");
const yts = require("yt-search");

cmd({
    pattern: "play",
    alias: ["song", "playdoc", "audio", "mp3"],
    desc: "Download and send audio from YouTube",
    category: "Search",
    react: "🎧",
    filename: __filename
}, async (conn, m, { q, reply }) => {
    if (!q) return reply("❌ Please provide a video name.");

    const searchQuery = q;
    try {
        const searchResults = await yts(searchQuery);
        if (!searchResults || !searchResults.videos.length) {
            return reply("❌ No video found for the specified query.");
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;

        const fetchData = async (url) => {
            try {
                const response = await axios.get(url);
                return response.data;
            } catch (error) {
                console.error("Error fetching data from API:", error.message);
                return { success: false };
            }
        };

        const apiUrls = [
            `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
            `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(videoUrl)}`,
            `https://www.dark-yasiya-api.site/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
            `https://api.giftedtech.web.id/api/download/dlmp3?url=${encodeURIComponent(videoUrl)}&apikey=gifted-md`,
            `https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(videoUrl)}`
        ];

        let responseData;
        for (const apiUrl of apiUrls) {
            responseData = await fetchData(apiUrl);
            if (responseData && responseData.success) {
                break;
            }
        }

        if (!responseData || !responseData.success) {
            return reply("❌ Failed to retrieve download URL from all sources. Please try again later.");
        }

        const downloadUrl = responseData.result.download_url;

        // Send audio directly as a message without caption
        await conn.sendMessage(m.chat, { audio: { url: downloadUrl }, mimetype: "audio/mpeg" }, { quoted: m });
    } catch (error) {
        console.error("Error during download process:", error.message);
        return reply("❌ Download failed due to an error: " + (error.message || error));
    }
});
