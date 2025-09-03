const { campgroundSchema, reviewSchema } = require('./schemas.js')
const ExpressError = require('./utils/ExpressError.js')
const Campground = require('./models/campground')
const Review = require('./models/review')

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // <-- fixed by calling as a function
    req.session.returnTo = req.originalUrl // store the original URL to redirect after login
    req.flash('error', 'You must be signed in first!')
    return res.redirect('/login')
  }
  next()
}

module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body)
  if (error) {
    const msg = error.details.map((el) => el.message).join(',')
    throw new ExpressError(msg, 400)
  } else {
    next()
  }
}

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params
  const campground = await Campground.findById(id) // Fetch campground first

  if (!campground) {
    req.flash('error', 'Campground not found!')
    return res.redirect('/campgrounds')
  }

  if (!campground.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!')
    return res.redirect(`/campgrounds/${id}`)
  }

  next()
}

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params
  const review = await Review.findById(reviewId) // Fetch campground first

  if (!review.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!')
    return res.redirect(`/campgrounds/${id}`)
  }

  next()
}

module.exports.validateReview = (req, res, next) => {
  const { err } = reviewSchema.validate(req.body)
  if (err) {
    const msg = err.details.map((el) => el.message).join(',')
    throw new ExpressError(msg, 400)
  } else {
    next()
  }
}
