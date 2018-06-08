module.exports = app => {
  [
    require('./main'),
    require('./wx')
  ].forEach((route) => {
    app.use(route.routes(), route.allowedMethods())
  })
}
