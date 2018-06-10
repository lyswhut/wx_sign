const userHelper = require('../../dbHelper/userHelper')
const signHelper = require('../../dbHelper/signHelper')
const config = require('../../config/config')
// const utils = require('../../utils/utils')
const CMD_TYPE = {
  MENU: 'CD',
  BIND: 'BD',
  UNBIND: 'JB',
  SIGN: 'QD',
  CREATE_SIGN: 'CQD',
  RECREATE_SIGN: 'RECQD',
  ATTEND: 'CQ',
  ABSENCE: 'QQ'
}

module.exports = async (json, openid) => {
  let sendJson
  if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.MENU) {
    sendJson = await showMenu(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.BIND) {
    sendJson = await bindNumber(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.UNBIND) {
    sendJson = await unbindNumber(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.SIGN) {
    sendJson = await sign(json, openid)
  } else if (json.Content[0].trim().substring(0, 3) === CMD_TYPE.CREATE_SIGN) {
    sendJson = await createSign(json, openid)
  } else if (json.Content[0].trim().substring(0, 5) === CMD_TYPE.RECREATE_SIGN) {
    sendJson = await createSign(json, openid, true)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.ATTEND) {
    sendJson = await getAttend(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.ABSENCE) {
    sendJson = await getabsence(json, openid)
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

  const code = isReCreate ? json.Content[0].trim().substring(5).trim() : json.Content[0].trim().substring(3).trim()
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
  const userSignCode = json.Content[0].trim().substring(2).trim()
  if (userSignCode !== todaySign.code) return createJson(json, `你的签到码（${userSignCode}）错误`)
  const isSignResult = checkSign(todaySign, userResult.number, openid)
  if (!isSignResult.signUser && isSignResult.openIdUser) return createJson(json, `你这是想帮别人签到吧？今天你已经给${isSignResult.openIdUser.number}签过到了`)
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
    let tempNumber = parseInt(json.Content[0].trim().substring(2, 13).trim())
    const number = isNaN(tempNumber) ? '' : tempNumber.toString()
    if (number.length !== 10) return createJson(json, `你这学号乱输的吧？我拿到你输入的学号为${number}\n注：绑定时不需要输入+号，例如：BD1234567890李华`)
    const user = await userHelper.checkUser(number)
    if (!user) return createJson(json, `你不是我们班的吧？我在数据库找不到你的学号！我拿到你输入的学号是${number}`)
    const name = json.Content[0].trim().substring(12).trim()
    if (user.name !== name) return createJson(json, `你输错学号还是输错名字？如果信息都正确，请联系管理员！我拿到你输入的学号是：${number}，名字是：${name}`)
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
    `在输入有+号的命令时+号不需要输。
--------------------
当前可用命令为：
--------------------
->显示菜单：
${CMD_TYPE.MENU}

->绑定学号：
${CMD_TYPE.BIND}+学号+姓名

->解绑学号：
${CMD_TYPE.UNBIND}

->签到：
${CMD_TYPE.SIGN}+签到码

->查看出勤人员：
${CMD_TYPE.ATTEND}

->查看缺勤人员：
${CMD_TYPE.ABSENCE}

->创建签到计划：
${CMD_TYPE.CREATE_SIGN}+签到码

->覆盖签到计划（注：该操作会清除今天已签到的用户）：
${CMD_TYPE.RECREATE_SIGN}+签到码`)
}

/**
 * 获取出勤人员
 * @param {*} json
 * @param {*} openid
 */
async function getAttend (json, openid) {
  const allSign = await signHelper.getAllSign()
  let str = ''
  let time
  for (const sign of allSign) {
    time = sign.date.replace('-', '年').replace('-', '月') + '日'
    str += `${time}：${config.serverDomain}/wx/attend?time=${sign.date}\n`
  }
  if (!str) return createJson(json, `暂无签到计划`)
  return createJson(json, `前十条出勤人员签到计划为：\n${str}`)
}

/**
 * 获取缺勤人员
 * @param {*} json
 * @param {*} openid
 */
async function getabsence (json, openid) {
  const allSign = await signHelper.getAllSign()
  let str = ''
  let time
  for (const sign of allSign) {
    time = sign.date.replace('-', '年').replace('-', '月') + '日'
    str += `${time}：${config.serverDomain}/wx/absence?time=${sign.date}\n`
  }
  if (!str) return createJson(json, `暂无签到计划`)
  return createJson(json, `前十条缺勤人员签到计划为：\n${str}`)
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
