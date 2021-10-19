import { NextApiRequest, NextApiResponse } from 'next'
import { getSessionCookie } from './../../../utils/cookies'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await getSessionCookie(req.cookies)

    res.send({
      ...session.user
    })
  } catch {
    res.status(401)
  }

  res.end()
}
