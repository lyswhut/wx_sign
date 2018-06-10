module.exports = (ctx, json, openid) => {
  console.log('handle event')
  switch (json.Event[0]) {
    case 'subscribe':
      return {
        xml: {
          ToUserName: json.FromUserName,
          FromUserName: json.ToUserName,
          CreateTime: Date.now(),
          MsgType: 'text',
          Content: '欢迎关注！发送CD可查看可用功能哦~'
        }
      }
    default:
      break
  }
}
