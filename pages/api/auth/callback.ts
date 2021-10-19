import Axios from 'axios'
import jwt from 'jsonwebtoken'
import querystring from 'querystring'
import { NextApiRequest, NextApiResponse } from 'next'
import spotify from '../../../utils/spotify'
import { setAuthCookie, sendRefreshRedirect } from '../../../utils/cookies'

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SESSION_SECRET } = process.env

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { code } = req.query

  try {
    const { data } = await Axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI
      })
    )

    spotify.setAccessToken(data.access_token)

    const profile = await spotify.getMe()

    const session = {
      user: {
        id: profile.body.id,
        display_name: profile.body.display_name,
        email: profile.body.email,
        image_url: profile.body.images.find(image => image.url).url
      },
      token: {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope
      }
    }

    await setAuthCookie(res, session, {
      maxAge: data.expires_in * 1000
    })

    return sendRefreshRedirect(res)
  } catch (error) {
    console.error(error, error.response, 'HERE?')
    res.status(400).send('error')
  }
}
