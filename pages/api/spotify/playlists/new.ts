import { NextApiResponse } from 'next'
import {
  ApiRequestWithToken,
  withAuthSession
} from './../../../../utils/cookies'
import { createSpotifyApi } from '../../../../utils/spotify'

const newPlaylist = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  if (!req.body.name) {
    return res.status(400).json({
      message: '`name` body parameter is required'
    })
  }

  try {
    const spotify = createSpotifyApi(req.session.token.access_token)
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
