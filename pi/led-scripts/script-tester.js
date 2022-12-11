const express = require('express');
const app = express();
const port = 7974;
const http = require('http').createServer(app);
const {Server} = require("socket.io");
const io = new Server(http);
var path = require('path');

app.get('/', (req, res) => {
    let options = {
        root: path.join(__dirname)
    };

    let fileName = 'script-tester.html';
    res.sendFile(fileName, options, function (err) {
        if (err) {
            next(err);
        } else {
            console.log('Sent:', fileName);
        }
    });
})

const ledScripts = require("./led-scripts.js");

let running = {};

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('getScripts', (callback) => {
        callback(ledScripts);
    });

    socket.on('newConfig',(config)=>{
        if(running.effect){
            clearInterval(running.effectInterval);
        }
        running = {};

        let colorArr = ledScripts.patterns[config.pattern].generate(config.num,config.patternOptions);
        socket.emit('newColorArr', config, colorArr);

        if (config.effect) {
            running.effect = new ledScripts.effects[config.effect].Create(colorArr, config.effectOptions, config.num);
            running.effect.step((arr) => {
                socket.emit('newColorArr', config, arr);
            });
            running.effectInterval = setInterval(() => {
                running.effect.step((arr) => {
                    socket.emit('newColorArr', config, arr);
                })
            }, running.effect.interval);
        }
    })
});
http.listen(port, () => console.log(`listening on port ${port}`));
