/* eslint-disable import/no-unassigned-import */
require('now-env')

const path = require('path')
const axios = require('axios')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const Spotify = require('spotify-web-api-node')
const SpotifyStrategy = require('passport-spotify').Strategy

const PORT = 8080
const SPOTIFY = 'https://api.spotify.com/v1'
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env

const spotify = new Spotify({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI
})

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }

  res.status(401).send()
}

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

passport.use(
  new SpotifyStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: REDIRECT_URI
    },
    (accessToken, refreshToken, expires, profile, done) => {
      spotify.setAccessToken(accessToken)
      return done(null, { profile, accessToken })
    }
  )
)

const app = express()

app.use(cookieParser())
app.use(bodyParser.json())
app.use(morgan('tiny'))
app.use(session({ secret: 'keyboard cat' }))

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize())
app.use(passport.session())

app.use(express.static(path.join(__dirname, '/public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
})

app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: [
      'user-read-email',
      'user-read-private',
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public'
    ],
    showDialog: true
  })
)

app.get(
  '/callback',
  passport.authenticate('spotify', {
    failureRedirect: '/login'
  }),
  (req, res) => res.redirect('/')
)

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

// Return user profile
app.get('/profile', isAuthenticated, (req, res) => res.send(req.user.profile))

// Fetch playlists
app.get('/playlists', isAuthenticated, async (req, res) => {
  try {
    const { data } = await axios.get(`${SPOTIFY}/me/playlists`, {
      headers: {
        Authorization: `Bearer ${req.user.accessToken}`
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
app.post('/playlists/:id/tracks', isAuthenticated, async (req, res) => {
  try {
    const { data } = await axios.post(
      `${SPOTIFY}/playlists/${req.params.id}/tracks`,
      {
        uris: req.body.uris
      },
      {
        headers: {
          Authorization: `Bearer ${req.user.accessToken}`,
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
app.post('/playlists/new', isAuthenticated, async (req, res) => {
  try {
    const { data } = await axios.post(`${SPOTIFY}/${req.user.id}/playlists`, {
      name: req.body.name
    })

    return res.send(data)
  } catch (err) {
    return res.status(err).send(err)
  }
})

// Search tracks
app.post('/search', isAuthenticated, (req, res) => {
  const { list } = req.body

  const songs = list.split('\n').map(x => x.trim())

  const requests = songs.map(song => {
    const [artist, track] = song.split(/[-–]/gi)

    return spotify
      .searchTracks(`artist:${artist.trim()} track:${track.trim()}`)
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

app.listen(PORT, err => {
  if (err) console.error(err)

  console.log(`Listening on http://localhost:${PORT}`)
})
