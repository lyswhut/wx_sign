const router = require('koa-router')()
// const log = require('log4js').getLogger('main')

router.get('/', async (ctx, next) => {
  // log.debug('This is in the index module')
  // console.log(JSON.stringify(ctx))
  await ctx.render('index', {
    title: 'welcome to wx_sign!'
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = 'koa2 string'
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

module.exports = router
