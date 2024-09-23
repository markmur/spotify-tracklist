import axios from 'axios'

class Spotify {
  basePath = '/api/spotify'

  get(path: string) {
    return this.request('get', path, {})
  }

  post(path: string, data: any) {
    return this.request('post', path, data)
  }

  put(path: string, data: any) {
    return this.request('put', path, data)
  }

  request(method: string, path: string, data: any) {
    if (method === 'get') {
      return axios.get(this.basePath + path, { params: data })
    }
    return (axios[method as keyof typeof axios] as Function)(
      this.basePath + path,
      data
    )
  }

  search(query: string) {
    return this.post('/search', { query })
  }

  play(uris: string[], device: string, token: string) {
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

  createPlaylist(name: string) {
    return this.post('/playlists/new', { name })
  }

  addTracksToPlaylist(playlistId: string, tracks: any[]) {
    return this.post(`/playlists/${playlistId}/tracks`, {
      uris: tracks.map((x: any) => x.uri)
    })
  }
}

export default new Spotify()
