const rp = require('request-promise')

const checkPlaces = (lat, long) => {
  return Promise.all([
    places(lat, long),
  ]).then(result => {
    return { type:'carousel', content: formatString(result[0])}
  })
}

const places = (lat, long) => {
  var options = {
    uri: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${long}&radius=1000000&type=train_station&key=AIzaSyAKJKT1KJYghbgGt5qJ37xOLJ0ymtUDGV0`
,
  }

  return rp(options).then(result => {
    const body = JSON.parse(result)

    return {
      place1_name: body.results[0].name,
      place1_pic: body.results[0].photos[0].photo_reference,
      place1_url: `https://www.google.com/maps/place/?q=place_id:${body.results[0].place_id}`,
      place2_name: body.results[1].name,
      place2_pic: body.results[1].photos[0].photo_reference,
      place2_url: `https://www.google.com/maps/place/?q=place_id:${body.results[1].place_id}`,
      place3_name: body.results[2].name,
      place3_pic: body.results[2].photos[0].photo_reference,
      place3_url: `https://www.google.com/maps/place/?q=place_id:${body.results[2].place_id}`,
    }
    
  })

}

const formatString = (result) => {
    

  // const card = `${arr1.place1_name} is located in ${arr1.place1_lat},${arr1.place1_lat}.` 


    const card = [
              {
                  title: result.place1_name,
                  imageUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.place1_pic}&key=AIzaSyAKJKT1KJYghbgGt5qJ37xOLJ0ymtUDGV0`,
                  buttons: [
                    {
                      title: 'Direction',
                      value: result.place1_url,
                      type: 'web_url', 
                    }  
                  ]
                },
                {
                  title: result.place2_name,
                  imageUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.place2_pic}&key=AIzaSyAKJKT1KJYghbgGt5qJ37xOLJ0ymtUDGV0`,
                  buttons: [
                    {
                      title: 'Directions',
                      value: result.place2_url,
                      type: 'web_url', 
                    }  
                  ]
                },
                {
                  title: result.place3_name,
                  imageUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.place3_pic}&key=AIzaSyAKJKT1KJYghbgGt5qJ37xOLJ0ymtUDGV0`,
                  buttons: [
                    {
                      title: 'Directions',
                      value: result.place3_url,
                      type: 'web_url', 
                    }  
                  ]
                }

    ]
            

      
  

  return card
}

module.exports = checkPlaces