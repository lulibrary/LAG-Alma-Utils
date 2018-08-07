module.exports = {
  type: Number,
  default: () => Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60
}
