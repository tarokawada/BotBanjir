/*
 * message.js
 * This file contains your bot code
 */

const recastai = require('recastai')
const schedule = require('node-schedule')
const mongoose = require('mongoose')
const checkweather = require('./checkweather')
const twilio = require('twilio')
const User = require('./users')
const checkPlaces = require('./googlePlaces')


const accountSid = 'ID'
var authToken = 'AUTH'

mongoose.connect('YOUR OWN DB'); 


var database = mongoose.connection
database.on('error', console.error.bind(console, 'connection error:'))
database.once('open', function() {
  // we're connected!
  console.log('We are connected to database!')
})
var client = new twilio(accountSid, authToken);
var connect = new recastai.connect(process.env.REQUEST_TOKEN, process.env.LANGUAGE)

const scheduling = schedule.scheduleJob('30 * * * * *', function(){
  console.log('Scheduler')
  const messages = [
  {
    type: 'quickReplies',
    content: {
      title: 'There seem to be some issues happening in your area. Do you need any assistance?',
      buttons: [
        {
          title: 'Safe Locations',
          value: 'Safe Locations',
        },
        {
          title: 'Useful Contacts',
          value: 'give me some useful contacts',
        },
        {
          title: 'Send SOS',
          value: 'send SOS',
        },
      ]
    }
  }
]

User.find({'disasterSub': true}, function(err, user){
  console.log(user)
  for (var i = 0; i < 2; i++){
    connect.sendMessage(messages, user[i].conId)
  .then(function(){
    console.log('Message successfully sent')
  })
  .catch(function() {
    console.log('An error occured while sending message')
  })
  }
  
})
})

// This function is the core of the bot behaviour
const replyMessage = (message) => {
  // Instantiate Recast.AI SDK, just for request service
  const request = new recastai.request(process.env.REQUEST_TOKEN, process.env.LANGUAGE)
  // Get text from message received
  const text = message.content

  console.log('I receive: ', text)

  // Get senderId to catch unique conversation_token
  const senderId = message.senderId
  const conversationId = message.conversationId

  console.log(conversationId)

  
  // Call Recast.AI SDK, through /converse route
  return request.converseText(text, { conversationToken: senderId })
  .then(result => {
    //mongo: look for senderId in the database, if exist already then do nothing. If not there, then add a new user.
    User.count({'id': senderId}, function (err, count){ 
    if(count>0){
        //document exists });
    } else {
      console.log('user is not in db. Creating new user~~~~~')

      var newUser = User({
        id: senderId,
        conId: conversationId,
        weatherSub : false,   //starts with no subscriptions
        disasterSub: false
      })

      newUser.save(function(err) {
        if (err) throw err
        console.log('User created!')
      })
    }
    })


    if (result.action) {
      console.log('The conversation action is: ', result.action.slug)
    }

    // If there is not any message return by Recast.AI for this current conversation
    if (!result.replies.length) {
      if (result.action && result.action.slug === 'get-help-1'){
        message.addReply(
          {
            type: 'quickReplies',
            content: {
              title: 'Hey. These are what I can do. Try it out!',
              buttons: [
                {
                  title: 'Subscriptions',
                  value: 'setup',
                },
                {
                  title: 'The weather now',
                  value: 'What is the weather in Kuala Lumpur now?',
                },
              ]
            }
          }
        )

      }
      else if (message.content == 'reset'){
          result.resetConversation()
          console.log('Reset conversation')
        }
      else {
        { message.addReply({ type: 'text', content: 'I don\'t have the reply to this yet :)' }) }
      }
    } else {
      // Add each reply received from API to replies stack
      result.replies.forEach(replyContent => message.addReply({ type: 'text', content: replyContent }))
    }

    // Send all replies
    message.reply()
    .then(() => {
      // Do some code after sending messages 

      //message.content === 'Send me location of safe places near me.' && result.action === 'null' && 
         if (result.action && result.action.slug === 'safe-location'){ 
            
           User.findOne({'id': senderId}, function(err, user){
             var lat = user.disasterLat
             var long = user.disasterLong
             console.log('Checking for nearby safe places in ' + lat + ' , ' + long + '.')

             return checkPlaces(lat, long)
             .then(res => {
               message.addReply(res)
               message.addReply(
                {
                  type: 'quickReplies',
                  content: {
                    title: 'Do you need further assistance?',
                    buttons: [
                      {
                        title: 'Message Emergency Contact',
                        value: 'send emergency sms',
                      },
                      {
                        title: 'Useful Contacts',
                        value: 'give me some useful contacts',
                      },
                    ]
                  }
                }
              )
               return message.reply()
             }).catch(function () {
              console.log("Promise Rejected");
          })

           })
        }
        
        if (result.action && result.action.slug === 'sos' && result.action.done){
          User.findOne({'id': senderId}, function(err, user){
            client.messages.create({
              body: `This is a SOS from ${user.name}. Please try to contact them ASAP.`,
              to: user.emergencyNumber,  // Text this number
              from: '+12407135641' // From a valid Twilio number
          })
          .then((message) => console.log(message.sid));
          })
        }

        if (result.action && result.action.slug === 'greetings' && result.action.done){
          //save name into db
          var nama = result.getMemory('nama')
          User.findOne({'id': senderId}, function(err, user) {
          if (err) throw err
          console.log(nama.raw)
          user.name = nama.raw
          user.save()
          console.log(user)
        })
        }

      //Subscription
      if (result.action && result.action.slug === 'want-setup' && !result.action.done) {  
        message.addReply(
          {
            type: 'quickReplies',
            content: {
              title: 'Subscriptions:',
              buttons: [
                {
                  title: 'Scheduled Weather Report',
                  value: 'Weather Subscription',
                },
                {
                  title: 'Disaster Alerts',
                  value: 'disaster alerts',
                },
              ]
            }
          }

        )
        return message.reply()
      }

      // if (result.action && result.action.slug === 'want-setup' && result.action.done){
      //   result.resetMemory(selection)
      // }
      //UPDATE DATABASE FOR DISASTER
      if (result.action && result.action.slug === 'disaster-subscription' && result.action.done) {
        
        var disasterLocation = result.getMemory('disaster-location')
        var emergencyPhoneNumber = result.getMemory('emergency-number')
        
        User.findOne({'id': senderId}, function(err, user) {
          if (err) throw err

          user.disasterSub = true
          user.disasterLocation = disasterLocation.formatted
          user.emergencyNumber = emergencyPhoneNumber.raw
          user.disasterLat = disasterLocation.lat
          user.disasterLong = disasterLocation.lng
          // object of the user
          user.save()
          console.log(user)

        })
          
          result.resetConversation()
      }

      //UPDATE DATABASE FOR WEATHER SUB
      if (result.action && result.action.slug === 'weather-subscription' && result.action.done) {
        var weatherSubLocation = result.getMemory('subscription-location')

        User.findOne({'id': senderId}, function(err, user) {
          if (err) throw err

          user.weatherSub = true
          user.weatherLocation = weatherSubLocation.formatted
          user.weatherLat = weatherSubLocation.lat
          user.weatherLong = weatherSubLocation.lng

          user.save()
          console.log(user)
        })
        result.resetConversation()
      }

      //Weather api
      if (result.action && result.action.slug === 'get-weather' && result.action.done) {
        var weatherLocation = result.getMemory('weather-location')
        var weatherTime = result.getMemory('weather-time')
        return checkweather(weatherLocation.lng, weatherLocation.lat, weatherTime.iso, weatherLocation.formatted )
          .then(res => {
            message.addReply(res)
            return message.reply()
          })
      }


    })
    .catch(err => {
      console.error('Error while sending message to channel', err)
    })
  })
  .catch(err => {
    console.error('Error while sending message to Recast.AI', err)
  })
}

module.exports = replyMessage
