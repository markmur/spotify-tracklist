import React from 'react'
import { Footer } from '../styles'

export default () => (
  <Footer>
    <div>
      <span>
        Built by{' '}
        <a
          href="https://twitter.com/mrkmur"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mark Murray
        </a>
      </span>
      <strong> | </strong>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://github.com/markmur/spotify-finder"
      >
        View Source on GitHub
      </a>
      <strong> | </strong>
      <span> This app is not affiliated with Spotify.</span>
    </div>
    <div />
  </Footer>
)
