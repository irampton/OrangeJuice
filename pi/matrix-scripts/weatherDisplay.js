const moment = require( 'moment' ); // require

let counter = 0;

module.exports = {
    'name': "Weather Display",
    'id': "weatherDisplay",
    'timeout': 1000,
    'generate': ( strip, setLEDs, { weatherData } ) => {
        const cycleTime = 4;
        let displayString, colorArr;
        switch ( Math.floor( counter / cycleTime ) ) {
            case 0:
                displayString = `TEMP^${weatherData.outdoor?.temp}${cToF( weatherData.indoor?.temperature )}`;
                colorArr = ["000077", "000077", "000077", "000077", "", "007700", "0077000", "777700", "777700"];
                break;
            case 1:
                displayString = `HUMD^${weatherData.outdoor?.humidity}${weatherData.indoor?.humidity}`;
                colorArr = ["000077", "000077", "000077", "000077", "", "007700", "0077000", "777700", "777700"];
                break;
            case 2:
                displayString = `WND^${weatherData.outdoor?.windSpeed}${getWindDirection( weatherData.outdoor?.windDirectionCardinal )}`;
                colorArr = ["000077", "000077", "000077", "", ...[...Array(weatherData.outdoor?.windSpeed.toString().length)].map(e=>e="ff7700"), "007700", "007700", "007700", "007700", "007700"];
                break;
            default:
                displayString = "ERROR";
                colorArr = ["ff0000", "ff0000", "ff0000", "ff0000", "ff0000"];
        }
        let options = {
            "trigger": 'matrix',
            "pattern": 'matrix-display-temp',
            "patternOptions": { "temp": displayString, "color": colorArr, "hideFirstSpace": true, leftAlign: true },
            "effect": "",
            "strips": [strip]
        }
        setLEDs( options );

        if ( counter + 1 === cycleTime * 3 ) { //number of cases
            counter = 0;
        } else {
            counter++;
        }
    }
}

function cToF( temp ) {
    return Math.round( temp * 1.8 + 32 )
}

function getWindDirection( dir ) {
    let str = "";
    for ( let i = 0; i <= 3 - dir; i++ ) {
        str += "  ";
    }
    str += dir;
    return str;
}
