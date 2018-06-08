const wxUtil = require('../utils/wx')

const log4js = require('log4js')

const log_cache = log4js.getLogger('cache')

global.wx = {
  accessToken: {}
}

module.exports = async () => {
  await wxUtil.getAccessToken().then((data) => {
    // wxUtil.pushMenu()
    setTimeout(() => {
      wxUtil.getAccessToken()
    }, (global.wx.accessToken.expires_in - 60) * 1000)
  }).catch((err) => {
    log_cache.error(`get token err: ${err}`)
  })
}
