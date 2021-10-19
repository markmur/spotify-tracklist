import axios from 'axios'
import { NextApiResponse } from 'next'
import { ApiRequestWithToken } from './../../../../../utils/cookies'
import { withAuthSession } from '../../../../../utils/cookies'

const tracks = async (req: ApiRequestWithToken, res: NextApiResponse) => {
  try {
    const { data } = await axios.post(
      `https://api.spotify.com/v1/playlists/${req.query.id}/tracks`,
      {
        uris: req.body.uris
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.token.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.send(data)
  } catch ({ response }) {
    const { status, statusText } = response
    return res.status(status).send({
      status,
      statusText
    })
  }
}

export default withAuthSession(tracks)
