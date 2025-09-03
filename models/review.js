const { number, string } = require('joi')
const { default: mongoose } = require('mongoose')
const moongoose = require('mongoose')
const Schema = mongoose.Schema

const reviewSchema = new Schema({
  body: String,
  rating: Number,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
})

module.exports = mongoose.model('Review', reviewSchema)
