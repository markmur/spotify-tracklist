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
const SpotifyStrategy = require('passport-spotify').Strategy

const { CLIENT_ID, CLIENT_SECRET } = process.env

const Spotify = require('spotify-web-api-node')

const spotify = new Spotify({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: 'http://localhost:8888/callback'
})

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }

  res.status(401).send()
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.
passport.use(
  new SpotifyStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: 'http://localhost:8888/callback'
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

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
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

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  '/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  (req, res) => res.redirect('http://localhost:3000/')
)

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.get('/profile', isAuthenticated, (req, res) => res.send(req.user.profile))

const SPOTIFY = 'https://api.spotify.com/v1'

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

app.post('/playlists/:id/tracks', isAuthenticated, async (req, res) => {
  console.log(
    req.params,
    req.user.accessToken,
    `${SPOTIFY}/users/${req.user.profile.id}/playlists/${
      req.params.id
    }/tracks?uris=${req.body.uris}`
  )
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
    console.log(data)
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
    .catch(console.log)
})

app.listen(8888, err => {
  if (err) console.error(err)

  console.log('Listening on http://localhost:8888')
})
