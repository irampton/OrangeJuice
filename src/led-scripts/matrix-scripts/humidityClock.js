const moment = require( 'moment' ); // require

let counter = 0;

module.exports = {
    'name': "Humidity Clock",
    'id': "humidityClock",
    'timeout': 1000,
    'generate': ( strip, setLEDs, { weatherData } ) => {
        let displayString = `${weatherData.indoor?.humidity}  ${moment().format( "HH:mm" )} `;
        let colorArr = ["007700", "007700", "", "", "ff7000", "ff7000", "000077", "ff7000", "ff7000", ""];
        if ( counter > 5 ) {
            colorArr[0] = colorArr[1] = "999900";
            displayString = `${weatherData.outdoor?.humidity}  ${moment().format( "HH:mm" )} `;
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