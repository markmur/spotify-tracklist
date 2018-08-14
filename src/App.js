import React, { Component } from 'react'
import axios from 'axios'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'
import { Flex, Box } from 'grid-styled'

const theme = {
  colors: {
    dark: '#1a1a1a',
    spotify: '#1db954',
    border: '#1a1a1a'
  }
}

const Content = styled.div`
  display: flex;
  height: 100vh;
`

const LeftPanel = styled.div`
  flex: 0 1 50%;
  background: white;
  max-height: 100vh;
  overflow: auto;
`

const Textarea = styled.textarea`
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  height: 80vh;
`

const RightPanel = styled.div`
  flex: 0 1 50%;
  background: ${theme.colors.dark};
  color: white;
  max-height: 100vh;
  overflow: auto;
  padding: 1em;
`

const Albums = styled.div``

const Album = styled.a`
  display: flex;
  padding: 1em;
  border-radius: 4px;
  border-bottom: 1px solid ${theme.colors.border};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-bottom-color: transparent;
  }

  img {
    margin-right: 1em;
  }
`

const Image = styled.img.attrs({
  width: 40,
  height: 40
})`
  border-radius: 3px;
`

const SongTitle = styled.strong`
  display: block;
  color: white;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
`

const SongArtist = styled.small`
  color: #e3e3e3;
  display: block;
  font-size: 12px;
`

const SpotifyButton = styled.button`
  background: ${theme.colors.spotify};
  border-radius: 35px;
  color: white;
  border: none;
  outline: none;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.125em;
  padding: 0.8em 3em;
  font-size: 13px;
  cursor: pointer;
`

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-25%, -25%);
  padding: 2em;
  color: white;
  z-index: 100;
  background: ${theme.colors.dark};
`

const get = (obj, key, fallback) =>
  key
    .split('.')
    .reduce((state, x) => (state && state[x] ? state[x] : null), obj) ||
  fallback

class App extends Component {
  state = {
    value: '',
    user: {},
    results: [],
    total: 0,
    found: 0,
    playlists: []
  }

  componentDidMount() {
    axios
      .get('/profile')
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
    const { value } = this.state

    const removed = value
      .split('\n')
      .map(x => /([0-9]{0,2})\:([0-9]{0,2})([-\s]*)(.+)/gi.exec(x)[4])

    console.log({ removed })

    this.setState({ value: removed.join('\n').replace(/\u2013|\u2014/g, '-') })
  }

  createPlaylist = async name => {
    const { user } = this.state
    try {
      const playlist = await axios.put(`/v1/users/${user.id}/playlists`, {
        name
      })
      console.log(playlist)
    } catch (err) {
      console.error(err)
    }
  }

  getPlaylists = async () => {
    try {
      const playlists = await axios.get('/v1/me/playlists')
      this.setState({ playlists })
    } catch (err) {
      console.error(err)
    }
  }

  fetch = () => {
    const { value } = this.state
    axios
      .post('/search', {
        list: value
      })
      .then(({ data }) => {
        // const indexesOfNotFound = data
        //   .map((x, i) => (x.length > 0 ? null : i))
        //   .filter(x => x)

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

  render() {
    const { found, total } = this.state

    return (
      <div>
        <Modal>
          <ul>
            {this.state.playlists.map(playlist => (
              <li key={playlist.id}>{playlist.name}</li>
            ))}
          </ul>
        </Modal>
        <Content>
          <LeftPanel>
            <SpotifyButton href="http://localhost:8888/auth/spotify">
              Login with Spotify
            </SpotifyButton>

            <Textarea
              placeholder="Artist - Track Name"
              value={this.state.value}
              onChange={event =>
                this.setState({
                  value: event.target.value
                })
              }
            />
            <button type="button" onClick={this.removeTrackNumbers}>
              Remove Track Numbers
            </button>
            <button type="button" onClick={this.fetch}>
              Go!
            </button>
          </LeftPanel>

          <RightPanel>
            <h4>
              Found {found} of {total} on Spotify
            </h4>
            <Albums>
              {this.state.results.map(({ id, title, artist, image, uri }) => (
                <Album key={id} href={uri}>
                  <div>
                    <Image src={image.url} />
                  </div>
                  <div>
                    <SongTitle>{title}</SongTitle>
                    <SongArtist>{artist}</SongArtist>
                  </div>
                </Album>
              ))}
            </Albums>
            <Flex mt={3} justifyContent="center">
              <SpotifyButton onClick={this.getPlaylists}>
                Add to playlist
              </SpotifyButton>
            </Flex>
          </RightPanel>
        </Content>
      </div>
    )
  }
}

export default hot(module)(App)
