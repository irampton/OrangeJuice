const DHT11 = require( 'node-dht-sensor' );
const AHT20 = require( "aht20" );
const { fetchWeatherApi } = require( "openmeteo" );


//assign data to the passed by reference object
module.exports = {
	setData
};

let sensor;
let type;

function setData( weatherData, { useSensor, fetchOnlineData, sensorType, userData } ) {
	if( useSensor ) {
		type = sensorType;
		if( sensorType === "AHT20" ) {
			sensor = new AHT20( 1 );
			console.log( "set up" );
		} else if( sensorType === "DHT11" ) {
			// Setup sensor, warn if failed
			const sensorType = 11; // 11 for DHT11, 22 for DHT22 and AM2302
			const sensorPin = 4;  // The GPIO pin number for sensor signal
			if( !DHT11.initialize( sensorType, sensorPin ) ) {
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
	if( fetchOnlineData ) {
		const weatherLocation = userData?.weather || {};
		getOutdoorData( weatherData, weatherLocation );
		setInterval( () => getOutdoorData( weatherData, weatherLocation ), 30000 );
	}
}

async function getIndoorData( weatherData ) {
	switch( type ) {
		case "AHT20":
			weatherData.indoor = await sensor.readData() ?? {};
			break;
		case "DHT11":
			weatherData.indoor = sensor.read();
			break;
	}
}

async function getOutdoorData( weatherData, weatherLocation ) {
	const latitude = Number( weatherLocation?.latitude );
	const longitude = Number( weatherLocation?.longitude );
	if( !Number.isFinite( latitude ) || !Number.isFinite( longitude ) ) {
		console.warn( "Missing or invalid weather location data (latitude/longitude)." );
		return;
	}
	try {
		const params = {
			latitude: [latitude],
			longitude: [longitude],
			current: "temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,shortwave_radiation"
		};
		const url = "https://api.open-meteo.com/v1/forecast";
		const responses = await fetchWeatherApi( url, params );
		const response = responses[0];
		const current = response?.current();
		if( !current ) {
			console.warn( "Open-Meteo returned no current weather data." );
			return;
		}
		// Keep index order in sync with params.current
		const temp = current.variables( 0 )?.value();
		const humidity = current.variables( 1 )?.value();
		const dewpoint = current.variables( 2 )?.value();
		const apparent = current.variables( 3 )?.value();
		const pressure = current.variables( 4 )?.value();
		const windSpeed = current.variables( 5 )?.value();
		const windDirection = current.variables( 6 )?.value();
		const windGusts = current.variables( 7 )?.value();
		const solar = current.variables( 8 )?.value();

		weatherData.outdoor = {
			tempText: temp != null ? `${temp.toFixed( 1 )} C` : "",
			temp: temp != null ? Math.round( temp ) : "",
			tempRising: false,
			humidityText: humidity != null ? `${Math.round( humidity )}%` : "",
			humidity: humidity != null ? Math.round( humidity ) : "",
			humidityRising: false,
			dewpointText: dewpoint != null ? `${dewpoint.toFixed( 1 )} C` : "",
			dewpoint: dewpoint != null ? Math.round( dewpoint ) : "",
			pressureText: pressure != null ? `${pressure.toFixed( 1 )} hPa` : "",
			pressure: pressure != null ? Number( pressure.toFixed( 1 ) ) : "",
			windText: windSpeed != null ? `${windSpeed.toFixed( 1 )} km/h` : "",
			windSpeed: windSpeed != null ? Math.round( windSpeed ) : "",
			windDirectionCardinal: windDirection != null ? degreesToCardinal( windDirection ) : "",
			WindDirectionDegrees: windDirection != null ? Math.round( windDirection ) : "",
			solarText: solar != null ? `${solar.toFixed( 1 )} W/m2` : "",
			solar: solar != null ? Number( solar.toFixed( 1 ) ) : "",
			windChillText: apparent != null ? `${apparent.toFixed( 1 )} C` : "",
			windChill: apparent != null ? Math.round( apparent ) : "",
			heatIndexText: apparent != null ? `${apparent.toFixed( 1 )} C` : "",
			heatIndex: apparent != null ? Math.round( apparent ) : "",
			windGustText: windGusts != null ? `${windGusts.toFixed( 1 )} km/h` : "",
			windGust: windGusts != null ? Math.round( windGusts ) : ""
		};
	} catch( error ) {
		console.warn( "Failed to fetch weather data:", error?.message || error );
	}
}

function degreesToCardinal( degrees ) {
	const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
	const normalized = ( degrees % 360 + 360 ) % 360;
	const index = Math.round( normalized / 45 ) % 8;
	return directions[index];
}
