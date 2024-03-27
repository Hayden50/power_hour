const express = require("express");
const { exec } = require("child_process");
const app = express();
const SpotifyWebApi = require("spotify-web-api-node");
const genre_module = require("./utils/genre_options");
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
  const pythonPath = "./mp4_compiler/hello.py";
  res.send("Hello World!");
  exec(`python3 ${pythonPath}`, (_, stdout) => {
    console.log("Python script output:", stdout);
  });
});

app.get("/getrecs", async (req, res) => {
  // Check if parameters exist and set defaults if they don't
  let artist = req.query.artist;
  let genre = req.query.genre;

  if (typeof artist == "string") artist = [artist];
  if (typeof genre == "string") genre = [genre];

  if (genre || artist) {
    let uris = null;
    if (artist) uris = await getArtists(artist);
    res.send(await getRecs(genre || [], uris || []));
  } else {
    res.send("No requests made so no recommendations can be created.");
  }
});

// Check if every element of arr1 is included in arr2
function areAllIncluded(arr1, arr2) {
  return arr1.map((element) => arr2.includes(element)).every(Boolean);
}

// Combines all artists into an array of artist URIs
function getArtists(names) {
  const promises = names.map((name) => getArtist(name));
  return Promise.all(promises) || [];
}

// Gets a singular artist URI
function getArtist(name) {
  return new Promise((resolve, reject) => {
    spotifyApi.searchArtists(name).then(
      function (data) {
        resolve(data.body.artists.items[0].uri.split(":")[2]);
      },
      function (err) {
        reject(err);
      },
    );
  });
}

// Retrieves some number of recommendations based on a list of genres
function getRecs(genre, uris) {
  if (!areAllIncluded(genre, genres)) genre = [];
  // Return a promise that resolves when the Spotify API call is completed
  return new Promise((resolve, reject) => {
    spotifyApi
      .getRecommendations({
        min_energy: 0.6,
        seed_genres: genre ? [...genre] : null,
        seed_artists: uris ? [...uris] : null,
        target_popularity: 100,
        limit: 70,
      })
      .then(
        function (data) {
          let recommendations = data.body;

          const tracksInfo = recommendations.tracks.map((track) => {
            const artist = track.artists[0].name;
            const song = track.name;
            const date = track.album.release_date;
            return { artist, song, date };
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
