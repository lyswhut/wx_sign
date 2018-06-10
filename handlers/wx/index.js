const crypto = require('crypto')
// const log4js = require('log4js')

const config = require('../../config/config')
const xmltool = require('../../utils/xmltool')
// const log_wx = log4js.getLogger('wx')

const userHelper = require('../../dbHelper/userHelper')
const signHelper = require('../../dbHelper/signHelper')
const handleEvent = require('./handleEvent')
const handleText = require('./handleText')
const utils = require('../../utils/utils')

/**
 * 处理微信的服务器验证get请求
 * @param {*} ctx
 * @param {*} next
 */
exports.signature = async (ctx, next) => {
  if (!ctx.query.signature || !ctx.query.timestamp || !ctx.query.nonce) {
    ctx.body = {code: -1, msg: 'fail'}
    return next
  }
  if (await checkSignature({signature: ctx.query.signature, timestamp: ctx.query.timestamp, nonce: ctx.query.nonce})) {
    ctx.body = ctx.query.echostr
  } else {
    ctx.body = {code: -1, msg: 'fail'}
    return next
  }
}

/**
 * 处理微信端用户发过来的post请求
 * @param {*} ctx
 * @param {*} next
 */
exports.handleMsg = async (ctx, next) => {
  if (!await checkSignature({signature: ctx.query.signature, timestamp: ctx.query.timestamp, nonce: ctx.query.nonce})) {
    ctx.body = {code: -1, msg: 'fail'}
    return next
  }
  if (ctx.is('text/xml')) {
    const result = await parseXml(ctx)
    console.log(result)
    const json = await handleMsg(ctx, result.xml, ctx.query.openid)
    const sendXml = xmltool.jsonToXml(json)
    // console.log(sendXml)
    ctx.body = sendXml
    await next()
  }
}

/**
 * 出勤人员get方法
 * @param {*} ctx
 * @param {*} next
 */
exports.get_attend = async (ctx, next) => {
  const timeStr = ctx.query.time
  const gargetIndex = parseInt(ctx.query.index)
  let time = new Date(timeStr)
  if (!timeStr || time.toString() === 'Invalid Date' || isNaN(gargetIndex)) return ctx.redirect(`${config.serverDomain}/`)

  const queryTime = utils.formatTime(time)
  const todaySign = await signHelper.getSign(queryTime)
  if (!todaySign || todaySign.signPlans.length < gargetIndex) return ctx.redirect(`${config.serverDomain}/`)
  await ctx.render('./wx/attend', {
    title: `${utils.formatTime(todaySign.signPlanInfo[gargetIndex].createTime, true)} 出勤人员`,
    todayUser: todaySign.signPlans[gargetIndex].users
  })
}

/**
 * 缺勤人员get方法
 * @param {*} ctx
 * @param {*} next
 */
exports.get_absence = async (ctx, next) => {
  const timeStr = ctx.query.time
  let time = new Date(timeStr)
  if (!timeStr || time.toString() === 'Invalid Date') {
    ctx.redirect(`${config.serverDomain}/`)
  } else {
    const timeStr = ctx.query.time
    const gargetIndex = parseInt(ctx.query.index)
    let time = new Date(timeStr)
    if (!timeStr || time.toString() === 'Invalid Date' || isNaN(gargetIndex)) return ctx.redirect(`${config.serverDomain}/`)

    const queryTime = utils.formatTime(time)
    const todaySign = await signHelper.getSign(queryTime)
    if (!todaySign || todaySign.signPlans.length < gargetIndex) return ctx.redirect(`${config.serverDomain}/`)

    const allUser = await userHelper.getAllUser()
    const absenceUsers = []
    // console.log(todaySign.signPlans)
    const signUsers = todaySign.signPlans[gargetIndex].users
    let isFind
    for (const user of allUser) {
      isFind = false
      for (const signUser of signUsers) {
        if (user.number === signUser.number) {
          isFind = true
          break
        }
      }
      if (!isFind) absenceUsers.push(user)
    }
    await ctx.render('./wx/absence', {
      title: `${utils.formatTime(todaySign.signPlanInfo[gargetIndex].createTime, true)} 缺勤人员`,
      todayUser: absenceUsers
    })
  }
}

/**
 * 分类处理消息
 * @param {*} json 用户发过来的消息
 * @param {*} openid 用户的openid
 */
async function handleMsg (ctx, json, openid) {
  let sendJson
  switch (json.MsgType[0]) {
    case 'event':
      sendJson = await handleEvent(ctx, json, openid)
      break
    case 'text':
      sendJson = await handleText(ctx, json, openid)
      break
    default:
      sendJson = {
        xml: {
          ToUserName: json.FromUserName,
          FromUserName: json.ToUserName,
          CreateTime: Date.now(),
          MsgType: 'text',
          Content: '哈哈哈'
        }
      }
  }
  // console.log(sendJson)
  return sendJson
}

/**
 * 验证微信服务器
 * @param {*} 验证参数
 */
function checkSignature ({signature, timestamp, nonce}) {
  const arr = [config.credentials.wx.koken, timestamp, nonce].sort()
  const sha1 = crypto.createHash('sha1')
  sha1.update(arr.join(''))
  const result = sha1.digest('hex')
  return result === signature
}

/**
 * 接收并解析XML内容
 * @param {*} ctx
 * @param {*} next
 */
async function parseXml (ctx, next) {
  const result = await new Promise((resolve, reject) => {
    let buf = ''
    ctx.req.setEncoding('utf8')
    ctx.req.on('data', (chunk) => {
      buf += chunk
    })
    ctx.req.on('end', () => {
      // console.log(buf)
      xmltool.xmlToJson(buf).then(resolve).catch(reject)
    })
  }).then((data) => {
    return data
  }).catch((err) => {
    console.log('parseXml err:', err)
  })
  return result
}
