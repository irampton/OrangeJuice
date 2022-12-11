const express = require('express');
const app = express();
const port = 7974;
const http = require('http').createServer(app);
const {Server} = require("socket.io");
const io = new Server(http);
app.use(express.static('web'));
const config = require('config');

//led setup
const ws281x = require('rpi-ws281x-native');
let numPixels = 0;
let stripConfig = config.get("strips");
stripConfig.forEach((strip) => {
    numPixels += strip.length;
})
let channels = ws281x.init({
    dma: 10,
    freq: 800000,
    channels: [
        {count: numPixels, gpio: 18, invert: false, brightness: 128, stripType: 'ws2812'}
    ]
});
let ledChannel = channels[0];
let leds = [];
const ledScripts = require("./led-scripts.js");

function loadLEDs() {
    config.get("strips").forEach((strip, index) => {
        leds.push(...newLEDarr(strip.length, "ffff99"));
    })
}

loadLEDs();
updateLEDs();

function newLEDarr(size, color) {
    let arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(color);
    }
    return arr;
}

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    io.emit('led', leds);
    socket.on('toggle', (data) => {
        if (effect) {
            clearEffect();
        } else {
            chaseR();
        }
    });
    socket.on('newLEDColor', (data) => {
        leds[data.position] = data.color;
        updateLEDs();
    })
    /*socket.on('fillColor', (data) => {
        //data = {strips: [], color:""}
        data.strips.forEach((strip,index)=>{
            for(let i = stripConfig[index].start;i < stripConfig[index].start + stripConfig[index].length;i++){
                leds[i] = data.color;
            }
        });
        updateLEDs();
    })*/
    socket.on('changeEffect', (strips, effect, options) => {
        strips.forEach((strip, i, a) => {
            options.numLEDs = stripConfig[strip].length;
            let colorArray = ledScripts.patterns[effect].run(options);
            for (let i = 0; i < stripConfig[strip].length; i++) {
                leds[i + stripConfig[strip].start] = colorArray[i];
            }
        });
        updateLEDs();
    })
    socket.on('getEffects', () => {
        let effectList = [];
        ledScripts.effects.list.forEach((value) => {
            effectList.push({
                'name': ledScripts.effects[value].name,
                'id': ledScripts.effects[value].id,
                'options': ledScripts.effects[value].options
            });
        });
        socket.emit('effectList', effectList);
    });
    socket.on('getStripConfig', (callback)=>{
      callback(stripConfig);
    });
    socket.on('getScripts', (callback) => {
        let scriptsList = {
            "patterns": [],
            "effects": []
        };
        ledScripts.patterns.list.forEach((value) => {
            scriptsList.patterns.push({
                'name': ledScripts.patterns[value].name,
                'id': ledScripts.patterns[value].id,
                'options': ledScripts.patterns[value].options
            });
        });
        ledScripts.effects.list.forEach((value) => {
            scriptsList.effects.push({
                'name': ledScripts.effects[value].name,
                'id': ledScripts.effects[value].id,
                'options': ledScripts.effects[value].options
            });
        });

        callback(scriptsList);
    });
});
http.listen(port, () => console.log(`listening on port ${port}`));

function updateLEDs() {
    io.emit('led', leds);
    for (let i = 0; i < leds.length; i++) {
        ledChannel.array[i] = parseInt(leds[i], 16);
    }
    ws281x.render();
}

let x = 0;

function setRainbow(stripNum) {
    for (let i = stripConfig[stripNum].start; i < stripConfig[stripNum].start + stripConfig[stripNum].length; i++) {
        leds[i] = hue((((i + x) % 150) / 150) * 360);
    }
    x -= .25;
    updateLEDs();
}

//setInterval(setRainbow, 50, 1);

function hue(hue) {
    hue = (hue + 360) % 360;
    var h = hue / 60;
    var c = 255;
    var x = (1 - Math.abs(h % 2 - 1)) * 255;
    var color;

    var i = Math.floor(h);
    if (i == 0) color = rgb_to_hex(c, x, 0);
    else if (i == 1) color = rgb_to_hex(x, c, 0);
    else if (i == 2) color = rgb_to_hex(0, c, x);
    else if (i == 3) color = rgb_to_hex(0, x, c);
    else if (i == 4) color = rgb_to_hex(x, 0, c);
    else color = rgb_to_hex(c, 0, x);

    return color;
}

//RGB to HEX
function rgb_to_hex(red, green, blue) {
    var h = ((red << 16) | (green << 8) | (blue)).toString(16);
    // add the beginning zeros
    while (h.length < 6) h = '0' + h;
    return '' + h;
}