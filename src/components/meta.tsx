import { Helmet } from 'react-helmet'
import React from 'react'

const Meta = () => {
  return (
    <Helmet>
      <meta charSet="utf-8" />
      <title>Spotify Tracklist</title>
      <link rel="canonical" href="https://spotify-tracklist.vercel.app" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      {/* <script src="https://sdk.scdn.co/spotify-player.js"></script> */}

      <link rel="manifest" href="/manifest.json" />
      <link rel="shortcut icon" href="/favicon.png" />
    </Helmet>
  )
}

export default Meta
