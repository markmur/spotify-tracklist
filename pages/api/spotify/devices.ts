import { NextApiResponse } from 'next'
import {
  getAuthToken,
  withAuthSession,
  ApiRequestWithToken
} from './../../../utils/cookies'
import spotify from '../../../utils/spotify'

const devices = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  const token = getAuthToken(req, res)

  spotify.setAccessToken(req.session.token.access_token)

  try {
    const { body } = await spotify.getMyDevices()

    return res.send(body)
  } catch (error) {
    return res.status(error.statusCode).send(error.body)
  }
}

export default withAuthSession(devices)
