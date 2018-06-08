var mongoose = require('mongoose')
var Schema = mongoose.Schema

var userSchema = new Schema({
  name: String,
  number: String,
  class: String,
  wxOpenId: String,
  sex: {
    type: Number,
    default: 0
  },
  hidden: {
    type: Boolean,
    default: false
  },
  meta: {
    createAt: {
      type: Date,
      dafault: Date.now()
    },
    updateAt: {
      type: Date,
      dafault: Date.now()
    }
  }
})

// Defines a pre hook for the document.
userSchema.pre('save', function (next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }
  next()
})

// 参数User 数据库中的集合名称, 不存在会创建.
const UserSchema = mongoose.model('User', userSchema)

module.exports = UserSchema
