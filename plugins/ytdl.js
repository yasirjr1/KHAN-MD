const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd({
  pattern: "play",
  alias: ["mp3", "ytmp3"],
  react: '⚡',
  desc: "Download audio from YouTube",
  category: "music",
  use: ".play <song name or YouTube URL>",
  filename: __filename
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    if (!args.length) {
      return reply("*Please provide a song name or YouTube link.*");
    }

    let videoUrl = args.join(" ");
    
    // If input is not a link, search for it
    if (!videoUrl.startsWith("http")) {
      await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });
      const searchResults = await yts(videoUrl);
      if (!searchResults.videos.length) {
        return reply("❌ No results found.");
      }
      videoUrl = searchResults.videos[0].url;
    }

    // React and indicate downloading process
    await conn.sendMessage(from, { react: { text: '⚡', key: mek.key } });
    reply("*KHAN MD Downloading Audio...*");

    // Fetch MP3 download link
    const apiUrl = `https://api.vreden.my.id/api/ytmp3?url=${videoUrl}`;
    const response = await axios.get(apiUrl);
    if (!response.data.result.status) {
      return reply("❌ Error fetching the MP3 file.");
    }

    const { url } = response.data.result.download;

    // Send MP3 as an audio file
    await conn.sendMessage(from, {
      audio: { url },
      mimetype: 'audio/mp4',
      ptt: false
    });

  } catch (error) {
    console.error(error);
    reply("❌ An error occurred while processing your request.");
  }
});
