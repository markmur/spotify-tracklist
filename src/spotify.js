import axios from 'axios'

class Spotify {
  constructor(basePath = '/api/spotify') {
    this.basePath = basePath
  }

  get(path) {
    return this.request('get', path)
  }

  post(path, data) {
    return this.request('post', path, data)
  }

  put(path, data) {
    return this.request('put', path, data)
  }

  request(method = 'get', path, data) {
    return axios[method](this.basePath + path, data)
  }

  search(query) {
    return this.post('/search', { query })
  }

  play(uris = [], device, token) {
    return axios.request({
      method: 'PUT',
      url: `https://api.spotify.com/v1/me/player/play?device_id=${device}`,
      data: {
        uris
      },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
  }

  getDevices() {
    return this.get('/devices')
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
