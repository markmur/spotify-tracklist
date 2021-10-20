import { NextApiResponse } from 'next'
import { withAuthSession, ApiRequestWithToken } from './../../../utils/cookies'
import { createSpotifyApi } from '../../../utils/spotify'

const devices = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  try {
    const spotify = createSpotifyApi(req.session.token.access_token)
    const { body } = await spotify.getMyDevices()

    return res.send(body)
  } catch (error) {
    return res.status(error.statusCode).send(error.body)
  }
}

export default withAuthSession(devices)
