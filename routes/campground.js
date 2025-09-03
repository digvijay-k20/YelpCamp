const express = require('express')
const router = express.Router()
const campgrounds = require('../controllers/campgrounds')
const catchAsync = require('../utils/CatchAsync')
const ExpressError = require('../utils/ExpressError')
const multer = require('multer')
const { storage } = require('../cloudinary/index')
// const upload = multer({ dest: 'uploads/' }) befor path is upload now it store in cloud
const upload = multer({ storage })

const Campground = require('../models/campground')
const { isLoggedIn, validateCampground, isAuthor } = require('../middlewear') //this is the middlewear

// ✅ Fixed validation function

// GET all campgrounds

//router route reduce code space based on action method
// .post(upload.array('image'), (req, res) => {
//   console.log(req.body, req.files)
//   res.send('It worked')
// })

router.route('/').get(catchAsync(campgrounds.index)).post(
  isLoggedIn,
  upload.array('image'),
  validateCampground,
  catchAsync(campgrounds.createCampground), //controllername+name of file
)

// Form for new campground
router.get('/new', isLoggedIn, campgrounds.renderNewForm) //renderNewForm is name which is used in controllere

// Create new campground

// Show campground
router
  .route('/:id')
  .get(isLoggedIn, catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array('image'),
    validateCampground,
    catchAsync(campgrounds.updateCampground),
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))

// Edit campground form
router.get(
  '/:id/edit',
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm),
)

// Update campground

// Delete campground

module.exports = router
