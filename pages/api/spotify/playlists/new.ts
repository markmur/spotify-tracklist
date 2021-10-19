import { NextApiResponse } from 'next'
import {
  ApiRequestWithToken,
  withAuthSession
} from './../../../../utils/cookies'
import spotify from '../../../../utils/spotify'

const newPlaylist = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  if (!req.body.name) {
    return res.status(400).json({
      message: '`name` body parameter is required'
    })
  }

  spotify.setAccessToken(req.session.token.access_token)

  try {
    const { body } = await spotify.createPlaylist(
      req.session.user.id,
      req.body.name
    )

    return res.send(body)
  } catch (response) {
    const { status, statusText } = response
    return res.status(status).send({
      status,
      statusText
    })
  }
}

export default withAuthSession(newPlaylist)
