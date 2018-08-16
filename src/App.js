import React, { Fragment, Component } from 'react'
import GoogleAnalytics from 'react-ga'
import { hot } from 'react-hot-loader'
import { Flex } from 'grid-styled'
import { get } from './utils'
import spotify from './spotify'

import {
  Header,
  Footer,
  Content,
  LeftPanel,
  RightPanel,
  Textarea,
  Albums,
  Album,
  Image,
  Input,
  LoginButton,
  SongTitle,
  SongArtist,
  ActionsBar,
  ActionButton,
  SpotifyButton,
  SpotifyLink,
  Avatar,
  Modal,
  Playlists,
  Playlist,
  Backdrop
} from './styles'

class App extends Component {
  state = {
    value: '',
    user: {},
    results: [],
    total: 0,
    found: 0,
    playlists: [],
    adding: null,
    added: [],
    modalVisible: false,
    createPlaylistInput: ''
  }

  componentDidMount() {
    GoogleAnalytics.initialize('UA-76403737-6')

    spotify
      .getProfile()
      .then(({ data }) =>
        this.setState({
          user: data
        })
      )
      .catch(err => {
        console.error(err)
      })
  }

  removeTrackNumbers = () => {
    this.setState(state => ({
      value: this.formatQueryForSearch(state.value)
    }))
  }

  createPlaylist = async name => {
    try {
      const playlist = await spotify.createPlaylist(name)
      console.log(playlist)
    } catch (err) {
      console.error(err)
    }
  }

  addTracksToPlaylist = async (id, tracks) => {
    this.setState({ adding: id })
    try {
      await spotify.addTracksToPlaylist(id, tracks)
      this.setState(state => ({ adding: null, added: [...state.added, id] }))
      this.getPlaylists()
    } catch (err) {
      console.error(err)
      this.setState({ adding: null })
    }
  }

  getPlaylists = async () => {
    try {
      const { data } = await spotify.getPlaylists()
      this.setState({
        playlists: data.items,
        modalVisible: true
      })
    } catch (err) {
      console.error(err)
    }
  }

  search = () => {
    const { value } = this.state
    spotify
      .search(this.formatQueryForSearch(value))
      .then(({ data }) => {
        const results = data
          .filter(x => x.length)
          .map(x => this.getTrackInformation(x[0]))

        this.setState({
          results,
          total: value.split('\n').length,
          found: results.length
        })
      })
      .catch(err => {
        console.log('Error', err)
      })
  }

  formatQueryForSearch(query) {
    return query
      .split('\n')
      .map(
        x =>
          /([0-9]{0,2}[:.]*[0-9]{0,2}[:.]*[0-9]{0,2})?([-\s]*)(.+)/gi.exec(x)[3]
      )
      .map(x => x.replace(/\[.+\]$/gim, ''))
      .map(x => x.trim().replace('&', ''))
      .map(x => x.replace(/\u2013|\u2014/gm, '-'))
      .map(x => x.replace(/(feat|ft\.)/gim, ''))
      .join('\n')
  }

  getTrackInformation(track) {
    const { id, name, uri } = track
    const image = get(track, 'album.images', []).find(x => x)
    const album = get(track, 'album.name')
    const artist = get(track, 'artists')
      .map(x => x.name)
      .join(', ')

    return {
      id,
      artist,
      album,
      title: name,
      image,
      uri
    }
  }

  handleCreatePlaylistChange = event => {
    this.setState({
      createPlaylistInput: event.target.value
    })
  }

  createNewPlaylist = async () => {
    const { createPlaylistInput } = this.state

    try {
      const { data } = await spotify.createPlaylist(createPlaylistInput)
      this.createPlaylistInput.value = ''
      this.setState(state => ({
        playlists: [data, ...state.playlists]
      }))
    } catch (err) {
      console.error(err)
    }
  }

  render() {
    const { found, total } = this.state

    const placeholder = [
      'Paste tracklist here. Each track should be on a separate line:',
      'Artist - Name',
      'Artist - Name',
      'Artist - Name',
      'Artist - Name',
      'Artist - Name',
      'Artist - Name',
      '',
      '(You may have to manually tidy some track names to increase accuracy of results)'
    ].join('\n')

    return (
      <div>
        <Header>
          <h5>Spotify Tracklist Finder</h5>
          {this.state.user.id && (
            <Flex alignItems="center">
              {this.state.user.displayName}
              <Avatar ml={3} src={this.state.user.photos.find(x => x)} />
            </Flex>
          )}
        </Header>

        <Modal visible={this.state.modalVisible}>
          <Backdrop
            onClick={() =>
              this.setState({
                modalVisible: false
              })
            }
          />
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
                  ref={c => {
                    this.createPlaylistInput = c
                  }}
                  type="text"
                  name="create-playlist"
                  value={this.state.createPlaylistInput}
                  placeholder="Create new playlist..."
                  onChange={this.handleCreatePlaylistChange}
                />
                <div>
                  <SpotifyButton small onClick={this.createNewPlaylist}>
                    Create
                  </SpotifyButton>
                </div>
              </Flex>
              {this.state.playlists.map(playlist => (
                <Playlist key={playlist.id}>
                  <Flex alignItems="center" style={{ overflow: 'hidden' }}>
                    <Image mr={3} src={get(playlist.images[0], 'url')} />
                    <strong>{playlist.name}</strong>
                  </Flex>
                  <SpotifyButton
                    small
                    onClick={() =>
                      this.addTracksToPlaylist(playlist.id, this.state.results)
                    }
                  >
                    {this.state.added.includes(playlist.id)
                      ? '✓ Added'
                      : this.state.adding === playlist.id
                        ? 'Adding...'
                        : 'Add'}
                  </SpotifyButton>
                </Playlist>
              ))}
            </div>
          </Playlists>
        </Modal>

        <Content>
          <LeftPanel>
            {!this.state.user.id && (
              <LoginButton>
                <SpotifyLink href="/auth/spotify">
                  Login with Spotify
                </SpotifyLink>
              </LoginButton>
            )}

            <Textarea
              placeholder={placeholder}
              value={this.state.value}
              onChange={event =>
                this.setState({
                  value: event.target.value
                })
              }
            />
            <ActionsBar>
              <ActionButton secondary onClick={this.removeTrackNumbers}>
                Remove Track Numbers
              </ActionButton>
              <ActionButton
                secondary={this.state.value.length <= 0}
                primary={this.state.value.length > 0}
                onClick={this.search}
              >
                Find tracks on Spotify
              </ActionButton>
            </ActionsBar>
          </LeftPanel>

          <RightPanel>
            {this.state.results.length > 0 ? (
              <Fragment>
                <Albums>
                  <h4>
                    Found {found} of {total} on Spotify
                  </h4>
                  {this.state.results.map(
                    ({ id, title, artist, image, uri }) => (
                      <Album key={id} href={uri}>
                        <div>
                          <Image src={image.url} />
                        </div>
                        <div>
                          <SongTitle>{title}</SongTitle>
                          <SongArtist>{artist}</SongArtist>
                        </div>
                      </Album>
                    )
                  )}
                </Albums>

                <ActionsBar>
                  <ActionButton primary onClick={this.getPlaylists}>
                    Add tracks to playlist
                  </ActionButton>
                </ActionsBar>
              </Fragment>
            ) : null}
          </RightPanel>
        </Content>
        <Footer>
          <div>
            <a href="https://github.com/markmur/spotify-finder">
              View Source on GitHub
            </a>{' '}
            |<span> This app is not affiliated with Spotify.</span>
          </div>
          <div />
        </Footer>
      </div>
    )
  }
}

export default hot(module)(App)
