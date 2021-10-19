import axios from 'axios'
import Iron from '@hapi/iron'
import querystring from 'querystring'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { serialize, CookieSerializeOptions } from 'cookie'
import { NextApiRequest, NextApiResponse } from 'next'

const { SESSION_SECRET } = process.env

/**
 * This sets `cookie` using the `res` object
 */

export const setAuthCookie = async (
  res: NextApiResponse,
  session: JwtPayload,
  options: CookieSerializeOptions = {}
) => {
  const defaults: CookieSerializeOptions = {
    maxAge: 3600 * 1000 * 5,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  }
  const opts: CookieSerializeOptions = { ...defaults, ...options }

  try {
    const signedSession = await Iron.seal(
      session,
      SESSION_SECRET,
      Iron.defaults
    )

    const stringValue =
      typeof signedSession === 'object'
        ? 'j:' + JSON.stringify(signedSession)
        : String(signedSession)

    if ('maxAge' in opts) {
      opts.expires = new Date(Date.now() + opts.maxAge)
      opts.maxAge /= 1000
    }

    res.setHeader(
      'Set-Cookie',
      serialize('spotify-tracklist.session', stringValue, opts)
    )
  } catch (error) {
    console.error('Failed to seal session object', error)
    return
  }
}

export const getSessionCookie = async (
  cookies: Record<string, string>
): Promise<UserSession> => {
  if (!cookies['spotify-tracklist.session']) {
    throw new Error('Auth session not found')
  }

  const cookie = cookies['spotify-tracklist.session']
  const decoded = await Iron.unseal(cookie, SESSION_SECRET, Iron.defaults)

  return decoded
}

export const getAuthToken = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const session = await getSessionCookie(req.cookies)

    return session.token.access_token
  } catch {
    throw new Error('Auth token not found')
  }
}

export interface UserSession {
  user: {
    id: string
    display_name: string
    email: string
    image_url: string
  }
  token: {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    scope: string
  }
}

export type ApiRequestWithToken = NextApiRequest & {
  session: UserSession
}

export const withAuthSession = fn => async (
  req: ApiRequestWithToken,
  res: NextApiResponse
) => {
  try {
    const session = (await getSessionCookie(req.cookies)) as UserSession

    req.session = session

    return await fn(req, res)
  } catch (error) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
}

export const getRefreshToken = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const session = await getSessionCookie(req.cookies)

    return session.token.refresh_token
  } catch {
    res.status(401)
    res.end()
  }
}

export const getUser = async (req: NextApiRequest) => {
  try {
    const session = await getSessionCookie(req.cookies)

    return session.user
  } catch {
    return null
  }
}

export const sendRefreshRedirect = (res: NextApiResponse, path = '/') => {
  res.status(200)
  return res.send(
    `<html><head><meta http-equiv="refresh" content=1;url="${path}"></head></html>`
  )
}

export const encodeAuthCredentials = (id: string, secret: string) => {
  return Buffer.from(`${id}:${secret}`).toString('base64')
}

export const handleAuthTokenExpiry = (
  req: NextApiRequest,
  res: NextApiResponse
) => {}

export const refreshAuthToken = (refreshToken: string) => {
  return axios.post(
    'https://accounts.spotify.com/api/token',
    querystring.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
}
