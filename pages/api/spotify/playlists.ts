import { NextApiResponse } from 'next'
import { ApiRequestWithToken, withAuthSession } from './../../../utils/cookies'
import { createSpotifyApi } from '../../../utils/spotify'

const playlists = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  try {
    const spotify = createSpotifyApi(req.session.token.access_token)
    const { body } = await spotify.getUserPlaylists()

    return res.send(body)
  } catch (error) {
    return res.status(error.statusCode).send(error.body)
  }
}

export default withAuthSession(playlists)
