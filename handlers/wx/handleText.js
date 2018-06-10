const userHelper = require('../../dbHelper/userHelper')
const signHelper = require('../../dbHelper/signHelper')
const config = require('../../config/config')
const utils = require('../../utils/utils')
const CMD_TYPE = {
  MENU: 'CD',
  BIND: 'BD',
  UNBIND: 'JB',
  SIGN: 'QD',
  CREATE_SIGN: 'CQD',
  RECREATE_SIGN: 'RECQD',
  ATTEND: 'CQ',
  ABSENCE: 'QQ',
  CHANGE_SIGN_OVER_TIME: 'XGSJ'
}

module.exports = async (ctx, json, openid) => {
  let sendJson
  if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.MENU) {
    sendJson = await handleShowMenu(ctx, json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.BIND) {
    sendJson = await handleBindNumber(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.UNBIND) {
    sendJson = await handleUnbindNumber(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.SIGN) {
    sendJson = await handleSign(json, openid)
  } else if (json.Content[0].trim().substring(0, 3) === CMD_TYPE.CREATE_SIGN) {
    sendJson = await handleCreateSign(ctx, json, openid)
  } else if (json.Content[0].trim().substring(0, 5) === CMD_TYPE.RECREATE_SIGN) {
    sendJson = await handleCreateSign(ctx, json, openid, true)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.ATTEND) {
    sendJson = await handleGetAttend(json, openid)
  } else if (json.Content[0].trim().substring(0, 2) === CMD_TYPE.ABSENCE) {
    sendJson = await handleGetabsence(json, openid)
  } else if (json.Content[0].trim().substring(0, 4) === CMD_TYPE.CHANGE_SIGN_OVER_TIME) {
    sendJson = await handleChangeSignOverTime(ctx, json, openid)
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
async function handleCreateSign (ctx, json, openid, isReCreate) {
  // const checkBindUserResult = await checkBindUser(json, openid)
  // const userResult = checkBindUserResult.data
  // if (!checkBindUserResult.isBind) return userResult
  // if (openid !== 'x') return createJson(json, `没有权限创建签到计划！`)

  const code = isReCreate ? json.Content[0].trim().substring(5).trim() : json.Content[0].trim().substring(3).trim()
  // if (code === '') return createJson(json, `签到码为：${code}`)
  const now = new Date()
  let todaySign = await signHelper.getTodaySign()
  if (!todaySign) {
    todaySign = await signHelper.createTodaySign()
    const result = await signHelper.createSign(todaySign, {
      createTime: now,
      TTL: global.data.wx.signOverTime,
      overTime: new Date(now + TTLFormate(global.data.wx.signOverTime)),
      code: code
    })
    if (result) return createJson(json, `签到计划创建成功！签到码为：${code}`)
    return createJson(json, `签到计划创建失败！`)
  }
  const lastSign = getLastSign(todaySign)
  if (now - lastSign.signInfo.overTime < TTLFormate(lastSign.signInfo.TTL)) {
    if (isReCreate) {
      const result = await signHelper.reCreateSign(todaySign, lastSign.lastIndex, {
        createTime: now,
        TTL: global.data.wx.signOverTime,
        overTime: new Date(now + TTLFormate(global.data.wx.signOverTime)),
        code: code
      })
      if (result) return createJson(json, `覆盖签到计划创建成功！签到码为：${code}`)
      return createJson(json, `签到计划创建失败！`)
    } else return createJson(json, `当前有签到计划正在进行，签到码为${lastSign.signInfo.code}，如需覆盖请用RECQD命令`)
  }
  const result = await signHelper.createSign(todaySign, {
    createTime: now,
    TTL: global.data.wx.signOverTime,
    overTime: new Date(now + TTLFormate(global.data.wx.signOverTime)),
    code: code
  })
  if (result) return createJson(json, `签到计划创建成功！签到码为：${code}`)
  return createJson(json, `签到计划创建失败！`)
}

/**
 * 格式化TTL
 * @param {*} TTL
 */
function TTLFormate (TTL) {
  return TTL * 60000
}

/**
 * 获取最后一次签到计划信息
 * @param {*} todaySign
 */
function getLastSign (todaySign) {
  const lastIndex = todaySign.signPlanInfo.length - 1
  return {lastIndex, signInfo: todaySign.signPlanInfo[lastIndex], signUsers: todaySign.signPlans[lastIndex]}
}

/**
 * 签到
 * @param {*} json
 * @param {*} openid
 */
async function handleSign (json, openid) {
  const checkBindUserResult = await checkBindUser(json, openid)
  const userResult = checkBindUserResult.data
  if (!checkBindUserResult.isBind) return userResult
  const todaySign = await signHelper.getTodaySign()
  if (!todaySign) return createJson(json, `签到失败，当前没有正在进行的签到计划！`)
  const lastSign = getLastSign(todaySign)
  const now = new Date()
  if (now - lastSign.signInfo.overTime > TTLFormate(lastSign.signInfo.TTL)) return createJson(json, `签到失败，签到时间已过，当前没有正在进行的签到计划！`)

  const userSignCode = json.Content[0].trim().substring(2).trim()
  if (userSignCode !== lastSign.signInfo.code) return createJson(json, `你的签到码（${userSignCode}）错误`)
  const isSignResult = checkSign(lastSign.signUsers, userResult.number, openid)
  if (!isSignResult.signUser && isSignResult.openIdUser) return createJson(json, `你这是想帮别人签到吧？本次你已经给${isSignResult.openIdUser.number}签过到了`)
  if (isSignResult.signUser) return createJson(json, `你（学号${userResult.number}）本次已经签到，无需再签到！`)
  const signResult = await signHelper.sign(todaySign, lastSign.lastIndex, userResult)
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
async function handleBindNumber (json, openid) {
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
async function handleUnbindNumber (json, openid) {
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
function handleShowMenu (ctx, json, openid) {
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

->覆盖签到计划（注：该操作会清除本次已签到的用户）：
${CMD_TYPE.RECREATE_SIGN}+签到码

->修改签到超时时间（单位为分钟）：
${CMD_TYPE.CHANGE_SIGN_OVER_TIME}+超时时间

--------------------
当前超时时间为${fromateSignOverTimeStr(global.data.wx.signOverTime)}`)
}

/**
 * 获取出勤人员
 * @param {*} json
 * @param {*} openid
 */
async function handleGetAttend (json, openid) {
  const limitSign = await signHelper.getLimitSign(config.wx.showLimit)
  let str = ''
  let time
  for (const daySign of limitSign) {
    time = daySign.date.replace('-', '年').replace('-', '月') + '日：'
    str += `->${time}\n`
    for (const [index, sign] of daySign.signPlanInfo.entries()) {
      str += `--------------------\n${utils.formatTime(sign.createTime, true)}：${config.serverDomain}/wx/attend?time=${daySign.date}&index=${index}\n`
    }
    str += '\n'
  }
  if (!str) return createJson(json, `暂无签到计划`)
  return createJson(json, `前${config.wx.showLimit}天出勤人员签到计划为：\n${str}`)
}

/**
 * 获取缺勤人员
 * @param {*} json
 * @param {*} openid
 */
async function handleGetabsence (json, openid) {
  const limitSign = await signHelper.getLimitSign(config.wx.showLimit)
  let str = ''
  let time
  for (const daySign of limitSign) {
    time = daySign.date.replace('-', '年').replace('-', '月') + '日'
    str += `->${time}\n`
    for (const [index, sign] of daySign.signPlanInfo.entries()) {
      // console.log(sign.createTime)
      str += `--------------------\n${utils.formatTime(sign.createTime, true)}：${config.serverDomain}/wx/absence?time=${daySign.date}&index=${index}\n`
    }
    str += '\n'
  }
  if (!str) return createJson(json, `暂无签到计划`)
  return createJson(json, `前${config.wx.showLimit}天缺勤人员签到计划为：\n${str}`)
}

/**
 * 修改签到超时时间
 * @param {*} ctx
 * @param {*} json
 * @param {*} openid
 */
function handleChangeSignOverTime (ctx, json, openid) {
  // if (openid !== 'x') return createJson(json, `没有权限修改签到超时时间！`)
  let time = parseFloat(json.Content[0].trim().substring(4).trim())
  if (isNaN(time)) return createJson(json, `修改签到超时时间失败，我拿到的签到超时时间为：${json.Content[0].trim().substring(4).trim()}`)
  global.data.wx.signOverTime = time
  return createJson(json, `签到超时时间修改成功，当前签到超时时间为${fromateSignOverTimeStr(global.data.wx.signOverTime)}`)
}

/**
 * 格式化签到超时时间
 * @param {*} time
 */
function fromateSignOverTimeStr (time) {
  if (time < 1) return `${parseInt(time * 60)}秒`
  const seconds = time % 1
  if (seconds === 0) return `${parseInt(time)}分钟`
  return `${parseInt(time)}分钟${parseInt(time % 1 * 60)}秒`
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
