import axios from 'axios'

class Spotify {
  constructor(basePath = '/api') {
    this.basePath = basePath
  }

  get(path) {
    return this.request('get', path)
  }

  post(path, data) {
    return this.request('post', path, data)
  }

  request(method = 'get', path) {
    return axios[method](this.basePath + path)
  }

  search(query) {
    return this.post('/search', { list: query })
  }

  getProfile() {
    return this.get('/profile')
  }

  getPlaylists() {
    return this.get('/playlists')
  }

  createPlaylist(name) {
    return this.post('/playlists/new', { name })
  }

  addTracksToPlaylist(playlistId, tracks) {
    return this.post(`/playlists/${playlistId}/tracks`, {
      uris: tracks.map(x => x.uri)
    })
  }
}

export default new Spotify()
