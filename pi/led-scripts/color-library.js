module.exports = {
    //conversions
    'rgbToHex': rgbToHexArr,
    'hexToRgb': hexToRgb,
    'rgbToHsl': rgbToHsl,
    'hslToRgb': hslToRgb,
    'hslToHex': hslToHex,
    //manipulators
    'hue': hue,
    'lerpColor': lerpColor,
    'brightness': brightness,
    'brightnessHsl': brightnessHsl,
    'brightnessRgb': brightnessRgb
}


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

function rgb_to_hex(red, green, blue) {
    var h = ((red << 16) | (green << 8) | (blue)).toString(16);
    // add the beginning zeros
    while (h.length < 6) h = '0' + h;
    return '' + h;
}

function lerpColor(c1, c2, per) {
    let diff = [c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2]];
    return [c1[0] + (diff[0] * per), c1[1] + (diff[1] * per), c1[2] + (diff[2] * per)];
}

function rgbToHexArr(arr) {
    return '' + toHex(arr[0]) + toHex(arr[1]) + toHex(arr[2]);
}

function toHex(number) {
    let hex = Math.floor(number).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function hexToRgb(hex){
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
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
        (100 * (2 * l - s)) / 2,
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
    return `${f(0)}${f(8)}${f(4)}`;
}

function hslToRgb(arr) {
    let h = arr[0];
    let s = arr[1];
    let l = arr[2];
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
    };
    return [f(0), f(8), f(4)];
}

function brightnessRgb(color, amount) {
    //color should be [r,g,b]
    return [color[0] * amount / 100, color[1] * amount / 100, color[2] * amount / 100];
}

function brightnessHsl(color,amount){
    //color should be [h,s,l]
    color[2] = color[2] * amount;
    return color
}

function brightness(color, amount){
    return hslToRgb(brightnessHsl(rgbToHsl(color),amount));
}