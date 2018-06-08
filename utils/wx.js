const request = require('request')
const config = require('../config/config')
exports.getAccessToken = () => {
  return new Promise((resolve, reject) => {
    request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.credentials.wx.appId}&secret=${config.credentials.wx.appSecret}`, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log(body)
        const json = JSON.parse(body)
        global.wx.accessToken.token = json.access_token
        global.wx.accessToken.time = new Date()
        global.wx.accessToken.expires_in = json.expires_in
        resolve(json)
      } else {
        reject(error)
      }
    })
  })
}

exports.pushMenu = async () => {
  await request({
    url: `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${global.wx.accessToken.token}`,
    method: 'POST',
    json: true,
    headers: {
      'content-type': 'application/json'
    },
    body: {
      'button': [
        {
          'type': 'click',
          'name': '今日歌曲',
          'key': 'V1001_TODAY_MUSIC'
        },
        {
          'name': '菜单',
          'sub_button': [
            {
              'type': 'view',
              'name': '搜索',
              'url': 'http://www.soso.com/'
            },
            {
              'type': 'miniprogram',
              'name': 'wxa',
              'url': 'http://mp.weixin.qq.com',
              'appid': 'wx286b93c14bbf93aa',
              'pagepath': 'pages/lunar/index'
            },
            {
              'type': 'click',
              'name': '赞一下我们',
              'key': 'V1001_GOOD'
            }]
        }]
    }
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body)
      // const json = JSON.parse(body)
      // console.log(json)
    }
  })
}
