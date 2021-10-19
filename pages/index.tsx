import { GetServerSideProps } from 'next'
import cookie from 'cookie'

import App from '../src/App'
import { getSessionCookie } from '../utils/cookies'
import { IncomingMessage } from 'http'

const getCookies = (req: IncomingMessage): Record<string, string> => {
  return cookie.parse(req.headers.cookie || '')
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = getCookies(req)
    const session = getSessionCookie(cookies)

    return {
      props: {
        user: session.user
      }
    }
  } catch {
    return {
      props: {}
    }
  }
}

export default function IndexPage(props) {
  let initialValue = ''

  if (typeof localStorage !== 'undefined') {
    initialValue = localStorage.getItem('spotify-tracklist.last-search') || ''
  }

  return <App user={props.user} initialValue={initialValue} />
}
