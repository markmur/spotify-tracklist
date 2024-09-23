import axios, { AxiosRequestConfig } from 'axios'

import Spotify from 'spotify-web-api-node'

const SPOTIFY_URL = 'https://api.spotify.com/v1'

export const createSpotifyApi = (token: string) => {
  const spotify = new Spotify({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  })

  spotify.setAccessToken(token)

  return spotify
}

export const fetch = (
  url: string,
  options: AxiosRequestConfig,
  token: string
) => {
  return axios.request({
    url: SPOTIFY_URL + url,
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}
