const fs = require('fs')
const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')

// const logger = require('koa-logger')
const path = require('path')
const mongoose = require('mongoose')

const config = require('./config/config')

const log4js = require('log4js')

const log_database = log4js.getLogger('database')

// connect db
let connectionString
switch (app.env) {
  case 'development':
    connectionString = config.development.credentials.mongo.connectionString
    break
  case 'production':
    connectionString = config.production.credentials.mongo.connectionString
    break
  default:
    throw new Error('Unknown execution environment:' + app.env)
}
mongoose.connect(connectionString).then(() => {
  log_database.info('db is success connected.')
}, err => {
  log_database.error(`db connect error, errorInfo: ${err}`)
})

const models_path = path.join(__dirname, '/models')
/**
 * 已递归的形式，读取models文件夹下的js模型文件，并require
 * @param  {[type]} modelPath [description]
 * @return {[type]}           [description]
 */
const walk = (modelPath) => {
  fs.readdirSync(modelPath)
    .forEach((file) => {
      var filePath = path.join(modelPath, '/' + file)
      var stat = fs.statSync(filePath)

      if (stat.isFile()) {
        if (/(.*)\.(js|coffee)/.test(file)) {
          require(filePath)
        }
      } else if (stat.isDirectory()) {
        walk(filePath)
      }
    })
}
walk(models_path)

// cache data
// require('./handlers/cacheData')()
global.data = {
  wx: {
    signOverTime: config.wx.signOverTime
  }
}

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
// app.use(logger())
app.use(require('koa-static')(path.join(__dirname, './public')))

app.use(views(path.join(__dirname, './views'), {
  extension: 'pug'
}))

const log_http = log4js.getLogger('http')
// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  log_http.trace(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
require('./routes/index')(app)

// error-handling
app.on('error', (err, ctx) => {
  log_http.error('server error', err, ctx)
})

module.exports = app
