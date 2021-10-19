import { NextApiResponse } from 'next'
import { ApiRequestWithToken, withAuthSession } from './../../../utils/cookies'
import spotify from '../../../utils/spotify'

const playlists = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  spotify.setAccessToken(req.session.token.access_token)

  try {
    const { body } = await spotify.getUserPlaylists()

    return res.send(body)
  } catch (error) {
    return res.status(error.statusCode).send(error.body)
  }
}

export default withAuthSession(playlists)
