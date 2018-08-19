const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }

  console.log('Not authenticated', req.user)

  res.status(401).send()
}

module.exports = {
  isAuthenticated
}
