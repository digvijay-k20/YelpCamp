if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

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
const helmet = require('helmet')
const MongoStore = require('connect-mongo')

const Campground = require('./models/campground')
const Review = require('./models/review')
const User = require('./models/users')

const ExpressError = require('./utils/ExpressError')
const campgroundRoutes = require('./routes/campground')
const reviewRoutes = require('./routes/reviews')
const userRoutes = require('./routes/users')

// ------------------- DATABASE CONNECTION -------------------
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log('Database Connected')
  })
  .catch((err) => {
    console.error('Database connection error:', err)
  })

// ------------------- MIDDLEWARE SETUP -------------------
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(mongoSanitize())

// ------------------- SESSION SETUP -------------------
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: process.env.SECRET || 'fallbackSecret',
  },
})

const sessionConfig = {
  store,
  secret: process.env.SECRET || 'fallbackSecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    name: 'session',
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}

app.use(session(sessionConfig))
app.use(flash())

// ------------------- HELMET CSP -------------------
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

// ------------------- PASSPORT AUTH -------------------
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// ------------------- FLASH MIDDLEWARE -------------------
app.use((req, res, next) => {
  res.locals.currentUser = req.user
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

// ------------------- ROUTES -------------------
app.get('/', (req, res) => {
  res.render('home')
})

app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)
app.use('/', userRoutes)

app.get('/fakeUser', async (req, res) => {
  const user = new User({ email: 'digvijay@gmail.com', username: 'Dk' })
  const newUser = await User.register(user, 'hello')
  res.send(newUser)
})

// ------------------- ERROR HANDLING (FIXED) -------------------
app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
  // Check if headers have already been sent to prevent multiple responses
  if (res.headersSent) {
    return next(err)
  }

  const { status = 500 } = err
  const message = err.message || 'Oh No, Something Went Wrong!'

  // Set the status and render the error template
  res.status(status).render('error', {
    error: {
      messages: message,
      status: status,
    },
    err: err, // Pass the full error object for stack trace
    isProduction: process.env.NODE_ENV === 'production',
  })
})

// ------------------- SERVER START -------------------
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Serving on port ${port}`)
})
