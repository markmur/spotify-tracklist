const axios = require('axios')
const express = require('express')
const Spotify = require('spotify-web-api-node')

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env

const spotify = new Spotify({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI
})

const router = express.Router() // eslint-disable-line new-cap

const SPOTIFY = 'https://api.spotify.com/v1'

// Return user profile
router.get('/profile', (req, res) => res.send(req.user.profile))

// Fetch playlists
router.get('/playlists', async (req, res) => {
  try {
    const { data } = await axios.get(`${SPOTIFY}/me/playlists`, {
      headers: {
        Authorization: `Bearer ${req.user.token.accessToken}`
      }
    })
    return res.send(data)
  } catch ({ response }) {
    const { status, statusText } = response
    console.error({ status, statusText })
    return res.status(status).send({
      status,
      statusText
    })
  }
})

// Add tracks to playlist
router.post('/playlists/:id/tracks', async (req, res) => {
  try {
    const { data } = await axios.post(
      `${SPOTIFY}/playlists/${req.params.id}/tracks`,
      {
        uris: req.body.uris
      },
      {
        headers: {
          Authorization: `Bearer ${req.user.token.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.send(data)
  } catch ({ response }) {
    const { status, statusText } = response
    console.error({ status, statusText })
    return res.status(status).send({
      status,
      statusText
    })
  }
})

// Create new playlist
router.post('/playlists/new', async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({
      message: '`name` body parameter is required'
    })
  }

  try {
    const { data } = await axios.post(
      `${SPOTIFY}/users/${req.user.profile.id}/playlists`,
      {
        name: req.body.name
      },
      {
        headers: {
          Authorization: `Bearer ${req.user.token.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return res.send(data)
  } catch ({ response }) {
    const { status, statusText } = response
    console.error({ status, statusText })
    return res.status(status).send({
      status,
      statusText
    })
  }
})

// Search tracks
router.post('/search', (req, res) => {
  const { query } = req.body

  if (!query) {
    return res.status(400).json({
      message: '`query` string is required'
    })
  }

  const songs = query.split('\n').map(x => x.trim())

  const requests = songs.map(song => {
    const [artist, track] = song.split(/[-–]/gi)

    spotify.setAccessToken(req.user.token.accessToken)

    return spotify
      .searchTracks(
        `artist:${(artist || '').trim()} track:${(track || '').trim()}`
      )
      .then(res => {
        return res.body.tracks.items || res.body.tracks
      })
      .catch(err => {
        console.error('ERROR!', err)
      })
  })

  Promise.all(requests)
    .then(results => {
      return res.send(results)
    })
    .catch(errors => {
      console.error(errors)
    })
})

module.exports = router
