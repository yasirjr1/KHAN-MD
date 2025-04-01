const axios = require('axios');
const ytSearch = require('yt-search');
const { cmd } = require("../command");

cmd({
  pattern: "play",
  alias: ["ytmp3", "audio", "mp3"],
  desc: "Download audio from YouTube based on a search query.",
  react: "🎧",
  category: "search",
  filename: __filename
}, async (conn, m, store, { reply, args }) => {
  try {
    if (!args[0]) return reply("❌ Please provide a song name.");
    const query = args.join(" ");

    // Search YouTube for the first video
    const searchResults = await ytSearch(query);
    if (!searchResults || !searchResults.videos.length) {
      return reply("❌ No video found for the specified query.");
    }
    const firstVideo = searchResults.videos[0];
    const videoUrl = firstVideo.url;

    // Function to get download data from APIs
    const getDownloadData = async (url) => {
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        return { success: false };
      }
    };

    // List of APIs to try
    const apis = [
      `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(videoUrl)}`,
      `https://www.dark-yasiya-api.site/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
      `https://api.giftedtech.web.id/api/download/dlmp3?url=${encodeURIComponent(videoUrl)}&apikey=gifted-md`,
      `https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(videoUrl)}`
    ];

    let downloadData;
    for (const api of apis) {
      downloadData = await getDownloadData(api);
      if (downloadData && downloadData.success) break;
    }

    // Check if a valid download URL was found
    if (!downloadData || !downloadData.success) {
      return reply("❌ Failed to retrieve download URL from all sources.");
    }

    const downloadUrl = downloadData.result.download_url;
    const title = downloadData.result.title || firstVideo.title;

    await conn.sendMessage(m.chat, {
      audio: { url: downloadUrl },
      mimetype: "audio/mp3",
      fileName: `${title}.mp3`
    }, { quoted: m });

  } catch (error) {
    console.error("❌ Error in play command:", error);
    reply("⚠️ An error occurred while processing the command.");
  }
});
