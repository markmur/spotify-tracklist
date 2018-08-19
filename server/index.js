/* eslint-disable import/no-unassigned-import */
require('now-env')

const path = require('path')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const SpotifyStrategy = require('passport-spotify').Strategy

const spotifyApi = require('./api')
const { isAuthenticated } = require('./middleware')

const PORT = process.env.PORT || 8080
const {
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  NODE_ENV,
  SESSION_SECRET
} = process.env

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

const isProduction = NODE_ENV === 'production'

/* eslint-disable max-params */
passport.use(
  new SpotifyStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: REDIRECT_URI
    },
    (accessToken, refreshToken, expires, profile, done) => {
      return done(null, {
        profile,
        token: {
          accessToken,
          refreshToken
        }
      })
    }
  )
)
/* eslint-enable max-params */

const app = express()

app.use(cookieParser())
app.use(bodyParser.json())
app.use(session({ secret: SESSION_SECRET }))

app.use(morgan('tiny'))

if (isProduction) {
  // Serve any static files
  app.use(express.static(path.join(__dirname, '..', 'build')))

  // Handle React routing, return all requests to React app
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
  })
}

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize())
app.use(passport.session())

app.get('/health', (req, res) => res.status(200).json('OK'))

app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: [
      'streaming',
      'user-read-playback-state',
      'user-read-birthdate',
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
  '/auth/callback',
  passport.authenticate('spotify', {
    failureRedirect: '/login'
  }),
  (req, res) => res.redirect(isProduction ? '/' : 'http://localhost:3000')
)

app.use('/api', isAuthenticated, spotifyApi)

app.listen(PORT, err => {
  if (err) console.error(err)

  console.log(`Listening on port ${PORT}`)
})
