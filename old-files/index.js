const socket = io();
let stripConfig = [];

socket.on('connect', function () {
});
socket.on('led', function (data) {
    let txt = "";
    for (i = 0; i < data.length; i++) {
        txt += `<div class="light" id="led-${i}" onclick="clickLED(${i})" style="background-color: #${data[i]}; left: ${(i % 24) * 60}px; margin-top: ${Math.floor(i / 24) * 60}px"></div>`
    }
    document.getElementById("lights").innerHTML = txt;
});
socket.on('stripConfig', function (data) {
    stripConfig = data;
});
socket.on('disconnect', function () {
});

function clickLED(index) {
    socket.emit('newLEDColor', {"position": index, "color": "ff0000"});
}

function fillColor(){
    socket.emit('fillColor',{"color": document.getElementById('fillColor').value.substring(1)});
}