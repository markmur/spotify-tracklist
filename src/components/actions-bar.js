import { ActionButton, ActionsBar as StyledActionsBar } from '../styles'

import Icon from './icon'
import React from 'react'
import Spinner from './spinner'

const ActionsBar = ({
  shouldDisplayActionsBar,
  isPlaying,
  play,
  pause,
  getPlaylists,
  fetchingPlaylists
}) => {
  return (
    <StyledActionsBar>
      {shouldDisplayActionsBar && (
        <ActionButton secondary onClick={() => (isPlaying ? pause() : play())}>
          {isPlaying ? (
            <span>
              <Icon type="pause" /> Pause
            </span>
          ) : (
            '▶ Play'
          )}
        </ActionButton>
      )}
      <ActionButton primary onClick={getPlaylists}>
        <Spinner active={fetchingPlaylists} />{' '}
        {fetchingPlaylists ? (
          'Fetching playlists...'
        ) : (
          <span>
            <Icon mr={2} type="add-to-list" />
            Add to playlist
          </span>
        )}
      </ActionButton>
    </StyledActionsBar>
  )
}

export default ActionsBar
