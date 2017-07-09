var mongoose = require('mongoose')
var Schema = mongoose.Schema

var userSchema = new Schema({
    id: { type: String , required: true, unique: true},
    conId: { type: String, required: true, unique: true },
    name: String,
    disasterLocation: String,
    disasterLat: Number,
    disasterLong: Number,
    weatherLocation: String,
    weatherLat: Number,
    weatherLong: Number,
    emergencyNumber: String,
    weatherSub: { type: Boolean, default: false },
    disasterSub: { type: Boolean, default: false }
})

var User = mongoose.model('User', userSchema)

module.exports = User;