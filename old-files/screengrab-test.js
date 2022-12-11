let robot = require("robotjs");
let fs = require('fs');
let Jimp = require('jimp');
var quantize = require('quantize');

let start = new Date();
console.log(getBackgroundColors(8, 8, 4));

function getBackgroundColors(width, height, quality) {
    start = new Date();
    let capture = splitScreen(quality, quality);
    //console.log('get back captures', new Date() - start);
    let outputMatrix = [];
    for (let i = 0; i < width; i++) {
        let captureX = Math.ceil(quality * (i + 1) / width) - 1;
        let row = [];
        for (let j = 0; j < height; j++) {
            row.push(capture[Math.ceil(quality * (j + 1) / height) - 1][captureX]);
        }
        outputMatrix.push(row.reverse());
    }
    //return outputMatrix.reverse();
    console.log('end',new Date() - start);
    return matrixToArr(outputMatrix);
}

function matrixToArr(matrix) {
    //matrix.reverse();
    let arr = [];
    for (let i = 0; i < matrix.length; i++) {
        let temp = [];
        for (let j = 0; j < matrix[i].length; j++) {
            temp.push(matrix[i][j]);
        }
        if (i % 2 === 0) {
            arr.push(...temp);
        } else {
            arr.push(...temp.reverse());
        }
    }
    return arr;
}

function splitScreen(x, y) {
    let screenSize = robot.getScreenSize();
    let xLength = Math.floor(screenSize.width / x) * 1.25;
    let yLength = Math.floor(screenSize.height / y) * 1.25;
    //console.log(screenSize, xLength, yLength);
    let screenColors = [];
    for (let i = 0; i < y; i++) {
        let row = [];
        for (let j = 0; j < x; j++) {
            if ((i === 0 || i === y - 1) || (j === 0 || j === x - 1)) {
                row.push(hslToHex(rgbToHsl(getColorFromArea((xLength * j) + (xLength / 4), (yLength * i) + (yLength / 4), xLength / 2, yLength / 2))));
            } else {
                row.push("#00000");
            }
        }
        screenColors.push(row);
    }
    return screenColors;
}

function rgbToHex(arr) {
    return '#' + arr.map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }).join('')
}

function getColorFromArea(x, y, width, height) {
    //console.log('pre screen capture',new Date() - start);
    let img = robot.screen.capture(x, y, width, height);
    //console.log('post capture', new Date() - start);
    /*var jimg = new Jimp(width, height);
    for (var a = 0; a < width; a++) {
        for (var c = 0; c < height; c++) {
            var index = (c * img.byteWidth) + (a * img.bytesPerPixel);
            var r = img.image[index];
            var g = img.image[index + 1];
            var b = img.image[index + 2];
            var num = (r * 256) + (g * 256 * 256) + (b * 256 * 256 * 256) + 255;
            jimg.setPixelColor(num, a, c);
        }
    }
    jimg.write(`${x}-${width} ${y}-${height} screenshot.jpg`);*/

    let colors = []
    for (let i = 0; i < img.image.length; i += 32) {
        colors.push([img.image[i + 2], img.image[i + 1], img.image[i]]);
    }
    var colorMap = quantize(colors, 2);
    let palette = colorMap.palette();
    //console.log('after palette',new Date() - start);
    return palette[0];
    /*palette.forEach((v) => {
        console.log(rgbToHex(v));
    })*/
}

function rgbToHsl(arr) {
    let r = arr[0];
    let g = arr[1];
    let b = arr[2];
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
        ? l === r
            ? (g - b) / s
            : l === g
                ? 2 + (b - r) / s
                : 4 + (r - g) / s
        : 0;
    return [
        60 * h < 0 ? 60 * h + 360 : 60 * h,
        100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
        50,
    ];
}

function hslToHex(arr) {
    let h = arr[0];
    let s = arr[1];
    let l = arr[2];
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}