const get = (obj, key, fallback) => {
  if (!obj) return fallback

  return (
    key
      .split('.')
      .reduce((state, x) => (state && state[x] ? state[x] : null), obj) ||
    fallback
  )
}

module.exports = {
  get
}
