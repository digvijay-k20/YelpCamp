const User = require('../models/users')

module.exports.renderRegister = (req, res) => {
  res.render('users/register')
}

module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body
    const user = new User({ email, username })
    const registerUser = await User.register(user, password)

    //once user is registered he is logged in
    req.login(registerUser, (err) => {
      if (err) return next(err)
      req.flash('success', 'Welcome to Website')
      res.redirect('/campgrounds')
    })
  } catch (e) {
    req.flash('error', e.message)
    res.redirect('register')
  }
}

module.exports.renderLogin = async (req, res) => {
  res.render('users/login')
}

module.exports.login = async (req, res) => {
  req.flash('success', 'Welcome!!')
  const redirectUrl = req.session.returnTo || '/campgrounds'
  delete req.session.returnTo
  res.redirect(redirectUrl)
}

module.exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err)
    }
    req.flash('success', 'Goodbye!')
    res.redirect('/campgrounds')
  })
}
