import axios, { AxiosRequestConfig } from 'axios'
import Spotify from 'spotify-web-api-node'

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env

const SPOTIFY_URL = 'https://api.spotify.com/v1'

export const createSpotifyApi = (token: string) => {
  const spotify = new Spotify({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI
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
