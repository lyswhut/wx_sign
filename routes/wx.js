const router = require('koa-router')()
const wx = require('../handlers/wx/index')
const userHelper = require('../dbHelper/userHelper')

router.prefix('/wx')

router.get('/', function (ctx, next) {
  ctx.body = 'this is a api response!'
})

router.get('/api/wx', wx.signature)
router.post('/api/wx', wx.handleMsg)

router.get('/absence', wx.get_absence)

router.get('/api/test', async (ctx, next) => {
  await userHelper.checkUser()
})

module.exports = router
