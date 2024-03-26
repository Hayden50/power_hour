const express = require("express");
const app = express();
const SpotifyWebApi = require("spotify-web-api-node");
const genre_module = require("./genre_options");
const genres = genre_module.genres;

const PORT = 3000;
require("dotenv").config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

spotifyApi.setAccessToken(process.env.ACCESS_TOKEN);

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.get("/recs", (_, res) => {
  // Get Recommendations Based on Seeds
  spotifyApi
    .getRecommendations({
      min_energy: 0.4,
      seed_artists: ["6mfK6Q2tzLMEchAr0e9Uzu", "4DYFVNKZ1uixa6SQTvzQwJ"],
      min_popularity: 50,
      limit: 2,
    })
    .then(
      function (data) {
        let recommendations = data.body;
        res.send(recommendations);
      },
      function (err) {
        console.log("Something went wrong!", err);
      },
    );
});

app.get("/getrecs", async (req, res) => {
  // Check if parameters exist and set defaults if they don't
  const artist = req.query.artist;
  let genre = req.query.genre;

  if (typeof genre == "string") genre = [genre];

  if (genre && artist) {
    res.send("Choose between genre or artist");
  } else if (genre) {
    if (!areAllIncluded(genre, genres)) res.send("Genre Not Found");
    else res.send(await getGenreRecs(genre));
  } else if (artist) {
    res.send("Requesting Artist: Not finished");
  } else {
    res.send("No requests made so no rcecommendations can be created.");
  }
});

// Check if every element of arr1 is included in arr2
function areAllIncluded(arr1, arr2) {
  return arr1.map((element) => arr2.includes(element)).every(Boolean);
}

// Retrieves 100 recommendations based on a list of genres
function getGenreRecs(genre) {
  // Return a promise that resolves when the Spotify API call is completed
  return new Promise((resolve, reject) => {
    spotifyApi
      .getRecommendations({
        min_energy: 0.6,
        seed_genres: [...genre],
        min_popularity: 50,
        limit: 7,
      })
      .then(
        function (data) {
          let recommendations = data.body;

          const tracksInfo = recommendations.tracks.map((track) => {
            const artist = track.artists[0].name;
            const song = track.name;
            return { artist, song };
          });

          console.log(tracksInfo);
          resolve(recommendations);
        },
        function (err) {
          console.log("Something went wrong!", err);
          reject(err);
        },
      );
  });
}

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
