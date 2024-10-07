const DHT11 = require( 'node-dht-sensor' );
const AHT20 = require( "aht20" );
const request = require( "request" );
const cheerio = require( "cheerio" );


//assign data to the passed by reference object
module.exports = {
    setData
};

let sensor;
let type;

function setData( weatherData, { useSensor, fetchOnlineData, sensorType } ) {
   if ( useSensor ) {
        type = sensorType;
        if ( sensorType === "AHT20" ) {
            sensor = new AHT20( 1 );
            console.log("set up");
        } else if ( sensorType === "DHT11" ) {
            // Setup sensor, warn if failed
            const sensorType = 11; // 11 for DHT11, 22 for DHT22 and AM2302
            const sensorPin = 4;  // The GPIO pin number for sensor signal
            if ( !DHT11.initialize( sensorType, sensorPin ) ) {
                console.warn( 'Failed to initialize sensor' );
            }
            sensor = DHT11;
        }
        weatherData.indoor = {
            temperature: "",
            humidity: ""
        }
        setInterval( () => getIndoorData( weatherData ), 2000 );
    }
    if ( fetchOnlineData ) {
        getOutdoorData( weatherData );
        setInterval( () => getOutdoorData( weatherData ), 30000 );
    }
}

async function getIndoorData( weatherData ) {
    switch ( type ) {
        case "AHT20":
            weatherData.indoor = await sensor.readData() ?? {};
            break;
        case "DHT11":
            weatherData.indoor = sensor.read();
            break;
    }
}

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