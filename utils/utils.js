/**
 * 时间格式化
 * @param {Date} d 格式化的时间
 * @param {boolean} b 是否精确到秒
 */
exports.formatTime = (d, b) => {
  const _date = d === undefined ? new Date() : new Date(d)
  const year = _date.getFullYear()
  const month = fm(_date.getMonth() + 1)
  const day = fm(_date.getDate())
  if (!b) return year + '-' + month + '-' + day
  return year + '-' + month + '-' + day + ' ' + fm(_date.getHours()) + ':' + fm(_date.getMinutes()) + ':' + fm(_date.getSeconds())
}

function fm (value) {
  if (value < 10) return '0' + value
  return value
}
