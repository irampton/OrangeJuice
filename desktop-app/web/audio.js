// fork getUserMedia for multiple browser versions, for those
// that need prefixes

navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

// set up forked web audio context, for multiple browsers
// window. is needed otherwise Safari explodes

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source;
var stream;

//set up the different audio nodes we will use for the app

var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = 0;
analyser.smoothingTimeConstant = 0.8;

var gainNode = audioCtx.createGain();

// set up canvas context for visualizer

var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

var visualSelect = document.getElementById("visual");

var drawVisual;

//main block for doing the audio recording

if (navigator.getUserMedia) {
    console.log('getUserMedia supported.');
    navigator.getUserMedia(
        // constraints - only audio needed for this app
        {
            audio: true
        },

        // Success callback
        function (stream) {
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.connect(gainNode);
            //gainNode.connect(audioCtx.destination);
            visualize();
        },

        // Error callback
        function (err) {
            console.log('The following gUM error occured: ' + err);
        }
    );
} else {
    console.log('getUserMedia not supported on your browser!');
}

let dataArray;

function visualize() {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;


    let visualSetting = "frequencybars";

    if (visualSetting === "frequencybars") {
        analyser.fftSize = 2048;
        var bufferLength = analyser.frequencyBinCount;
        dataArray = new Float32Array(bufferLength);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        const bgColor = 'rgb(220, 110, 20)';

        let c = 0;

        function draw() {
            c++;
            drawVisual = requestAnimationFrame(draw);
            WIDTH = canvas.width;
            HEIGHT = canvas.height;
            analyser.getFloatFrequencyData(dataArray);

            canvasCtx.fillStyle = bgColor;
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            let bars = Math.floor(bufferLength * .70);
            let barWidth = (WIDTH / bars) * 2.5;
            let x = 0;

            let count = 0;
            for (let i = 0; i < bars; i++) {
                count += dataArray[i]
            }
            let average = count / bufferLength;
            //document.getElementById("avg").innerText = average
            if (average > -125) {
                //let gradient = canvasCtx.createLinearGradient(0, 0, 0, HEIGHT);
                let gradient = canvasCtx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, WIDTH);
                for (let i = 0; i < bars; i++) {
                    if ((x / (WIDTH)) < 1) {
                        if (dataArray[i] === -Infinity || dataArray[i] === 0) {
                            gradient.addColorStop(x / WIDTH, bgColor);
                        } else {
                            let color = (dataArray[i] + 150) / 120 * 400;
                            let alpha = (color - 50) / 400
                            gradient.addColorStop(x / WIDTH, `rgb(${Math.floor(color)},${Math.floor(color / 2)},32, ${alpha})`);
                            //gradient.addColorStop(x / WIDTH, "#" + colorHue((color/200) * 360));
                        }
                    }
                    x += barWidth + 1;
                }
                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
            }


            barWidth = (WIDTH / bars) * 2.5;
            let barHeight;
            x = 0;
            for (let i = 0; i < bars; i++) {
                barHeight = (dataArray[i] + 140) * (HEIGHT / 256);
                let color = (dataArray[i] + 150) / 150 * 255;

                //canvasCtx.fillStyle = 'rgb(' + Math.floor(barHeight + 100) + ',' + Math.floor(barHeight + 100) / 3 + ',50)';
                canvasCtx.fillStyle = "#" + colorHue((color / 220) * 360);
                canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
            }
            if (c % 8 === 1) {
                sendLEDs(dataArray, bars);
            }
            if (c > 100000000) {
                c = 0;
            }
        }

        draw();

    } else if (visualSetting === "off") {
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = "red";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }

}

function colorHue(num) {
    num = (num + 340) % 360;
    if (num > -1 && num <= 45) {
        num += -10;
        num *= .52;
    } else if (num > 45 && num <= 85) {
        num += -10;
        num *= .55;
    } else if (num > 85 && num <= 135) {
        num += -20;
        num *= .64;
    } else if (num > 135 && num <= 185) {
        num += -75;
        num *= 1.26;
    } else if (num > 185 && num <= 245) {
        num += -60;
        num *= 1.11;
    } else if (num > 245 && num <= 295) {
        num += -42;
        num *= 1.01;
    } else if (num > 295 && num <= 355) {
        num += -145;
        num *= 1.7;
    }
    num = (num + 360) % 360;
    return hue(num);

    function hue(hue) {
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
}

//send to server function

const socket = io();

socket.on('connect', function () {
    console.log("connected");
});

function sendLEDs(audioArr, bars) {
    let audioData = [];
    let flatten = Math.round(bars / 100 - .5);
    for (let i = 0; i < bars; i += flatten) {
        for (let j = 0; j < flatten; j++) {
            audioData.push((audioArr[i + j] + 90) / 90);
        }
    }
    let options = {
        "trigger": "audio",
        "pattern": "audioVisualizer",
        "patternOptions": {'audioData': audioData},
        "effect": "",
        "transition": 'fade',
        "transitionOptions": {"time": 250},
        "strips": [0,3]
    }
    if (socket.connected) {
        socket.emit('setLEDs', options);
    }
}