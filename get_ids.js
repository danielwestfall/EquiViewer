const https = require("https");
const queries = [
  "gordon ramsay cooking dinner",
  "binging with babish pasta",
  "tasty 3 ingredient recipes",
  "jamie oliver 15 minute meals",
];
const getTopVideoId = (query) =>
  new Promise((resolve) => {
    https.get(
      "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(query),
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const match = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          resolve(match ? match[1] : "PUP7U5vTMM0");
        });
      },
    );
  });
Promise.all(queries.map(getTopVideoId)).then((ids) => {
  console.log(JSON.stringify(ids));
});
