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
import React, { Component, Fragment } from 'react'

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
const trimDashes = (x) => x.replace(RE_DASHES, '-')
const removeEmptyLines = (x = '') => x.trim().length > 0
const removeFeatured = (x) => x.replace(RE_FEATURED, '')
const removeUserHandles = (x) => x.replace(RE_USER_HANDLE, '')
const removeSpecialDashes = (x) => x.replace(RE_SPECIAL_DASHES, '-')
const removeAmpersands = (x = '') => x.replace(/&/g, 'and')
const removeBrackets = (x) => x.replace(RE_BRACKETS, '')
const removeTimingInformation = (x) => x.replace(RE_TIMING, '')
const cleanExtraWhitespace = (x) => x.replace(RE_EXTRA_WHITESPACE, ' ').trim()

// Replace "and" with a comma in the artist portion
const cleanArtist = (x = '') => x.replace(RE_AND_IN_ARTIST, ',')

const processLine = (line = '') => {
  // Split into artist and track by finding the first dash (-)
  const parts = line.split(/\s*-\s*/, 2)
  if (parts.length < 2) return line // Return the original if no dash is found

  const artist = cleanArtist(parts[0]) // Replace "and" with commas in the artist part
  const track = parts[1] // Track remains unchanged
  return `${artist} - ${track}` // Return cleaned artist and track info
}

// Normalize special characters to their basic UTF-8 equivalents
const normalizeText = (x = '') =>
  x
    .normalize('NFD') // Decompose special characters
    .replace(/[\u0300-\u036f\u1dc0-\u1dff\u20d0-\u20ff]/g, '') // Remove all combining diacritics

// Function to capture artist and track information
const captureTrackInformation = (x) => {
  const captured =
    /(?:[\(\[]?[0-9]{0,2}[:.]*[0-9]{0,2}[:.]*[0-9]{0,2}[\]\)]?\s*)?([-:\s]*)(.+)/gi.exec(
      x
    )
  return captured ? captured[2] : ''
}

const handleAuthExpiry = (error) => {
  if (error?.response?.status === 401) {
    window.location.assign('/api/auth/refresh')
  }

  throw error
}

class App extends Component {
  state = {
    init: true,
    value: this.props.initialValue,
    user: {},
    results: results,
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
    const logError = ({ message }) => {
      console.error(message)
    }

    this.addListener('player_state_changed', (state) => {
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
    this.setState((state) => ({
      value: this.formatQueryForSearch(state.value)
    }))
  }

  createPlaylist = (name) => {
    return spotify.createPlaylist(name).catch(handleAuthExpiry)
  }

  addTracksToPlaylist = async (id, tracks) => {
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

  play = async (tracks) => {
    if (this.state.currentTrack.uri === tracks[0]) return this.player?.resume()

    return spotify
      .play(tracks, this.deviceId, this.state.user.token)
      .catch((error) => {
        console.error(error)
        handleAuthExpiry(error)
      })
  }

  playTrack = (id, index, uri) => (event) => {
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
        const results = data.results.filter(Boolean).map((result) => {
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

  formatQueryForSearch(query) {
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

  getTrackInformation(track) {
    const { id, name, uri, ...rest } = track
    const image = get(track, 'album.images', []).find((x) => x)
    const album = get(track, 'album.name', '')
    const artist = get(track, 'artists', [])
      .map((x) => x.name)
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

  handleCreatePlaylistChange = (event) => {
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

  handleInputChange = (event) => {
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

  handleKeyDown = (event) => {
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

// const results = [
//   {
//       "id": "12BaQt9aYdTlEtKreqB5V4",
//       "artist": "berlioz",
//       "album": "jazz is for ordinary people",
//       "title": "jazz is for ordinary people",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273c9a8853d7b582a01bda44093",
//           "width": 640
//       },
//       "uri": "spotify:track:12BaQt9aYdTlEtKreqB5V4"
//   },
//   {
//       "id": "4rWpR9yfsYLw8EEfZn0jWT",
//       "artist": "Gavinco",
//       "album": "The Four J's",
//       "title": "Silver",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2736d30d3accef6a8e86220518e",
//           "width": 640
//       },
//       "uri": "spotify:track:4rWpR9yfsYLw8EEfZn0jWT"
//   },
//   {
//       "id": "2JROi1QDgFOMbcyG32jnoO",
//       "artist": "DB Jeffer",
//       "album": "All Me EP",
//       "title": "Ni",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273cf453fa5b055b149ee1e78f4",
//           "width": 640
//       },
//       "uri": "spotify:track:2JROi1QDgFOMbcyG32jnoO"
//   },
//   {
//       "id": "3QKwN4AqdLsgJGiz73B62I",
//       "artist": "Ella Fitzgerald, Miguel Migs",
//       "album": "Verve Remixed 2",
//       "title": "Slap That Bass - Miguel Migs Petalpusher Remix",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b27310d63d9350864498fb3da8ef",
//           "width": 640
//       },
//       "uri": "spotify:track:3QKwN4AqdLsgJGiz73B62I"
//   },
//   {
//       "id": "3bjx5In6MlYVbyrsJ2Lbe2",
//       "artist": "The Detroit Experiment",
//       "album": "Deviation Classics",
//       "title": "Think Twice",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2730bcd125d171dca0ff76bbf7e",
//           "width": 640
//       },
//       "uri": "spotify:track:3bjx5In6MlYVbyrsJ2Lbe2"
//   },
//   {
//       "id": "3VtojB7L6g6skduYAwxr6x",
//       "artist": "Llorca",
//       "album": "Newcomer",
//       "title": "The Novel Sound",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b27312e7135820be0681eb90ff03",
//           "width": 640
//       },
//       "uri": "spotify:track:3VtojB7L6g6skduYAwxr6x"
//   },
//   {
//       "id": "0gubHgzcmkpPO8TJnNNH7H",
//       "artist": "Brooklyn Baby",
//       "album": "Get It Together",
//       "title": "Jazz Please",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273017b63b2fdc143ebb5f6d865",
//           "width": 640
//       },
//       "uri": "spotify:track:0gubHgzcmkpPO8TJnNNH7H"
//   },
//   {
//       "id": "30w0Ow2tuaZL26ep5pEn2M",
//       "artist": "Felipe Gordon",
//       "album": "Wait on Me EP",
//       "title": "The Semimodular Bird of Jazz",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2732b48ebe9c7b3b0ed0bbb288f",
//           "width": 640
//       },
//       "uri": "spotify:track:30w0Ow2tuaZL26ep5pEn2M"
//   },
//   {
//       "id": "5WUFHsHalXJth7oBEZ3pPl",
//       "artist": "DJ Spen, Ziggy Funk, Gary Hudgins",
//       "album": "Transition",
//       "title": "Don't Be Afraid",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273c58b07a8d4c4730b80c9ef40",
//           "width": 640
//       },
//       "uri": "spotify:track:5WUFHsHalXJth7oBEZ3pPl"
//   },
//   {
//       "id": "6loDuwmsq6fazVxqqRhmcp",
//       "artist": "berlioz, Ted Jasper",
//       "album": "nyc in 1940",
//       "title": "nyc in 1940",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2736367b81be2901a8670d944e8",
//           "width": 640
//       },
//       "uri": "spotify:track:6loDuwmsq6fazVxqqRhmcp"
//   },
//   {
//       "id": "18xANokndhY8ZLuDLEzr1s",
//       "artist": "Sameed",
//       "album": "Jazzy-Ish By Mad Mats",
//       "title": "Dusty Jazz",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273744fa511ee019ee7a04f6dd2",
//           "width": 640
//       },
//       "uri": "spotify:track:18xANokndhY8ZLuDLEzr1s"
//   },
//   {
//       "id": "2n3DrjFLQVDY6mEuiM1R1L",
//       "artist": "Dizzy Gillespie, James Moody, Streets of Fandango",
//       "album": "Dizzy Gillespie & Friends: Concert of the Century (Remixes)",
//       "title": "Darben the Redd Foxx - Streets of Fandango Remix",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b27396293fc9b9e5d10869eb724b",
//           "width": 640
//       },
//       "uri": "spotify:track:2n3DrjFLQVDY6mEuiM1R1L"
//   },
//   {
//       "id": "2uyKZb8FL9gd47ZUjaM8wp",
//       "artist": "St Germain, Atjazz",
//       "album": "Sittin' Here (Remixes)",
//       "title": "Sittin' Here - Atjazz Remix",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273d7bcfd8301b6c2b755551a96",
//           "width": 640
//       },
//       "uri": "spotify:track:2uyKZb8FL9gd47ZUjaM8wp"
//   },
//   {
//       "id": "4BBIhAwgBPSgU159OF2OzZ",
//       "artist": "Move D, Le Rubrique",
//       "album": "Bossa #1",
//       "title": "Bossa #1 - The Late Night Dance Remix by Le Rubrique",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273b8223b5d2c74f3a15cfe05a6",
//           "width": 640
//       },
//       "uri": "spotify:track:4BBIhAwgBPSgU159OF2OzZ"
//   },
//   {
//       "id": "6glOYu71QshPxanBJYrsYl",
//       "artist": "Razz, Giant Rooks",
//       "album": "Nocturnal",
//       "title": "Another Heart/Another Mind",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2732f232774eeac8d67b2fd7b63",
//           "width": 640
//       },
//       "uri": "spotify:track:6glOYu71QshPxanBJYrsYl"
//   },
//   {
//       "id": "3dv9xBJUj8NWRopMaSpZ4N",
//       "artist": "Key Tronics Ensemble",
//       "album": "Music You Got Me / Anamaria",
//       "title": "Anamaria",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2736077068cb98a8befa1e1d90e",
//           "width": 640
//       },
//       "uri": "spotify:track:3dv9xBJUj8NWRopMaSpZ4N"
//   },
//   {
//       "id": "5FH4l3SUZ2McAFUfOWfKkW",
//       "artist": "Billie Holiday, Charles Feelgood",
//       "album": "Remixed & Reimagined",
//       "title": "All Of Me - Charles Feelgood Remix",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2737a8787661c5bd6bae1f406db",
//           "width": 640
//       },
//       "uri": "spotify:track:5FH4l3SUZ2McAFUfOWfKkW"
//   },
//   {
//       "id": "1luy9yIB5zpCQggb1Tk1Tq",
//       "artist": "Jean-Philippe Rameau, Stephan Pas, Paul Van Utrecht, Huib Ramaer, Cobla La Principal d'Amsterdam",
//       "album": "Les Indes Galantes of Rameau Ontvlamt, Romantic Barock for Cobla and Narrator",
//       "title": "Third entrée : The incas of Peru, Medley : loure en rondeau, gavotte 1 et 2",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b2733b7444c04ead248ddc28f9f7",
//           "width": 640
//       },
//       "uri": "spotify:track:1luy9yIB5zpCQggb1Tk1Tq"
//   },
//   {
//       "id": "3D81MlHW606IHBcxFGnX4R",
//       "artist": "Tim Deluxe",
//       "album": "JAS",
//       "title": "JAS - Club Mix",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273fed9870ca0758c9fc3e4afe0",
//           "width": 640
//       },
//       "uri": "spotify:track:3D81MlHW606IHBcxFGnX4R"
//   },
//   {
//       "id": "0q64O7oM5jsEQEv5hXXWfE",
//       "artist": "Nina Simone, Floorplan",
//       "album": "I Put A Spell On You (Floorplan Remix)",
//       "title": "I Put A Spell On You - Floorplan Remix",
//       "image": {
//           "height": 640,
//           "url": "https://i.scdn.co/image/ab67616d0000b273f80c39a71989ec1339be0c2a",
//           "width": 640
//       },
//       "uri": "spotify:track:0q64O7oM5jsEQEv5hXXWfE"
//   }
// ]
const results = []
