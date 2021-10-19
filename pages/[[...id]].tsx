import { GetServerSideProps } from 'next'
import cookie from 'cookie'

import App from '../src/App'
import { getSessionCookie } from '../utils/cookies'
import { IncomingMessage } from 'http'

const getCookies = (req: IncomingMessage): Record<string, string> => {
  return cookie.parse(req.headers.cookie || '')
}

const getPath = (req: IncomingMessage) => {
  try {
    return new URL(req.url, `http://${req.headers.host}`).pathname
  } catch {
    console.log('Something went wrong', req.url)
    return ''
  }
}

const hasInvalidCharacters = (str: string): boolean => {
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) {
      return true
    }
  }

  return false
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = getCookies(req)
    const session = await getSessionCookie(cookies)

    return {
      props: {
        path: getPath(req),
        user: session.user
      }
    }
  } catch {
    return {
      props: {
        path: getPath(req)
      }
    }
  }
}

export default function IndexPage(props) {
  let initialValue = ''

  if (props.path) {
    try {
      const decoded = Buffer.from(props.path.slice(1), 'base64').toString()

      if (!hasInvalidCharacters(decoded)) {
        initialValue = decoded
      }
    } catch {}

    if (!initialValue) {
      if (typeof localStorage !== 'undefined') {
        initialValue =
          localStorage.getItem('spotify-tracklist.last-search') || ''
      }
    }
  }

  return (
    <App
      user={props.user}
      initialValue={initialValue}
      shouldLoadResults={initialValue && props.user}
    />
  )
}
