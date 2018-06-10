const mongoose = require('mongoose')
const SignSchema = mongoose.model('Sign')
const utils = require('../utils/utils')
/**
 * 获取今天的签到计划
 */
exports.getTodaySign = async () => {
  const today = utils.formatTime()
  const result = await SignSchema.findOne({ date: today }).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return result
}

/**
 * 获取今天的签到计划
 */
exports.createTodaySign = async () => {
  const today = utils.formatTime()
  const result = await new SignSchema({
    date: today,
    signPlanInfo: [],
    signPlans: []
  }).save().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return result
}

/**
 * 创建签到计划
 * @param {*} code 签到码
 * @param {*} time 签到计划日期
 */
exports.createSign = async (todaySign, {createTime, TTL, overTime, code}) => {
  todaySign.signPlanInfo.push({createTime, TTL, overTime, code})
  todaySign.signPlans.push({users: [], hidden: false})
  const result = await todaySign.save().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return result
}

/**
 * 覆盖签到计划
 * @param {*} targetSign 要覆盖的签到计划
 * @param {*} code 签到码
 */
exports.reCreateSign = async (todaySign, targetIndex, {createTime, TTL, overTime, code}) => {
  todaySign.signPlanInfo[targetIndex] = {createTime, TTL, overTime, code}
  todaySign.signPlans[targetIndex].users = []
  const result = await todaySign.save().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return result
}

/**
 * 签到
 */
exports.sign = async (schema, targetIndex, userInfo) => {
  schema.signPlans[targetIndex].users.push({
    name: userInfo.name,
    number: userInfo.number,
    wxOpenId: userInfo.wxOpenId,
    date: new Date()
  })
  const result = await schema.save().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return result
}

/**
 * 获取所有签到计划
 */
exports.getLimitSign = async (limit) => {
  const result = await SignSchema.find({}).limit(limit).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return result
}

/**
 * 获取某天签到计划
 */
exports.getSign = async (time = utils.formatTime()) => {
  const result = await SignSchema.findOne({date: time}).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return result
}
