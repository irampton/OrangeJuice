const moment = require('moment'); // require
const request = require('request');
const cheerio = require('cheerio');

let currentWeather = {};
let counter = 0;

function updateWeather() {
    getWeather((weather) => {
        currentWeather = weather;
    });
}

updateWeather();
setInterval(updateWeather, 30000);

module.exports = {
    'name': "Temperature Clock",
    'id': "temperatureClock",
    'timeout': 1000,
    'generate': (strip, setLEDs) => {
        let readout = sensorLib.read();
        let displayString = `${cToF(readout.temperature)}  ${moment().format("HH:mm")} `;
        let colorArr = ["007700", "007700", "", "", "ff7000", "ff7000", "000077", "ff7000", "ff7000", ""];
        if (counter > 5) {
            colorArr[0] = colorArr[1] = "999900";
            displayString = `${currentWeather.temp}  ${moment().format("HH:mm")} `;
            if (counter > 10) {
                counter = 0;
            }
        }
        let options = {
            "trigger": 'matrix',
            "pattern": 'matrix-display-temp',
            "patternOptions": {"temp": displayString, "color": colorArr},
            "effect": "",
            "strips": [strip]
        }
        setLEDs(options);
        counter++;
    }
}

var sensorLib = require('node-dht-sensor');
const {updateLEDs} = require("../led-control");

// Setup sensor, exit if failed
var sensorType = 11; // 11 for DHT11, 22 for DHT22 and AM2302
var sensorPin = 4;  // The GPIO pin number for sensor signal
if (!sensorLib.initialize(sensorType, sensorPin)) {
    console.warn('Failed to initialize sensor');
}

// Automatically update sensor value every 2 seconds
/*setInterval(function() {
    var readout = sensorLib.read();
    console.log('Temperature:', cToF(readout.temperature.toFixed(1)) + ' F');
    console.log('Humidity:   ', readout.humidity.toFixed(1)    + '%');
}, 2000);*/

function cToF(temp) {
    return Math.round(temp * 1.8 + 32)
}

function getWeather(callback) {
    let url = "https://marvin.byu.edu/Weather/cgi-bin/textbritish";
    request(url, function (error, response, body) {
        //console.log('body:', body);
        const $ = cheerio.load(body);
        let path = $('td');
        let weather = {
            tempText: path[3].children[0].data,
            temp: Number(path[3].children[0].data.match(/\d+/g)[0]),
            tempRising: path[4].children[0].data.includes("rising"),
            humidityText: path[6].children[0].data,
            humidity: Number(path[6].children[0].data.match(/\d+/g)[0]),
            humidityRising: path[7].children[0].data.includes("rising")
        }
        callback(weather);
    });
}