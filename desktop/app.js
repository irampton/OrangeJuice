const activeWindow = require('active-win');
const {io} = require("socket.io-client");
const serverSocket = io("http://192.168.50.224:7974");
const nconf = require('nconf');
nconf.file({file: './config.json'});

const screenColors = require('./screen-colors');

let configurations = nconf.get('configurations') ?? [];
let ledPatterns = nconf.get('ledPatternList') ?? [];
let ledEffects = nconf.get('ledEffectList') ?? [];
let stripConfiguration = nconf.get('stripConfig') ?? [];
let backlightInterval;

//general functions
function saveConfig() {
    nconf.save(function (err) {
        if (err) {
            console.error(err.message);
            return;
        }
        //console.log('Configuration saved successfully.');
    });
}

//client stuff (talk to pi)
serverSocket.on('connect', function () {
    console.log("Connected to OrangeJuice server!");
    serverSocket.emit('getScripts', (scriptsList) => {
        ledPatterns = scriptsList.patterns;
        ledEffects = scriptsList.effects;
        ledPatterns.push({
            "name": "Screen Backlight",
            "id": "backlight",
            "options": []
        });
        nconf.set('ledPatternList', scriptsList.patterns);
        nconf.set('ledEffectList', scriptsList.effects);
        saveConfig();
    });
    serverSocket.emit('getStripConfig', (data) => {
        stripConfiguration = data;
        nconf.set('stripConfig', stripConfiguration);
        saveConfig();
    });
    setDefault();
    //update disconnect configs
    if (configurations) {
        let disconnectConfigs = [];
        configurations.forEach((config) => {
            if (config.trigger === 'disconnect') {
                disconnectConfigs.push(config);
            }
        });
        serverSocket.emit('disconnectConfig', "replace", disconnectConfigs);
    }
});

//server stuff
const express = require('express');
const app = express();
const port = 7975;
const http = require('http').createServer(app);
const {Server} = require("socket.io");
const ioS = new Server(http);
app.use(express.static('web'));

ioS.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('getConfigurations', (callback) => {
        let foundAppNames = [];
        nconf.get('foundAppList').forEach((value) => {
            foundAppNames.push(value.name)
        });
        callback(configurations, stripConfiguration, ledPatterns, ledEffects, foundAppNames);
    });
    socket.on('createConfiguration', (config) => {
        configurations.push(config);
        nconf.set('configurations', configurations);
        saveConfig();
        if (config.trigger === 'disconnect') {
            socket.emit('disconnectConfig', "add", config);
        }
    });
    socket.on('deleteConfiguration', (id) => {
        let config = configurations.splice(configurations.findIndex((v) => {
            return v.id === id
        }), 1);
        nconf.set('configurations', configurations);
        saveConfig();
        if (config.trigger === 'disconnect') {
            socket.emit('disconnectConfig', "remove", id);
        }
    });
});
http.listen(port, () => console.log(`listening on port ${port}`));

//App switching stuff
let currentApp = {"owner": {"path": ""}};

function checkActiveProgram() {
    let activeProgram = activeWindow.sync();
    let foundApps = nconf.get('foundAppList') ?? [];
    if (activeProgram) {
        if (currentApp.title === activeProgram.title)
            return;

        if (!foundApps.find(element => element.path === activeProgram.owner.path)) {
            foundApps.push({"name": activeProgram.owner.name, "path": activeProgram.owner.path});
            nconf.set('foundAppList', foundApps);
            saveConfig();
        }
        if (configurations) {
            const configuration = configurations.find((value) => {
                return value.triggerOption === activeProgram.owner.name
            });
            clearInterval(backlightInterval);
            if (configuration) {
                if (configuration.pattern === 'backlight') {
                    backlightInterval = setInterval(() => {
                        setScreenBacklight();
                    }, 333);
                } else {
                    //console.log("Run the effect for", configuration);
                    let options = {
                        "trigger": configuration.trigger,
                        "pattern": configuration.pattern,
                        "patternOptions": configuration.patternOptions,
                        "effect": configuration.effect,
                        "effectOptions": configuration.effectOptions,
                        "strips": configuration.strips,
                        //"transition": 'fade',
                        "transitionOptions": {"time": 250}
                    }
                    sendToServer('setLEDs', options);
                }
            } else {
                serverSocket.emit('clearAppConfigs');
            }
        }
        currentApp = activeProgram;
    }
}

function setScreenBacklight() {
    let options = {
        "trigger": 'app',
        "pattern": 'custom',
        "patternOptions": {'arr': screenColors.getColors(8, 8, 4)},
        "effect": '',
        "strips": [0],
        "transition": 'fade',
        "transitionOptions": {"time": 300}
    }
    sendToServer('setLEDs', options);
}

setInterval(checkActiveProgram, 250);

function setDefault() {
    if (configurations) {
        configurations.forEach((config) => {
            if (config.trigger === "default") {
                let options = {
                    "trigger": config.trigger,
                    "pattern": config.pattern,
                    "patternOptions": config.patternOptions,
                    "effect": config.effect,
                    "effectOptions": config.effectOptions,
                    "strips": config.strips
                }
                serverSocket.emit('setLEDs', options);
            }
        });
    }
}

function sendToServer(msg, options) {
    if (serverSocket.connected) {
        serverSocket.emit(msg, options);
    }
}