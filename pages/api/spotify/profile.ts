import { NextApiRequest, NextApiResponse } from 'next'

import { getSessionCookie } from './../../../utils/cookies'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await getSessionCookie(
      req.cookies as Record<string, string>
    )

    res.send({
      ...session.user
    })
  } catch (error) {
    console.log('[api/spotify/profile]', error)
    res.status(401)
  }

  res.end()
}
