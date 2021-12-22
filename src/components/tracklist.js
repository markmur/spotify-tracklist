import React from 'react'

import Icon from './icon'
import { Flex } from 'grid-styled'

import {
  Tracks,
  Track,
  TrackImage,
  Image,
  FallbackImage,
  PlaybackIcon,
  SongTitle,
  SongArtist
} from '../styles'

export default ({ results, currentTrack, paused, playTrack }) => {
  return (
    <Tracks>
      {results.map(({ id, title, artist, image, uri }, i) => (
        <Track
          key={id || title}
          onClick={playTrack ? playTrack(id, i, uri) : undefined}
        >
          <Flex>
            <TrackImage>
              {image ? <Image src={image?.url} /> : <FallbackImage />}

              {currentTrack && (
                <PlaybackIcon
                  className="playback-icon"
                  isPlaying={currentTrack?.id === id}
                >
                  {currentTrack?.id === id ? (
                    paused ? (
                      '▶'
                    ) : (
                      <Icon type="pause" />
                    )
                  ) : (
                    '▶'
                  )}
                </PlaybackIcon>
              )}
            </TrackImage>
            <div>
              <SongTitle>{title}</SongTitle>
              <SongArtist>{artist}</SongArtist>
            </div>
          </Flex>
          <a
            type="button"
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()
              window.location.href = uri
            }}
          >
            <Icon
              color="#b7b7b7"
              hoverColor="spotify"
              fontSize={22}
              type="spotify"
            />
          </a>
        </Track>
      ))}
    </Tracks>
  )
}
