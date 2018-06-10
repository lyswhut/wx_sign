const mongoose = require('mongoose')
const UserSchema = mongoose.model('User')

/**
 * 检查是否绑定
 * @param {*} 微信openid
 */
exports.checkBind = async (wxOpenId) => {
  const restlt = await UserSchema.findOne({ wxOpenId: wxOpenId }).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return err
  })
  return restlt
}

/**
 * 检查用户是否存在
 * @param {*} 学号
 */
exports.checkUser = async (number) => {
  const restlt = await UserSchema.findOne({ number: number }).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log('checkUser', err)
    return err
  })
  return restlt
}

/**
 * 绑定
 * @param {*} wxOpenId
 */
exports.bindUser = async ({user, wxOpenId}) => {
  user.wxOpenId = wxOpenId
  const result = await user.save().then((result) => {
    return result
  }).catch((err) => {
    console.log('bindUser err', err)
    return err
  })
  console.log('bindUser', result)
  return result
}

/**
 * 解除绑定
 * @param {*} targetUser 目标用户模型
 * @param {*} wxOpenId 解绑的微信openid
 */
exports.unbindUser = async (targetUser, wxOpenId) => {
  targetUser.wxOpenId = null
  const result = await targetUser.save().then((result) => {
    return result
  }).catch((err) => {
    console.log('bindUser err', err)
    return err
  })
  console.log('bindUser', result)
  return result
}

/**
 * 根据微信openid获取用户信息
 * @param {*} wxOpenId
 */
exports.getUserInfo = async (wxOpenId) => {
  const restlt = await UserSchema.findOne({ wxOpenId: wxOpenId }).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return err
  })
  return restlt
}

/**
 * 获取所有用户
 */
exports.getAllUser = async () => {
  const restlt = await UserSchema.find({}).exec().then((result) => {
    return result
  }).catch((err) => {
    console.log(err)
    return err
  })
  return restlt
}
