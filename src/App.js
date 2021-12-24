import React, { Fragment, Component } from 'react'
import GoogleAnalytics from 'react-ga'

import { get } from './utils'
import spotify from './spotify'
import Spinner from './components/spinner'
import Meta from './components/meta'
import Indicator from './components/indicator'
import Footer from './components/footer'
import Header from './components/header'
import PlaylistModal from './components/modals/playlists'
import ActionsBar from './components/actions-bar'
import Tracklist from './components/tracklist'

import {
  Box,
  Flex,
  Text,
  Content,
  LeftPanel,
  RightPanel,
  Textarea,
  EmptyState,
  LoginButton,
  ActionButton,
  SpotifyLink,
  TracklistContainer
} from './styles'

GoogleAnalytics.initialize('UA-76403737-6')

const RE_TIMING = /([\(\[])([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}([\)\]])/gi
const RE_DASHES = /[-]{2,}/gi
const RE_SPECIAL_DASHES = /\u2013|\u2014/gm
const RE_BRACKETS = /\[.+\]$/gim
const RE_FEATURED = /(feat|ft)\.?/gim

const trimDashes = x => x.replace(RE_DASHES, '-')
const removeEmptyLines = (x = '') => x.trim().length > 0
const removeFeatured = x => x.replace(RE_FEATURED, '')
const removeSpecialDashes = x => x.replace(RE_SPECIAL_DASHES, '-')
const removeAmpersands = (x = '') => x.trim().replace('&', '')
const removeBrackets = x => x.replace(RE_BRACKETS, '')
const removeTimingInformation = x => x.replace(RE_TIMING, '')
const captureTrackInformation = x => {
  const captured = /([\[]?[0-9]{0,2}[:.]*[0-9]{0,2}[:.]*[0-9]{0,2}[\]]?[\s0-9.]*)?([-:\s]*)(.+)/gi.exec(
    x
  )

  return captured[3] || ''
}

const handleAuthExpiry = error => {
  if (error.response.status === 401) {
    window.location.assign('/api/auth/refresh')
  }

  throw error
}

class App extends Component {
  state = {
    init: true,
    value: this.props.initialValue,
    user: {},
    results: [],
    missing: [],
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

        if (this.props.shouldLoadResults) {
          this.search()
        }

        // window.onSpotifyWebPlaybackSDKReady = () => {
        //   this.player = new window.Spotify.Player({
        //     name: 'Tracklist for Spotify',
        //     getOauthToken: cb => cb(data.token)
        //   })

        //   this.connectSpotifyPlayer()
        // }
      })
      .catch(console.warn)
  }

  componentWillUnmount() {
    if (process.env.NODE_ENV === 'production') {
      if (this.player) this.player?.disconnect()
    }

    this.listeners.map(name => this.player?.removeListener(name))
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

    if (this.player) this.player?.connect()
  }

  addListener(name, callback) {
    this.listeners.push(name)
    if (this.player) this.player?.addListener(name, callback)
  }

  removeTrackNumbers = () => {
    this.setState(state => ({
      value: this.formatQueryForSearch(state.value)
    }))
  }

  createPlaylist = name => {
    return spotify.createPlaylist(name).catch(handleAuthExpiry)
  }

  addTracksToPlaylist = async (id, tracks) => {
    this.setState({ adding: id })
    try {
      await spotify.addTracksToPlaylist(id, tracks)
      this.setState(state => ({ adding: null, added: [...state.added, id] }))
      this.getPlaylists()
    } catch (error) {
      console.error(error)
      this.setState({ adding: null })
      handleAuthExpiry(error)
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
    } catch (error) {
      console.error(error)
      this.setState({ fetchingPlaylists: true })
      handleAuthExpiry(error)
    }
  }

  play = async tracks => {
    if (this.state.currentTrack.uri === tracks[0]) return this.player?.resume()

    return spotify
      .play(tracks, this.deviceId, this.state.user.token)
      .catch(error => {
        console.error(error)
        handleAuthExpiry(error)
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
      this.player?.resume()
      return
    }

    // Ignore the play button if no results
    if (!results || results.length <= 0) return

    // Play all tracks
    return this.play(results.map(x => x.uri))
  }

  pause = () => {
    if (this.player) return this.player?.pause()
  }

  search = () => {
    const { value } = this.state

    this.setState({ searching: true })

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spotify-tracklist.last-search', value)
    }

    spotify
      .search(this.formatQueryForSearch(value))
      .then(({ data }) => {
        const results = data.results
          .filter(x => x && x.length)
          .map(x => this.getTrackInformation(x[0]))

        this.setState({
          results,
          missing: data.missing,
          total: value.split('\n').filter(removeEmptyLines).length,
          found: results.length,
          searching: false,
          value: this.state.value
        })
      })
      .catch(handleAuthExpiry)
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
      .map(removeTimingInformation)
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
    } catch (error) {
      console.error(error)
      handleAuthExpiry(error)
    }
  }

  handleInputChange = event => {
    try {
      const encoded = btoa(event.target.value)
      history.replaceState({}, null, document.location.origin + `/${encoded}`)
    } catch (error) {
      console.log('Something went wrong', error)
    }

    this.setState({
      value: event.target.value
    })
  }

  render() {
    const { user } = this.props
    const { found, total } = this.state

    const isLoggedIn = typeof user !== 'undefined'
    const userCanPlay = get(user, 'product') === 'premium'
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
          '(You may have to manually tidy some track names to increase the accuracy of the search results)'
        ].join('\n')
      : ''

    return (
      <div>
        <Meta />

        <Header user={user} />

        <PlaylistModal
          added={this.state.added}
          adding={this.state.adding}
          createPlaylistInput={this.state.createPlaylistInput}
          handleCreateNewPlaylist={this.createNewPlaylist}
          handleCreatePlaylistChange={this.handleCreatePlaylistChange}
          handleAddTracksToPlaylist={this.addTracksToPlaylist}
          playlists={this.state.playlists}
          results={this.state.results}
          setModalState={value => this.setState({ modalVisible: value })}
          visible={this.state.modalVisible}
        />

        <Content>
          <LeftPanel>
            {!isLoggedIn && (
              <LoginButton>
                <SpotifyLink
                  onClick={() => window.location.assign('/api/auth/login')}
                >
                  Login with Spotify
                </SpotifyLink>
              </LoginButton>
            )}

            <Textarea
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder={placeholder}
              value={this.state.value}
              onChange={this.handleInputChange}
            />

            <Flex>
              <ActionButton
                flex={1}
                secondary
                onClick={this.removeTrackNumbers}
              >
                Remove Track Numbers
              </ActionButton>
              <ActionButton primary flex={1} onClick={this.search}>
                <Spinner active={this.state.searching} />{' '}
                {this.state.searching
                  ? 'Searching Spotify...'
                  : 'Find tracks on Spotify'}
              </ActionButton>
            </Flex>
          </LeftPanel>

          <RightPanel>
            {this.state.searching ? (
              <Indicator />
            ) : this.state.results.length > 0 ? (
              <Fragment>
                <Box ml={4}>
                  <h4>
                    Found {found} of {total} on Spotify
                  </h4>
                </Box>

                <TracklistContainer>
                  <Tracklist
                    results={this.state.results}
                    currentTrack={this.state.currentTrack}
                    paused={this.state.paused}
                    playTrack={this.playTrack}
                  />

                  {this.state.missing.length ? (
                    <React.Fragment>
                      <Box ml={4}>
                        <Text as="h4" mb={0}>
                          Missing ({this.state.missing?.length})
                        </Text>
                        <Text as="small" fontSize={12}>
                          Remove any line numbers or strange characters and try
                          again.
                        </Text>
                      </Box>
                      <Tracklist results={this.state.missing} />
                    </React.Fragment>
                  ) : null}
                </TracklistContainer>

                <ActionsBar
                  shouldDisplayActionsBar={hasResults && userCanPlay}
                  isPlaying={isPlaying}
                  play={this.playAll}
                  pause={this.pause}
                  getPlaylists={this.getPlaylists}
                  fetchingPlaylists={this.state.fetchingPlaylists}
                />
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

        <Footer />
      </div>
    )
  }
}

export default App
