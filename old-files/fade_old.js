module.exports = {
    'id': "fade",
    'name': "Fade",
    'animate': true,
    'options': [
        {'id': "time", 'name': "Time", 'type': "number", 'default': 200}
    ],
    "Create": function (colorArray, oldArr, options) {
        this.timeout = options.time
        this.steps = 12; //this.timeout / 12;
        this.interval = this.timeout / this.steps;
        this.colorArray = [...colorArray];
        this.oldArr = [...oldArr];
        this.oldRgb = [];
        this.rgb = [];
        this.rgbStep = [];
        this.oldArr.forEach((v) => {
            this.oldRgb.push([parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]);
        });
        this.colorArray.forEach((v) => {
            this.rgb.push([parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]);
        });
        this.oldRgb.forEach((v, i) => {
            this.rgbStep.push([(this.rgb[i][0] - v[0]) / this.steps, (this.rgb[i][1] - v[1]) / this.steps, (this.rgb[i][2] - v[2]) / this.steps]);
        });
        let sum = 0;
        for(let i = 0; i < this.rgbStep.length;i++){
            sum += this.rgbStep[i][0] + this.rgbStep[i][1] + this.rgbStep[i][2];
        }
        this.stepAverage = sum / (this.rgbStep.length * 3);
        console.log(oldArr[0],this.oldRgb[0]);
        console.log(this.stepAverage);
        this.step = function (callback) {
            /*if(Math.abs(this.stepAverage) < .1){
                return colorArray;
            }*/
            for (let i = 0; i < this.colorArray.length; i++) {
                this.oldRgb[i] = [Math.floor(this.oldRgb[i][0] + this.rgbStep[i][0]), Math.floor(this.oldRgb[i][1] + this.rgbStep[i][1]), Math.floor(this.oldRgb[i][2] + this.rgbStep[i][2])];
                this.colorArray[i] = this.oldRgb[i];
            }
            console.log(this.colorArray[0]);
            callback(this.colorArray);
        }
    }
};

function toFullHex(arr) {
    return '' + toHex(arr[0]) + toHex(arr[1]) + toHex(arr[2]);
}

function toHex(number) {
    let hex = number.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
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