import { NextApiRequest, NextApiResponse } from 'next'
import { sendRefreshRedirect, setAuthCookie } from '../../../utils/cookies'

import Axios from 'axios'
import { createSpotifyApi } from './../../../utils/spotify'
import querystring from 'querystring'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { code } = req.query

  try {
    const { data } = await Axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI
      })
    )

    const spotify = createSpotifyApi(data.access_token)

    const profile = await spotify.getMe()

    console.log({profile})

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
    console.log('[api/auth/callback]', error)
    res.status(400).send('error')
  }
}
