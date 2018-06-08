const userHelper = require('../../dbHelper/userHelper')
const signHelper = require('../../dbHelper/signHelper')
const config = require('../../config/config')
// const utils = require('../../utils/utils')

module.exports = async (json, openid) => {
  let sendJson
  if (json.Content[0].trim().substring(0, 2) === 'CD') {
    sendJson = await showMenu(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === 'BD') {
    sendJson = await bindNumber(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === 'JB') {
    sendJson = await unbindNumber(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === 'QD') {
    sendJson = await sign(json, openid)
  } else if (json.Content[0].trim().substring(0, 3) === 'CQD') {
    sendJson = await createSign(json, openid)
  } else if (json.Content[0].trim().substring(0, 5) === 'RECQD') {
    sendJson = await createSign(json, openid, true)
  } else if (json.Content[0].trim().substring(0, 2) === 'QQ') {
    sendJson = await getabsence(json, openid, true)
  } else {
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
  return sendJson
}

/**
 * 创建签到计划
 * @param {*} json
 * @param {*} openid
 */
async function createSign (json, openid, isReCreate) {
  const checkBindUserResult = await checkBindUser(json, openid)
  const userResult = checkBindUserResult.data
  if (!checkBindUserResult.isBind) return userResult
  // if (openid !== 'x') return createJson(json, `没有权限创建签到计划！`)

  const code = isReCreate ? json.Content[0].trim().substring(5) : json.Content[0].trim().substring(3)
  // if (code === '') return createJson(json, `签到码为：${code}`)
  const todaySign = await signHelper.checkCreateSign()
  if (todaySign) {
    if (isReCreate) {
      const result = await signHelper.reCreateSign(todaySign, code)
      if (result) return createJson(json, `覆盖签到计划创建成功！签到码为：${code}`)
      return createJson(json, `签到计划创建失败！`)
    } else return createJson(json, `今天的签到计划已经创建，签到码为${todaySign.code}，如需覆盖请用RECQD命令`)
  } else {
    const result = await signHelper.createSign(code)
    if (result) return createJson(json, `签到计划创建成功！签到码为：${code}`)
  }
  return createJson(json, `签到计划创建失败！`)
}

/**
 * 签到
 * @param {*} json
 * @param {*} openid
 */
async function sign (json, openid) {
  const checkBindUserResult = await checkBindUser(json, openid)
  const userResult = checkBindUserResult.data
  if (!checkBindUserResult.isBind) return userResult
  const todaySign = await signHelper.checkCreateSign()
  if (!todaySign) return createJson(json, `签到失败，今天没有创建签到计划！`)
  const userSignCode = parseInt(json.Content[0].trim().substring(2)).toString()
  if (userSignCode !== todaySign.code) return createJson(json, `你的签到码（${userSignCode}）错误`)
  const isSignResult = checkSign(todaySign, userResult.number, openid)
  if (!isSignResult.signUser && isSignResult.openIdUser) return createJson(json, `你这是想帮别人签到吧？今天你已经在给${isSignResult.openIdUser.number}签过到了`)
  if (isSignResult.signUser) return createJson(json, `你（学号${userResult.number}）今天已经签到，无需再签到！`)
  const signResult = await signHelper.sign(todaySign, userResult)
  // console.log(signResult)
  if (signResult) return createJson(json, `学号${userResult.number}签到成功！`)
  return createJson(json, `签到失败！`)
  // return createJson(json, `test`)
}

/**
 * 检查是否已经签到
 * @param {String} wxOpenId 签到用户微信openId
 */
function checkSign (todaySign, targetNumber, openid) {
  const result = {}
  for (const user of todaySign.users) {
    if (user.wxOpenId === openid) {
      result.openIdUser = user
      break
    }
  }
  for (const user of todaySign.users) {
    if (user.number === targetNumber) {
      result.signUser = user
      break
    }
  }
  return result
}

/**
 * 检查是否绑定学号
 * @param {*} json
 * @param {*} openid
 */
async function checkBindUser (json, openid) {
  const userResult = await userHelper.checkBind(openid)
  return userResult ? {isBind: true, data: userResult}
    : {isBind: false, data: createJson(json, `你还没有绑定学号，请绑定学号再来签到吧！绑定方法为发送：BD+学号，例如：BD1234567890`)}
}

/**
 * 绑定学号
 * @param {*} json 用户发送过来的json格式消息
 * @param {*} openid 用户的openid
 */
async function bindNumber (json, openid) {
  const result = await userHelper.checkBind(openid)
  // console.log('checkUser', result)
  if (result) {
    return createJson(json, `您已绑定学号${result.number},若要重新绑定，请输入JB解绑再重新绑定！`)
  } else {
    const number = parseInt(json.Content[0].trim().substring(2)).toString()
    if (number.length !== 10) return createJson(json, `你这学号乱输的吧？我拿到你输入的学号为${number}`)
    const user = await userHelper.checkUser(number)
    if (!user) return createJson(json, `你不是我们班的吧？我在数据库找不到你的学号！我拿到你输入的学号是${number}`)
    if (user.wxOpenId) return createJson(json, `该学号已经被别人绑定了，请联系管理员，你输入的学号是${number}`)
    const result = await userHelper.bindUser({user: user, wxOpenId: openid})
    if (!result) return createJson(json, `绑定失败，再试一次吧，实在不行就去找管理员`)
    return createJson(json, `绑定成功！绑定的学号为${number}`)
  }
}

/**
 * 解绑学号
 * @param {*} json
 * @param {*} openid
 */
async function unbindNumber (json, openid) {
  const targetUser = await userHelper.checkBind(openid)
  if (!targetUser) return createJson(json, `无需解绑，您的微信号还没有与班级的任何同学绑定哦`)
  const result = await userHelper.unbindUser(targetUser, openid)
  if (result && !result.wxOpenId) return createJson(json, `成功解除与学号${targetUser.number}的绑定！`)
  return createJson(json, `解绑失败！`)
}

/**
 * 显示菜单
 * @param {*} json
 * @param {*} openid
 */
function showMenu (json, openid) {
  return createJson(json,
    `当前可用命令为：
->显示菜单：
CD

->绑定学号：
BD+学号

->解绑学号：
JB+学号

->签到：
QD+签到码

->创建签到计划：
CQD+签到码

->覆盖签到计划（注：该操作会清除今天已签到的用户）：
RECQD+签到码

->获取缺勤人员：
QQ`)
}

async function getabsence (json, openid) {
  const allSign = await signHelper.getAllSign()
  let str = ''
  let time
  for (const sign of allSign) {
    time = sign.date.replace('-', '年').replace('-', '月') + '日'
    str += `${time}：http://${config.serverDomain}/wx/absence?time=${sign.date}\n`
  }
  if (!str) return createJson(json, `暂无签到计划`)
  return createJson(json, `前十条签到计划为：\n${str}`)
}

/**
 * 根据文本消息创建json文件
 * @param {*} json
 * @param {*} msg
 */
function createJson (json, msg) {
  return {
    xml: {
      ToUserName: json.FromUserName,
      FromUserName: json.ToUserName,
      CreateTime: Date.now(),
      MsgType: 'text',
      Content: msg
    }
  }
}
