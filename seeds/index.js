const mongoose = require('mongoose')
const Campground = require('../models/campground')
const cities = require('./cities')
const { places, descriptors } = require('./seedHelpers')
mongoose.connect('mongodb://localhost:27017/yelp-camp')

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.log('Database Connected')
})

const sample = (array) => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
  await Campground.deleteMany({})
  for (let i = 0; i < 1000; i++) {
    const random1000 = Math.floor(Math.random() * 1000)
    const price = Math.floor(Math.random() * 20) + 10
    const camp = new Campground({
      author: '68a33492459e48d92dc9b934',
      location: `${cities[random1000].city},${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      geometry: {
        type: 'Point',
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url:
            'https://res.cloudinary.com/dvyhy94a6/image/upload/v1756372190/YelpCamp/b9gtqbooy00ig56iclh8.jpg',
          filename: 'YelpCamp/b9gtqbooy00ig56iclh8',
        },
      ],
      description:
        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Officia reprehenderit perferendis quibusdam mollitia maxime, dignissimos aliquid ullam nisi fuga fugiat molestiae velit laborum iste natus ut ad voluptatem id voluptates',
      price: price,
    })
    await camp.save()
  }
}

seedDB().then(() => {
  mongoose.connection.close()
})
