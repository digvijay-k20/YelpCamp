class ExpressError extends Error {
  constructor(message, status) {
    super() //contain error default
    this.message = message
    this.status = status
  }
}

module.exports = ExpressError
