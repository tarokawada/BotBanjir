const rp = require('request-promise')

const checkweather = (long, lat, time, location) => {
  return Promise.all([
    darkSky(long, lat, time, location),
  ]).then(result => {
    return { type:'text', content: formatString(result[0])}  //remember to settle this shit
  })
}

const darkSky = (long, lat, time, location) => {
  var options = {
    uri: 'https://api.darksky.net/forecast/a8051f71ff5cd24176a83bcb3fb692f1/'+lat+','+long+','+time+'?units=auto',
    // qs: {
    //     units: 'auto' // -> uri + '?access_token=xxxxx%20xxxxx'
    // }
    //json: true
  }

  return rp(options).then(result => {
    const body = JSON.parse(result)

    return {
      summary: body.currently.summary,
      temperature: body.currently.temperature,
      locationFormat: location,
    }
    
  })

}

const formatString = (result) => {
  
  const place = result

  const reply = `The weather in ${place.locationFormat} is ${place.summary} with the temperature of ${place.temperature}°C`

  return reply
}

module.exports = checkweather;