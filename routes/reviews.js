const express = require('express')
const router = express.Router({ mergeParams: true }) //dont add mergeparams it wont take id
const catchAsync = require('../utils/CatchAsync')
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middlewear')
const Review = require('../models/review')
const Campground = require('../models/campground')
const reviews = require('../controllers/reviews')

router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview))
router.delete(
  '/:reviewId',
  isLoggedIn,
  isReviewAuthor,
  catchAsync(reviews.deleteReview),
)

module.exports = router
