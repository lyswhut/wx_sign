var mongoose = require('mongoose')
var Schema = mongoose.Schema

var signSchema = new Schema({
  date: String,
  code: String,
  users: [{
    name: String,
    number: String,
    wxOpenId: String,
    date: { type: Date, default: Date.now }
  }],
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
signSchema.pre('save', function (next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }
  next()
})

// 参数User 数据库中的集合名称, 不存在会创建.
const SignSchema = mongoose.model('Sign', signSchema)

module.exports = SignSchema
