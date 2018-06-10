module.exports = {
  development: {
    credentials: {
      mongo: {
        connectionString: 'mongodb://user:password@host:port/wx_sign'
      }
    },
    port: 3000
  },
  production: {
    credentials: {
      mongo: {
        connectionString: 'mongodb://user:password@host:port/wx_sign'
      }
    },
    port: 3005
  },
  credentials: {
    wx: {
      koken: 'xxx',
      appId: 'xxx',
      appSecret: 'xxx'
    }
  },
  wx: {
    signOverTime: 2,
    showLimit: 10
  },
  serverName: '微信公众号签到系统',
  serverDomain: 'http://www.mynook.cn'
}
