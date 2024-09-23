import styled, { keyframes } from 'styled-components'

import React from 'react'

const dash = keyframes`
62.5% {
  opacity: 0;
}
to {
  stroke-dashoffset: 0;
}
`

export default styled(({ className }: { className?: string }) => (
  <div className={className}>
    <svg width="16px" height="12px">
      <polyline id="back" points="1 6 4 6 6 11 10 1 12 6 15 6" />
      <polyline id="front" points="1 6 4 6 6 11 10 1 12 6 15 6" />
    </svg>

    <strong>Searching Spotify...</strong>
  </div>
))`
  position: absolute;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  strong {
    display: block;
    font-weight: light;
    color: white;
    font-size: 13px;
    margin-top: 2em;
  }

  svg {
    display: block;
    margin: auto;
    transform: translate(-50%, -50%) scale(3);
  }

  svg polyline {
    fill: none;
    stroke-width: 1;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  svg polyline#back {
    stroke: rgba(59, 211, 171, 0.3);
  }

  svg polyline#front {
    stroke: ${(p) => p.theme.colors.spotify};
    stroke-dasharray: 12, 36;
    stroke-dashoffset: 48;
    animation: ${dash} 1s linear infinite;
  }
`
