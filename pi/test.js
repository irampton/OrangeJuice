const request = require( "request" );
const cheerio = require( "cheerio" );
let weatherData = {
    "indoor": {},
    "outdoor": {}
};

function getOutdoorData( weatherData ) {
    let url = "https://marvin.byu.edu/Weather/cgi-bin/textbritish";
    request( url, function ( error, response, body ) {
        //console.log('body:', body);
        const $ = cheerio.load( body );
        let path = $( 'td' );
        weatherData.outdoor = {
            tempText: path[3].children[0].data,
            temp: Number( path[3].children[0].data.match( /\d+/g )[0] ),
            tempRising: path[4].children[0].data.includes( "rising" ),
            humidityText: path[6].children[0].data,
            humidity: Number( path[6].children[0].data.match( /\d+/g )[0] ),
            humidityRising: path[7].children[0].data.includes( "rising" ),
            dewpointText: path[9].children[0].data,
            dewpoint: Number( path[9].children[0].data.match( /\d+/g )[0] ),
            pressureText: path[12].children[0].data,
            pressure: Number( path[12].children[0].data.match( /[\d.]+/g )[0] ),
            windText: path[17].children[0].data,
            windSpeed: Number( path[17].children[0].data.match( /\d+/g )[0] ),
            windDirectionCardinal: path[17].children[0].data.match( /[NSEW]+/g )[0],
            WindDirectionDegrees: Number( path[17].children[0].data.match( /\d+/g )[1] ),
            solarText: path[19].children[0].data,
            solar: Number( path[19].children[0].data.match( /[\d.]+/g )[0] ),
            windChillText: path[26].children[0].data,
            windChill: Number( path[26].children[0].data.match( /\d+/g )[0] ),
            heatIndexText: path[28].children[0].data,
            heatIndex: Number( path[28].children[0].data.match( /\d+/g )[0] )
        }
    } );
}

getOutdoorData( weatherData );
setTimeout( () => {
    console.log( weatherData.outdoor );
}, 1000 );