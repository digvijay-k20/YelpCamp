if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
console.log(process.env.SECRET)

const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const mongoSanitize = require('express-mongo-sanitize')
const MongoStore = require('connect-mongo')
const helmet = require('helmet')

const Campground = require('./models/campground')
const Review = require('./models/review')
const User = require('./models/users')
const catchAsync = require('./utils/CatchAsync')
const ExpressError = require('./utils/ExpressError')
const { campgroundSchema, reviewSchema } = require('./schemas.js')

const campgroundRoutes = require('./routes/campground')
const reviewRoutes = require('./routes/reviews')
const userRoutes = require('./routes/users')

// MongoDB connection
// 'mongodb://localhost:27017/yelp-camp'
const dbUrl = process.env.DB_URL

mongoose
  .connect(dbUrl)
  .then(() => console.log('Database Connected'))
  .catch((err) => console.error('Mongo Connection Error:', err))

const db = mongoose.connection

// Middleware & setup
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(mongoSanitize({ replaceWith: '_' }))

// Session store setup
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: process.env.SECRET || 'thisisfallback',
  },
})

const sessionConfig = {
  store,
  secret: process.env.SECRET || 'thisisfallback',
  resave: false,
  saveUninitialized: true,
  cookie: {
    name: 'session',
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}

app.use(session(sessionConfig))
app.use(flash())

// Helmet CSP
const scriptSrcUrls = [
  'https://stackpath.bootstrapcdn.com/',
  'https://kit.fontawesome.com/',
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net',
  'https://cdn.maptiler.com/',
]
const styleSrcUrls = [
  'https://kit-free.fontawesome.com/',
  'https://stackpath.bootstrapcdn.com/',
  'https://fonts.googleapis.com/',
  'https://use.fontawesome.com/',
  'https://cdn.jsdelivr.net',
  'https://cdn.maptiler.com/',
]
const connectSrcUrls = ['https://api.maptiler.com/']

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
        'https://res.cloudinary.com/',
        'https://images.unsplash.com/',
        'https://api.maptiler.com/',
      ],
    },
  }),
)

// Passport setup
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// Flash and currentUser for all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

// Routes
app.get('/', (req, res) => {
  res.render('home')
})

app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)
app.use('/', userRoutes)

// Fake user route for testing
app.get('/fakeUser', async (req, res) => {
  const user = new User({ email: 'digvijay@gmail.com', username: 'Dk' })
  const newUser = await User.register(user, 'hello')
  res.send(newUser)
})

// 404 handler
app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404))
})

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err) // prevent double response
  }
  const { status = 500 } = err
  if (!err.message) err.message = 'Something went wrong'
  res.status(status).render('error', { err })
})

// Start server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Serving on port ${port}`)
})
