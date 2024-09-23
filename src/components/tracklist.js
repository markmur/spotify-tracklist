import {
  FallbackImage,
  Image,
  PlaybackIcon,
  SongArtist,
  SongTitle,
  Track,
  TrackImage,
  Tracks
} from '../styles'

import { Flex } from 'grid-styled'
import Icon from './icon'
import React from 'react'

export default ({ results, currentTrack, paused, playTrack }) => {
  return (
    <Tracks>
      {results.map(({ id, title, artist, image, uri, missing }, i) => (
        <Track
          key={id || title}
          $missing={missing}
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
            onClick={(event) => {
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
