const axios = require('axios')
const { stringify } = require('qs')
const { get } = require('../src/utils')

const { CLIENT_ID, CLIENT_SECRET } = process.env

const unauthorized = res => {
  return res.status(401).send({
    message: 'Unauthorized'
  })
}

const refreshAccessToken = async req => {
  const { refreshToken } = req.user.token
  try {
    const { data } = await axios.request({
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      data: stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString('base64')}`
      }
    })

    if ('access_token' in data) {
      req.user.token.accessToken = data.access_token
    } else {
      throw new Error('`access_token` missing from response')
    }
  } catch (err) {
    console.log('Failed to refresh token', err)
    throw err
  }
}

const isAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) {
    await refreshAccessToken(req)
    return next()
  }

  if (get(req.user, 'token.refereshToken')) {
    try {
      await refreshAccessToken(req)
      return next()
    } catch (err) {
      return unauthorized(res)
    }
  }

  return unauthorized(res)
}

module.exports = {
  isAuthenticated
}
