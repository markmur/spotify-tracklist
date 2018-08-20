/* eslint-disable no-useless-escape */
import React, { Fragment, Component } from 'react'
import GoogleAnalytics from 'react-ga'
import { hot } from 'react-hot-loader'
import { Flex } from 'grid-styled'
import { get } from './utils'
import spotify from './spotify'
import Spinner from './components/spinner'
import Indicator from './components/indicator'
import Icon from './components/icon'

import {
  Header,
  Footer,
  Content,
  LeftPanel,
  RightPanel,
  Textarea,
  Tracks,
  Track,
  Image,
  Input,
  EmptyState,
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
  Backdrop,
  TrackImage,
  PlaybackIcon
} from './styles'

GoogleAnalytics.initialize('UA-76403737-6')

const trimDashes = x => x.replace(/[-]{2,}/gi, '-')
const removeEmptyLines = (x = '') => x.trim().length > 0
const removeFeatured = x => x.replace(/(feat|ft)\.?/gim, '')
const removeSpecialDashes = x => x.replace(/\u2013|\u2014/gm, '-')
const removeAmpersands = (x = '') => x.trim().replace('&', '')
const removeBrackets = x => x.replace(/\[.+\]$/gim, '')

const captureTrackInformation = x => {
  const captured = /([\[]?[0-9]{0,2}[:.]*[0-9]{0,2}[:.]*[0-9]{0,2}[\]]?[\s0-9.]*)?([-:\s]*)(.+)/gi.exec(
    x
  )

  return captured[3] || ''
}

class App extends Component {
  state = {
    init: true,
    value: '',
    user: {},
    results: [],
    total: 0,
    found: 0,
    playlists: [],
    adding: null,
    added: [],
    searching: false,
    paused: true,
    currentTrack: {},
    fetchingPlaylists: false,
    modalVisible: false,
    createPlaylistInput: ''
  }

  componentDidMount() {
    this.listeners = []

    GoogleAnalytics.pageview(window.location.pathname + window.location.search)

    spotify
      .getProfile()
      .then(({ data }) => {
        this.setState({
          user: data
        })

        window.onSpotifyWebPlaybackSDKReady = () => {
          this.player = new window.Spotify.Player({
            name: 'Tracklist for Spotify',
            getOauthToken: cb => cb(data.token)
          })

          this.connectSpotifyPlayer()
        }
      })
      .catch(console.warn)
  }

  componentWillUnmount() {
    if (process.env.NODE_ENV === 'production') {
      if (this.player) this.player.disconnect()
    }

    this.listeners.map(name => this.player.removeListener(name))
  }

  connectSpotifyPlayer() {
    const logError = ({ message }) => {
      console.error(message)
    }

    this.addListener('player_state_changed', state => {
      if (!state) {
        this.setState({
          currentTrack: {},
          paused: null
        })
        return
      }

      const {
        paused,
        track_window: { current_track }
      } = state
      this.setState({
        paused,
        currentTrack: current_track
      })
    })

    this.addListener('initialization_error', logError)
    this.addListener('authentication_error', logError)
    this.addListener('account_error', logError)
    this.addListener('ready', ({ device_id }) => {
      this.deviceId = device_id
    })

    this.player.connect()
  }

  addListener(name, callback) {
    this.listeners.push(name)
    this.player.addListener(name, callback)
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
    this.setState({ fetchingPlaylists: true })
    try {
      const { data } = await spotify.getPlaylists()
      this.setState({
        playlists: data.items,
        modalVisible: true,
        fetchingPlaylists: false
      })
    } catch (err) {
      console.error(err)
      this.setState({ fetchingPlaylists: true })
    }
  }

  play = async tracks => {
    if (this.state.currentTrack.uri === tracks[0]) return this.player.resume()

    const { data } = await spotify.getDevices()

    return spotify
      .play(
        tracks,
        get(data, 'device.id', this.deviceId),
        this.state.user.token
      )
      .catch(err => {
        console.error(err)
      })
  }

  playTrack = (id, index, uri) => event => {
    event.preventDefault()
    event.stopPropagation()

    const userHasPremium = get(this.state.user, 'product') === 'premium'

    if (!userHasPremium) {
      window.location.href = uri
      return
    }

    const { results } = this.state

    // If track is currently playing, then pause it
    if (this.state.currentTrack.id === id && !this.state.paused) {
      return this.pause()
    }

    // Play all from track index onwards
    this.play(results.slice(index).map(x => x.uri))
  }

  playAll = () => {
    const { results, currentTrack, paused } = this.state

    // If there's a track in state already, then resume
    if (typeof currentTrack.id !== 'undefined' && paused) {
      this.player.resume()
      return
    }

    // Ignore the play button if no results
    if (!results || results.length <= 0) return

    // Play all tracks
    return this.play(results.map(x => x.uri))
  }

  pause = () => {
    if (this.player) return this.player.pause()
  }

  search = () => {
    const { value } = this.state
    this.setState({ searching: true })
    spotify
      .search(this.formatQueryForSearch(value))
      .then(({ data }) => {
        const results = data
          .filter(x => x && x.length)
          .map(x => this.getTrackInformation(x[0]))

        this.setState({
          results,
          total: value.split('\n').filter(removeEmptyLines).length,
          found: results.length,
          searching: false
        })
      })
      .catch(err => {
        console.log('Error', err)
        this.setState({ searching: false })
      })
  }

  formatQueryForSearch(query) {
    return query
      .split('\n')
      .filter(removeEmptyLines)
      .map(captureTrackInformation)
      .map(removeBrackets)
      .map(removeAmpersands)
      .map(removeSpecialDashes)
      .map(removeFeatured)
      .map(trimDashes)
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
      this.setState(state => ({
        createPlaylistInput: '',
        playlists: [data, ...state.playlists]
      }))
    } catch (err) {
      console.error(err)
    }
  }

  render() {
    const { found, total } = this.state

    const isLoggedIn = typeof this.state.user.id !== 'undefined'
    const userCanPlay = get(this.state.user, 'product') === 'premium'
    const hasResults = this.state.results.length > 0
    const isPlaying = this.state.currentTrack.id !== null && !this.state.paused

    const placeholder = isLoggedIn
      ? [
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
      : ''

    return (
      <div>
        <Header>
          <h3>Tracklist for Spotify</h3>
          {isLoggedIn && (
            <Flex alignItems="center">
              {this.state.user.display_name}
              <Avatar ml={3} src={this.state.user.images.find(x => x).url} />
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
            {!isLoggedIn && (
              <LoginButton>
                <SpotifyLink href="/auth/spotify">
                  Login with Spotify
                </SpotifyLink>
              </LoginButton>
            )}

            <Textarea
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
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
                <Spinner active={this.state.searching} />{' '}
                {this.state.searching
                  ? 'Searching Spotify...'
                  : 'Find tracks on Spotify'}
              </ActionButton>
            </ActionsBar>
          </LeftPanel>

          <RightPanel>
            {this.state.searching ? (
              <Indicator />
            ) : this.state.results.length > 0 ? (
              <Fragment>
                <Tracks>
                  <h4>
                    Found {found} of {total} on Spotify
                  </h4>
                  {this.state.results.map(
                    ({ id, title, artist, image, uri }, i) => (
                      <Track key={id} onClick={this.playTrack(id, i, uri)}>
                        <Flex>
                          <TrackImage>
                            <Image src={image.url} />
                            <PlaybackIcon
                              className="playback-icon"
                              isPlaying={this.state.currentTrack.id === id}
                            >
                              {this.state.currentTrack.id === id ? (
                                this.state.paused ? (
                                  '▶'
                                ) : (
                                  <Icon type="pause" />
                                )
                              ) : (
                                '▶'
                              )}
                            </PlaybackIcon>
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
                    )
                  )}
                </Tracks>

                <ActionsBar>
                  {hasResults &&
                    userCanPlay && (
                      <ActionButton
                        secondary
                        onClick={isPlaying ? this.pause : this.playAll}
                      >
                        {isPlaying ? (
                          <span>
                            <Icon type="pause" /> Pause
                          </span>
                        ) : (
                          '▶ Play'
                        )}
                      </ActionButton>
                    )}
                  <ActionButton primary onClick={this.getPlaylists}>
                    <Spinner active={this.state.fetchingPlaylists} />{' '}
                    {this.state.fetchingPlaylists ? (
                      'Fetching playlists...'
                    ) : (
                      <span>
                        <Icon mr={2} type="add-to-list" />
                        Add to playlist
                      </span>
                    )}
                  </ActionButton>
                </ActionsBar>
              </Fragment>
            ) : (
              <EmptyState>
                {this.state.init ? (
                  <div>
                    <p>Tracks will appear here</p>
                    <small>
                      Get started by pasting a tracklist in the left panel
                    </small>
                  </div>
                ) : (
                  <div>
                    <p>No results found.</p>
                    <small>
                      Try removing track numbers, album information and special
                      characters and search again.
                    </small>
                  </div>
                )}
              </EmptyState>
            )}
          </RightPanel>
        </Content>
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
      </div>
    )
  }
}

export default hot(module)(App)
