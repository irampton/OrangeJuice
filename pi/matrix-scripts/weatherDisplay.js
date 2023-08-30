const moment = require( 'moment' ); // require

let counter = 0;

module.exports = {
    'name': "Temperature Clock",
    'id': "temperatureClock",
    'timeout': 1000,
    'generate': ( strip, setLEDs, { weatherData } ) => {
        let displayString = `${cToF( weatherData.indoor?.temperature )}  ${moment().format( "HH:mm" )} `;
        let colorArr = ["007700", "007700", "", "", "ff7000", "ff7000", "000077", "ff7000", "ff7000", ""];
        if ( counter > 5 ) {
            colorArr[0] = colorArr[1] = "999900";
            displayString = `${weatherData.outdoor?.temp}  ${moment().format( "HH:mm" )} `;
            if ( counter > 10 ) {
                counter = 0;
            }
        }
        let options = {
            "trigger": 'matrix',
            "pattern": 'matrix-display-temp',
            "patternOptions": { "temp": displayString, "color": colorArr },
            "effect": "",
            "strips": [strip]
        }
        setLEDs( options );
        counter++;
    }
}

function cToF( temp ) {
    return Math.round( temp * 1.8 + 32 )
}
