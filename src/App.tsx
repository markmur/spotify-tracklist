import {
  ActionButton,
  Box,
  Content,
  EmptyState,
  Flex,
  LeftPanel,
  LoginButton,
  RightPanel,
  SpotifyButton,
  Text,
  Textarea,
  TracklistContainer
} from './styles'
import React, { ChangeEvent, Component, Fragment, KeyboardEvent } from 'react'

import ActionsBar from './components/actions-bar'
import Footer from './components/footer'
import GoogleAnalytics from 'react-ga'
import Header from './components/header'
import Indicator from './components/indicator'
import Meta from './components/meta'
import PlaylistModal from './components/modals/playlists'
import Spinner from './components/spinner'
import Tracklist from './components/tracklist'
import { get } from './utils'
import spotify from './spotify'

GoogleAnalytics.initialize('UA-76403737-6')

const RE_TIMING = /[\(\[]?([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}[\)\]]?/gi
const RE_DASHES = /[-]{2,}/gi
const RE_SPECIAL_DASHES = /[\u2013\u2014]/gm
const RE_BRACKETS = /\[.*?\]$|\(.*?\)$/gim
const RE_FEATURED = /\b(feat|ft)\.?\b/gi
const RE_USER_HANDLE = /@[^\s]+(\s)?$/g // Detect and remove user handles (e.g., @55_MUSIC)
const RE_EXTRA_WHITESPACE = /\s{2,}/g
const RE_AND_IN_ARTIST = /\b\w?and\b/gi // Detect and replace "and" in the artist part

// Helper functions
const trimDashes = (x: string) => x.replace(RE_DASHES, '-')
const removeEmptyLines = (x: string = '') => x.trim().length > 0
const removeFeatured = (x: string) => x.replace(RE_FEATURED, '')
const removeUserHandles = (x: string) => x.replace(RE_USER_HANDLE, '')
const removeSpecialDashes = (x: string) => x.replace(RE_SPECIAL_DASHES, '-')
const removeAmpersands = (x: string = '') => x.replace(/&/g, 'and')
const removeBrackets = (x: string) => x.replace(RE_BRACKETS, '')
const removeTimingInformation = (x: string) => x.replace(RE_TIMING, '')
const cleanExtraWhitespace = (x: string) =>
  x.replace(RE_EXTRA_WHITESPACE, ' ').trim()

// Replace "and" with a comma in the artist portion
const cleanArtist = (x: string = '') => x.replace(RE_AND_IN_ARTIST, ',')

const processLine = (line: string = '') => {
  // Split into artist and track by finding the first dash (-)
  const parts = line.split(/\s*-\s*/, 2)
  if (parts.length < 2) return line // Return the original if no dash is found

  const artist = cleanArtist(parts[0]) // Replace "and" with commas in the artist part
  const track = parts[1] // Track remains unchanged
  return `${artist} - ${track}` // Return cleaned artist and track info
}

// Normalize special characters to their basic UTF-8 equivalents
const normalizeText = (x: string = '') =>
  x
    .normalize('NFD') // Decompose special characters
    .replace(/[\u0300-\u036f\u1dc0-\u1dff\u20d0-\u20ff]/g, '') // Remove all combining diacritics

// Function to capture artist and track information
const captureTrackInformation = (x: string) => {
  const captured =
    /(?:[\(\[]?[0-9]{0,2}[:.]*[0-9]{0,2}[:.]*[0-9]{0,2}[\]\)]?\s*)?([-:\s]*)(.+)/gi.exec(
      x
    )
  return captured ? captured[2] : ''
}

const handleAuthExpiry = (error: any) => {
  if (error?.response?.status === 401) {
    window.location.assign('/api/auth/refresh')
  }

  throw error
}

interface AppProps {
  initialValue: string
  shouldLoadResults: boolean
  user?: {
    product?: string
    token?: string
  }
}

interface AppState {
  init: boolean
  value: string
  user: Record<string, any>
  results: Array<any>
  total: number
  found: number
  playlists: Array<any>
  adding: string | null
  added: Array<string>
  searching: boolean
  paused: boolean | null
  currentTrack: Record<string, any>
  fetchingPlaylists: boolean
  modalVisible: boolean
  createPlaylistInput: string
}

class App extends Component<AppProps, AppState> {
  player: any
  deviceId: string
  listeners: Array<string>

  state: AppState = {
    init: true,
    value: this.props.initialValue,
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

    this.listeners.map((name) => this.player?.removeListener(name))
  }

  connectSpotifyPlayer() {
    const logError = ({ message }: { message: string }) => {
      console.error(message)
    }

    this.addListener('player_state_changed', (state: any) => {
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
    this.addListener('ready', ({ device_id }: { device_id: string }) => {
      this.deviceId = device_id
    })

    if (this.player) this.player?.connect()
  }

  addListener(name: string, callback: (state: any) => void) {
    this.listeners.push(name)
    if (this.player) this.player?.addListener(name, callback)
  }

  removeTrackNumbers = () => {
    this.setState((state) => ({
      value: this.formatQueryForSearch(state.value)
    }))
  }

  createPlaylist = (name: string) => {
    return spotify.createPlaylist(name).catch(handleAuthExpiry)
  }

  addTracksToPlaylist = async (id: string, tracks: Array<string>) => {
    this.setState({ adding: id })
    try {
      await spotify.addTracksToPlaylist(id, tracks)
      this.setState((state) => ({ adding: null, added: [...state.added, id] }))
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

  play = async (tracks: Array<string>) => {
    if (this.state.currentTrack.uri === tracks[0]) return this.player?.resume()

    return spotify
      .play(tracks, this.deviceId, this.state.user.token)
      .catch((error: any) => {
        console.error(error)
        handleAuthExpiry(error)
      })
  }

  playTrack =
    (id: string, index: number, uri: string) => (event: React.MouseEvent) => {
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
      this.play(results.slice(index).map((x) => x.uri))
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
    return this.play(results.map((x) => x.uri))
  }

  pause = () => {
    if (this.player) return this.player?.pause()
  }

  search = () => {
    const { value } = this.state

    this.setState({
      searching: true,
      value: this.formatQueryForSearch(value)
    })

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spotify-tracklist.last-search', value)
    }

    spotify
      .search(this.formatQueryForSearch(value))
      .then(({ data }) => {
        const results = data.results.filter(Boolean).map((result: any) => {
          if (Array.isArray(result)) {
            return this.getTrackInformation(result[0])
          }

          return this.getTrackInformation(result)
        })

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
      .catch((err) => {
        console.log('Error', err)
        this.setState({ searching: false })
      })
  }

  formatQueryForSearch(query: string) {
    return query
      .split('\n') // Split lines
      .filter(removeEmptyLines) // Remove empty lines
      .map(normalizeText) // Normalize special characters
      .map(captureTrackInformation) // Capture relevant info
      .map(removeBrackets) // Remove anything in brackets
      .map(removeAmpersands) // Replace '&' with 'and'
      .map(removeSpecialDashes) // Replace special dashes with regular
      .map(removeFeatured) // Remove 'feat' or 'ft'
      .map(removeUserHandles) // Remove @handles
      .map(trimDashes) // Trim excessive dashes
      .map(removeTimingInformation) // Remove timing information
      .map(cleanExtraWhitespace) // Clean extra whitespace
      .map(processLine) // Process each line
      .join('\n') // Join into a final string
  }

  getTrackInformation(track: any) {
    const { id, name, uri, ...rest } = track
    const image = get(track, 'album.images', []).find((x: any) => x)
    const album = get(track, 'album.name', '')
    const artist = get(track, 'artists', [])
      .map((x: any) => x.name)
      .join(', ')

    return {
      id,
      artist,
      album,
      title: name,
      image,
      uri,
      ...rest
    }
  }

  handleCreatePlaylistChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      createPlaylistInput: event.target.value
    })
  }

  createNewPlaylist = async () => {
    const { createPlaylistInput } = this.state

    try {
      const { data } = await spotify.createPlaylist(createPlaylistInput)
      this.setState((state) => ({
        createPlaylistInput: '',
        playlists: [data, ...state.playlists]
      }))
    } catch (error) {
      console.error(error)
      handleAuthExpiry(error)
    }
  }

  handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const encoded = btoa(event.target.value)
      history.replaceState({}, '', document.location.origin + `/${encoded}`)
    } catch (error) {
      console.log('Something went wrong', error)
    }

    this.setState({
      value: event.target.value
    })
  }

  handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.metaKey && event.key === 'Enter') {
      event.preventDefault()
      this.search()
    }
  }

  render() {
    const { user } = this.props
    const { found, total } = this.state

    const isLoggedIn = typeof user !== 'undefined'
    const userCanPlay = get(user, 'product') === 'premium'
    const hasResults = this.state.results.length > 0
    const isPlaying = this.state.currentTrack.id !== null && !this.state.paused
    const missing = this.state.results.filter((track) => track?.missing).length

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
          setModalState={(value) => this.setState({ modalVisible: value })}
          visible={this.state.modalVisible}
        />

        <Content>
          <LeftPanel>
            {!isLoggedIn && (
              <LoginButton>
                <SpotifyButton
                  as="a"
                  onClick={() => window.location.assign('/api/auth/login')}
                >
                  Login with Spotify
                </SpotifyButton>
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
              onKeyDown={this.handleKeyDown}
            />

            <Flex justifyContent="flex-end">
              <Box $flex={1} />
              <ActionButton primary $flex={0} onClick={this.search}>
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
                    Found {found - missing} of {total} on Spotify
                  </h4>
                  {missing > 0 && (
                    <Box mt={-3}>
                      <Text as="small" fontSize={12}>
                        Remove any line numbers or strange characters and try
                        again.
                      </Text>
                    </Box>
                  )}
                </Box>

                <TracklistContainer>
                  <Tracklist
                    results={this.state.results}
                    currentTrack={this.state.currentTrack}
                    paused={this.state.paused}
                    playTrack={this.playTrack}
                  />

                  {/* {this.state.missing.length ? (
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
                  ) : null} */}
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
