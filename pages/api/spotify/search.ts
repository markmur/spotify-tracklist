import { NextApiResponse } from 'next'
import { ApiRequestWithToken, withAuthSession } from './../../../utils/cookies'
import { createSpotifyApi } from '../../../utils/spotify'

const search = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  const { query } = req.body

  if (!query) {
    return res.status(400).json({
      statusCode: 400,
      message: '`query` string is required'
    })
  }

  const songs = query.split('\n').map(x => x.trim())

  const requests = songs.map(song => {
    const [artist, track] = song.split(/[-–]/gi)

    const spotify = createSpotifyApi(req.session.token.access_token)

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

  try {
    const results = await Promise.all(requests)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode).json({
      message: error.body
    })
  }
}

export default withAuthSession(search)
