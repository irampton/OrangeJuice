const {io} = require("socket.io-client");
const nconf = require("nconf");
const serverSocket = io("http://192.168.50.224:7974");

serverSocket.on('connect', function () {
    console.log("Connected to OrangeJuice server!");
});
serverSocket.on('pauseDemo', function () {
    console.log("Pausing Demo");
    clearTimeouts();
});
serverSocket.on('startDemo', function () {
    console.log("Starting Demo");
    startMatrix();
    startLights();
});

function sendToServer(msg, options) {
    if (serverSocket.connected) {
        serverSocket.emit(msg, options);
        //console.log(msg,options);
    }
}

let timeouts = [];

function clearTimeouts() {
    timeouts.forEach((v) => {
        clearTimeout(v);
    });
    timeouts = 0;
}

//matrix
let currentMatrix = 0;

function startMatrix() {
    sendToServer('setMatrix', {'id': 'temperatureClock'});
    currentMatrix++;
    timeouts.push(setInterval(() => {
        if (currentMatrix === 2) {
            sendToServer('setMatrix', {'id': 'temperatureClock'});
            currentMatrix = 0;
        } else if (currentMatrix === 0) {
            sendToServer('setMatrix', {'id': 'systemStats'});
            currentMatrix++
        } else {
            currentMatrix++;
        }
    }, 5000));
}

let strips = [
    {
        'strip': 2,
        'counter': 0,
        'timeout': 5000,
        pattern: [
            {
                "trigger": 'demo',
                "pattern": 'off',
                "patternOptions": {},
                "effect": "",
                "transition": 'fade',
                "transitionOptions": {"time": 500}
            },
            {
                "trigger": 'demo',
                "pattern": 'brightness-kelvin',
                "patternOptions": {
                    'kelvin': '3400',
                    'brightness': 50
                },
                "effect": "",
                "transition": 'fade',
                "transitionOptions": {"time": 500}
            }
        ]
    },
    {
        'strip': 1,
        'counter': 0,
        'timeout': 8000,
        pattern: [
            {
                "trigger": 'demo',
                "pattern": 'rainbow',
                "patternOptions": {
                    'multiplier': 1
                },
                "effect": "chase",
                "effectOptions": {
                    'reverse': false,
                    'speed': 2
                }
            },
            {
                "trigger": 'demo',
                "pattern": 'rainbow',
                "patternOptions": {
                    'multiplier': 1
                },
                "effect": "chase",
                "effectOptions": {
                    'reverse': true,
                    'speed': 2
                }
            }
        ]
    },
    {
        'strip': 4,
        'counter': 0,
        'timeout': 10000,
        pattern: [
            {
                "trigger": 'demo',
                "pattern": 'rainbow',
                "patternOptions": {
                    'multiplier': 1
                },
                "effect": "chase",
                "effectOptions": {
                    'reverse': true,
                    'speed': 16
                }
            },
            {
                "trigger": 'demo',
                "pattern": 'fill2',
                "patternOptions": {
                    'color1': "ffffff",
                    'color2': "0052F9"
                },
                "effect": ""
            },
            {
                "trigger": 'demo',
                "pattern": 'christmas',
                "patternOptions": {},
                "effect": "chase",
                "effectOptions": {
                    'reverse': false,
                    'speed': 8
                }
            },
            {
                "trigger": 'demo',
                "pattern": 'brightness-kelvin',
                "patternOptions": {
                    'kelvin': '3400',
                    'brightness': 50
                },
                "effect": "",
            },
        ]
    }
];


function startLights() {
    strips.forEach((config, index) => {
        let options = config.pattern[0];
        options.strips = [config.strip];
        config.counter++;
        sendToServer('setLEDs', options);
        timeouts.push(setInterval(() => {
            if (config.counter === config.pattern.length) {
                config.counter = 0;
            }
            let options = config.pattern[config.counter];
            options.strips = [config.strip];
            config.counter++;
            sendToServer('setLEDs', options);
        }, config.timeout))
    });
}