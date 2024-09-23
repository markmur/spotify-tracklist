import { NextApiRequest, NextApiResponse } from 'next'
import {
  getSessionCookie,
  refreshAuthToken,
  sendRefreshRedirect,
  setAuthCookie
} from './../../../utils/cookies'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let session

  try {
    session = await getSessionCookie(req.cookies as Record<string, string>)

    if (!session.token.refresh_token) {
      throw new Error("'refresh_token' missing from session")
    }
  } catch {
    return res.redirect('/api/auth/login')
  }

  try {
    const response = await refreshAuthToken(session.token.refresh_token)

    const newSession = {
      ...session,
      token: response.data
    }

    await setAuthCookie(res, newSession, {
      maxAge: response.data.expires_in * 1000
    })

    return sendRefreshRedirect(res)
  } catch (error) {
    console.log(error)
    res.status(500).send('Something went wrong')
  }
}
