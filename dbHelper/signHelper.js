const mongoose = require('mongoose')
const SignSchema = mongoose.model('Sign')
const utils = require('../utils/utils')
/**
 * 检查是否创建签到
 */
exports.checkCreateSign = async () => {
  const today = utils.formatTime()
  const restlt = await SignSchema.findOne({ date: today }).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return restlt
}

/**
 * 创建签到计划
 * @param {*} code 签到码
 * @param {*} time 签到计划日期
 */
exports.createSign = async (code, time = utils.formatTime()) => {
  const restlt = await new SignSchema({
    date: time,
    code: code
  }).save().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return restlt
}

exports.reCreateSign = async (targetSign, code) => {
  targetSign.code = code
  targetSign.users = []
  const restlt = await targetSign.save().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return restlt
}

/**
 * 签到
 */
exports.sign = async (schema, userInfo) => {
  schema.users.push({
    name: userInfo.name,
    number: userInfo.number,
    wxOpenId: userInfo.wxOpenId,
    date: new Date()
  })
  const restlt = await schema.save().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return restlt
}

/**
 * 获取所有签到计划
 */
exports.getAllSign = async () => {
  const restlt = await SignSchema.find({}).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return restlt
}

/**
 * 获取签到计划
 */
exports.getSign = async (time = utils.formatTime()) => {
  const restlt = await SignSchema.findOne({date: time}).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return null
  })
  return restlt
}
