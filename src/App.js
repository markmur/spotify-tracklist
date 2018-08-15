import React, { Fragment, Component } from 'react'
import axios from 'axios'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'
import { Flex } from 'grid-styled'
import { lighten } from 'polished'
import { space } from 'styled-system'

const get = (obj, key, fallback) => {
  if (!obj) return fallback

  return (
    key
      .split('.')
      .reduce((state, x) => (state && state[x] ? state[x] : null), obj) ||
    fallback
  )
}

const theme = {
  colors: {
    dark: '#191414',
    light: '#272626',
    spotify: '#1db954',
    border: '#1a1a1a',
    footer: '#1f1e21',
    header: '#26262d'
  }
}

const Header = styled.header`
  height: 56px;
  background: ${theme.colors.header};
  padding: 1em;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap;
  height: 56px;
  background: ${theme.colors.footer};
  padding: 1em 2em;
  color: white;
  font-size: 13px;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  height: calc(100vh - 56px - 56px);
  background: ${lighten(0.001, theme.colors.footer)};
`

const LeftPanel = styled.div`
  flex: 0 1 50%;
  background: white;
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Textarea = styled.textarea`
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: bold;
  height: 70vh;
  line-height: 2.5;
  padding: 1.75em;
  color: white;
  resize: none;
  background: ${lighten(0.001, theme.colors.footer)};
`

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 0 1 50%;
  background: ${theme.colors.dark};
  color: white;
`

const Albums = styled.div`
  padding: 1em 2em 2em;
  flex: 1;
  overflow: auto;
  max-height: calc(100vh - 56px - 56px);
`

const Album = styled.a`
  display: flex;
  padding: 0.75em 1em;
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
  flex: 0 1 auto;
  border-radius: 3px;
  ${space};
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

const ActionsBar = styled.div`
  background: ${theme.colors.light};
  display: flex;
  justify-content: flex-end;
`

const hoverColor = color => `
&:hover {
  background: ${lighten(0.05, color)};
}
`
const primary = p =>
  p.primary &&
  `background: ${theme.colors.spotify}; ${hoverColor(theme.colors.spotify)}`

const secondary = p =>
  p.secondary &&
  `background: ${theme.colors.dark}; ${hoverColor(theme.colors.dark)}`

const ActionButton = styled.button`
  border: none;
  outline: none;
  color: white;
  padding: 1.35em 2.5em;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;

  ${primary};
  ${secondary};
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
  align-self: center;

  ${hoverColor(theme.colors.spotify)};
  ${p =>
    p.small &&
    `
    font-size: 12px;
    padding: 0.5em 1.75em;
  `};
`

const SpotifyLink = SpotifyButton.withComponent('a')

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  ${space};
`

const Modal = styled.div`
  display: ${p => (p.visible ? 'block' : 'none')};
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: auto;
  padding: 2em;
  color: white;
  z-index: 100;
`

const Playlists = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 75vh;
  max-width: 500px;
  overflow: auto;
  padding: 2em;
  color: white;
  z-index: 100;
  font-weight: bold;
  background: ${theme.colors.dark};
  border-radius: 4px;
  z-index: 2;
`

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
`

const Playlist = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1em;
  font-size: 14px;
  overflow: hidden;
  border-bottom: 1px solid ${theme.colors.light};

  &:hover {
    background: ${theme.colors.light};
  }

  strong {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    padding-right: 1em;
  }
`

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
    modalVisible: false
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
      .map(
        x =>
          /([0-9]{0,2}[\:\.]*[0-9]{0,2}[\:\.]*[0-9]{0,2})?([-\s]*)(.+)/gi.exec(
            x
          )[3]
      )
      .map(x => x.replace(/\[.+\]$/gim, ''))
      .map(x => x.trim().replace('&', ''))

    this.setState({ value: removed.join('\n').replace(/\u2013|\u2014/g, '-') })
  }

  createPlaylist = async name => {
    try {
      const playlist = await axios.post(`/playlists/new`, {
        name
      })
      console.log(playlist)
    } catch (err) {
      console.error(err)
    }
  }

  addTracksToPlaylist = async (id, tracks) => {
    this.setState({ adding: id })
    try {
      await axios.post(`/playlists/${id}/tracks`, {
        uris: tracks.map(track => track.uri)
      })
      this.setState(state => ({ adding: null, added: [...state.added, id] }))
      this.getPlaylists()
    } catch (err) {
      console.error(err)
      this.setState({ adding: null })
    }
  }

  getPlaylists = async () => {
    try {
      const { data } = await axios.get('/playlists')
      console.log(data)
      this.setState({
        playlists: data.items,
        modalVisible: true
      })
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
        <Header>
          <h5>Spotify Playlist Builder</h5>
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
              <SpotifyLink href="http://localhost:8888/auth/spotify">
                Login with Spotify
              </SpotifyLink>
            )}

            <Textarea
              placeholder="Artist - Track Name"
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
                onClick={this.fetch}
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
            </a>
          </div>
          <div>
            <p>This app is not affiliated with Spotify.</p>
          </div>
        </Footer>
      </div>
    )
  }
}

export default hot(module)(App)
