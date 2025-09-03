if (process.env.NODE_ENV != 'production') {
  require('dotenv').config()
}
console.log(process.env.SECRET)

const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const Campground = require('./models/campground')
const methodOverride = require('method-override')
const catchAsync = require('./utils/CatchAsync')
const joi = require('joi')
const { campgroundSchema, reviewSchema } = require('./schemas.js')
const ExpressError = require('./utils/ExpressError')
const ejsMate = require('ejs-mate')
const { title } = require('process')
const { Shema } = mongoose.Schema
const Review = require('./models/review')
const session = require('express-session')
const flash = require('connect-flash') //used to dispaly like welocome back message once login
const passport = require('passport')
const LocalStratergy = require('passport-local')
const User = require('./models/users.js')
const mongoSanitize = require('express-mongo-sanitize')
const UserRoute = require('./routes/users.js')
const campground = require('./routes/campground')
const reviews = require('./routes/reviews')
const { default: helmet, contentSecurityPolicy } = require('helmet')

const MongoStore = require('connect-mongo')

// const dbUrl = process.env.DB_URL

dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'

mongodb: mongoose.connect(dbUrl)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.log('Database Connected')
})

app.use(express.static(path.join(__dirname, 'public'))) //use public folder

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true })) //to get req body to parse the data
app.use(methodOverride('_method')) //if it is post we can use for put in the form
app.engine('ejs', ejsMate)

// const validateCampground = (req, res, next) => {
//   const { err } = campgroundSchema.validate(req.body)
//   if (err) {
//     const msg = err.details.map((el) => el.message).join(',')
//     throw new ExpressError(msg, 400)
//   } else {
//     next()
//   }
// }

// const validateReview = (req, res, next) => {
//   const { err } = reviewSchema.validate(req.body)
//   if (err) {
//     const msg = err.details.map((el) => el.message).join(',')
//     throw new ExpressError(msg, 400)
//   } else {
//     next()
//   }
// }

//express session will be here

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: 'tthisisDigvijaylaptop',
  },
})

const sessionConfig = {
  store,
  secret: 'thisisDigvijaylaptop',
  resave: false,

  saveUninitialized: true,
  cookie: {
    name: 'session', //session name default connect.sid
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxage: 1000 * 60 * 60 * 24 * 7,
  },
}
app.use(
  mongoSanitize({
    replaceWith: '_', // still replaces dangerous keys
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized ${key} from request`)
    },
  }),
)
app.use(session(sessionConfig))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

// Allowed external sources
const scriptSrcUrls = [
  'https://stackpath.bootstrapcdn.com/',
  // "https://api.tiles.mapbox.com/",
  // "https://api.mapbox.com/",
  'https://kit.fontawesome.com/',
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net',
  'https://cdn.maptiler.com/', // add this
]
const styleSrcUrls = [
  'https://kit-free.fontawesome.com/',
  'https://stackpath.bootstrapcdn.com/',
  // "https://api.mapbox.com/",
  // "https://api.tiles.mapbox.com/",
  'https://fonts.googleapis.com/',
  'https://use.fontawesome.com/',
  'https://cdn.jsdelivr.net',
  'https://cdn.maptiler.com/', // add this
]
const connectSrcUrls = [
  // "https://api.mapbox.com/",
  // "https://a.tiles.mapbox.com/",
  // "https://b.tiles.mapbox.com/",
  // "https://events.mapbox.com/",
  'https://api.maptiler.com/', // add this
]

// const fontSrcUrls = [
//   'https://fonts.gstatic.com/',
//   'https://use.fontawesome.com/',
//   'https://api.maptiler.com/',
// ]

// Helmet CSP configuration
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        'https://res.cloudinary.com/', // Cloudinary images
        'https://images.unsplash.com/', // Unsplash images
        'https://api.maptiler.com/',
      ],
      // fontSrc: ["'self'", ...fontSrcUrls],
    },
  }),
)

//passport plugin
passport.use(new LocalStratergy(User.authenticate())) //create function used in passport local stratergy
passport.serializeUser(User.serializeUser()) //store it in session
passport.deserializeUser(User.deserializeUser()) //unstore it in session

//middlewear for flash
app.use((req, res, next) => {
  console.log(req.query)
  res.locals.currentUser = req.user
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

app.get('/', (req, res) => {
  res.render('home')
})

app.use('/campgrounds', campground)
app.use('/campgrounds/:id/reviews', reviews) //u can use review
app.use('/', UserRoute)

// app.get('/', (req, res) => {
//   res.render('home')
// })

// app.get('/makeCampground', async (req, res) => {
//   const camp = new Campground({
//     title: 'My backYard',
//     description: 'This is the backYard',
//   })
//   await camp.save()
//   //   res.send(camp)
// })

// app.get(
//   '/campgrounds',

//   catchAsync(async (req, res) => {
//     const campgrounds = await Campground.find({})
//     res.render('campgrounds/index', { campgrounds })
//   }),
// )

// app.get(
//   '/campgrounds/new',
//   catchAsync((req, res) => {
//     res.render('campgrounds/new')
//   }),
// )

// app.post(
//   '/campgrounds',
//   catchAsync(async (req, res) => {
//     const campground = new Campground(req.body.campground)
//     await campground.save()
//     res.redirect(`/campgrounds/${campground._id}`)
//   }),
// )

// app.get(
//   '/campgrounds/:id',
//   catchAsync(async (req, res) => {
//     const { id } = req.params

//     try {
//       const campground = await Campground.findById(id).populate('reviews')
//       if (!campground) {
//         return res.status(404).send('Campground not found')
//       }
//       res.render('campgrounds/show', { campground })
//     } catch (err) {
//       console.error(err)
//       res.status(400).send('Invalid campground ID')
//     }
//   }),
// )

// app.get(
//   '/campgrounds/:id/edit',
//   catchAsync(async (req, res) => {
//     const campground = await Campground.findById(req.params.id)
//     res.render('campgrounds/edit', { campground })
//   }),
// )

// app.put(
//   '/campgrounds/:id',
//   validateCampground,
//   catchAsync(async (req, res) => {
//     const { id } = req.params
//     const campground = await Campground.findByIdAndUpdate(id, {
//       ...req.body.campground,
//     })
//     res.redirect(`/campgrounds/${campground._id}`)
//   }),
// )

// app.delete(
//   '/campgrounds/:id',
//   catchAsync(async (req, res) => {
//     const { id } = req.params
//     await Campground.findByIdAndDelete(id)
//     res.redirect('/campgrounds')
//   }),
// )

// app.post(
//   '/campgrounds/:id/reviews',
//   validateReview,
//   catchAsync(async (req, res) => {
//     const campground = await Campground.findById(req.params.id)
//     const review = new Review(req.body.review)
//     campground.reviews.push(review)
//     await review.save()
//     await campground.save()
//     res.redirect(`/campgrounds/${campground._id}`)
//   }),
// )

// app.delete(
//   '/campgrounds/:id/reviews/:reviewId',
//   catchAsync(async (req, res) => {
//     const { id, reviewId } = req.params
//     await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
//     await Review.findByIdAndDelete(reviewId)
//     res.redirect(`/campgrounds/${id}`)
//   }),
// )

app.get('/fakeUser', async (req, res) => {
  const user = await new User({ email: 'digvijay@gmail.com', username: 'Dk' })
  const newUser = await User.register(user, 'hello')
  res.send(newUser)
})

app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError('Page Not Find', 404))
})

app.use((err, req, res, next) => {
  const { message = 'Sorry!!', status = 500 } = err
  res.status(status).send(message)
})

app.listen(3000, () => {
  console.log('Listening on port 3000!!!')
})
