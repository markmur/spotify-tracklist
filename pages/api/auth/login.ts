import { NextApiRequest, NextApiResponse } from 'next'

const scopes = [
  'streaming',
  'user-read-playback-state',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public'
]

const buildURL = (scopes: string[], callback: string) => {
  return (
    'https://accounts.spotify.com/authorize?response_type=code' +
    `&client_id=${process.env.SPOTIFY_CLIENT_ID}` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&redirect_uri=${encodeURIComponent(callback)}`
  )
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  return res.redirect(buildURL(scopes, process.env.SPOTIFY_REDIRECT_URI))
}
