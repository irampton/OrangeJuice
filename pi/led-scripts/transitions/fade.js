const colorLibrary = require("../color-library");

module.exports = {
    'id': "fade",
    'name': "Fade",
    'animate': true,
    'options': [
        {'id': "time", 'name': "Time", 'type': "number", 'default': 200}
    ],
    "Create": function (colorArray, oldArr, options) {
        this.steps = Math.floor(options.time / 12);
        this.intervalTime = options.time / this.steps;
        this.interval = null;
        this.colorArray = [...colorArray];
        this.oldArr = [...oldArr];
        this.oldRgb = [];
        this.rgb = [];
        this.oldArr.forEach((v) => {
            this.oldRgb.push(colorLibrary.hexToRgb(v));
        });
        this.colorArray.forEach((v) => {
            this.rgb.push(colorLibrary.hexToRgb(v));
        });
        this.currentStep = 0;
        this.step = function (callback) {
            let arr = [];
            let percent = this.currentStep / (this.steps - 1);
            for (let i = 0; i < this.colorArray.length; i++) {
                arr.push(colorLibrary.rgbToHex(colorLibrary.lerpColor(this.oldRgb[i], this.rgb[i], percent)));
            }
            this.currentStep++;
            if(this.currentStep >= this.steps){
                clearInterval(this.interval);
            }
            callback(arr);
        }
    }
};