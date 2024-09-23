import { ApiRequestWithToken, withAuthSession } from './../../../utils/cookies'

import { NextApiResponse } from 'next'
import { createSpotifyApi } from '../../../utils/spotify'

const search = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  const { query } = req.body

  if (!query) {
    return res.status(400).json({
      statusCode: 400,
      message: '`query` string is required'
    })
  }

  const songs = query.split('\n').map((x: string) => x.trim())

  const requests = songs.map((song: string) => {
    const split = song.split(/[-–]/gi)
    const spotify = createSpotifyApi(req.session.token.access_token)
    const artist = (split[0] || '').trim()
    const track = (split[1] || '').trim()

    return spotify
      .searchTracks(`${artist} ${track}`)
      .then((res) => {
        if (res.body?.tracks?.total === 0) {
          return { id: track, artist, title: track, missing: true }
        }

        return res.body?.tracks?.items || res.body?.tracks
      })
      .catch((error: any) => {
        console.error('[api/spotify/search] Failed to find track', error)
        return { id: track, artist, title: track, missing: true }
      })
  })

  try {
    const results = await Promise.all(requests)

    console.log('Sending', results.length, 'results')
    return res.send({
      results,
      missing: []
    })
  } catch (error: any) {
    console.error(error)
    return res.status(error.statusCode).json({
      message: error.body
    })
  }
}

export default withAuthSession(search)
