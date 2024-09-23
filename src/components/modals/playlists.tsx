import {
  Backdrop,
  Flex,
  Image,
  Input,
  Modal,
  Playlist,
  Playlists,
  SpotifyButton
} from '../../styles'

import React from 'react'
import { get } from '../../utils'

export default React.forwardRef(
  (
    {
      added,
      adding,
      createPlaylistInput,
      handleCreateNewPlaylist,
      handleCreatePlaylistChange,
      handleAddTracksToPlaylist,
      playlists,
      results,
      setModalState,
      visible
    },
    ref
  ) => {
    return (
      <Modal $visible={visible}>
        <Backdrop onClick={() => setModalState(false)} />
        <Playlists>
          <h2>My Playlists</h2>
          <div>
            <Flex
              mb={2}
              mx={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Input
                ref={ref}
                type="text"
                name="create-playlist"
                value={createPlaylistInput}
                placeholder="Create new playlist..."
                onChange={handleCreatePlaylistChange}
              />
              <div>
                <SpotifyButton $small onClick={handleCreateNewPlaylist}>
                  Create
                </SpotifyButton>
              </div>
            </Flex>

            {playlists.map((playlist) => (
              <Playlist key={playlist.id}>
                <Flex alignItems="center" style={{ overflow: 'hidden' }}>
                  <Image mr={3} src={get(playlist.images[0], 'url')} />
                  <a href={playlist.uri}>
                    <strong>{playlist.name}</strong>
                  </a>
                </Flex>
                <SpotifyButton
                  $small
                  onClick={() =>
                    handleAddTracksToPlaylist(
                      playlist.id,
                      results,
                      playlist.uri
                    )
                  }
                >
                  {added.includes(playlist.id)
                    ? '✓ Added'
                    : adding === playlist.id
                      ? 'Adding...'
                      : 'Add'}
                </SpotifyButton>
              </Playlist>
            ))}
          </div>
        </Playlists>
      </Modal>
    )
  }
)
