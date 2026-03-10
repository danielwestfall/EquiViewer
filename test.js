const https = require("https");

https.get(
  "https://www.youtube.com/results?search_query=cooking+recipe",
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      // Look for videoId:"xxxxxxxxxxx"
      const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
      const matches = [];
      let match;
      while ((match = regex.exec(data)) !== null) {
        matches.push(match[1]);
      }
      const uniqueIds = [...new Set(matches)].slice(0, 15);
      console.log(JSON.stringify(uniqueIds));
    });
  },
);
