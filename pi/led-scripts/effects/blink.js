const {currentStep} = require("../transitions/fade");
module.exports = {
    'id': "blink",
    'name': "Blink",
    'animate': true,
    'options': [
        {'id': "speed", 'name': "Speed", 'type': "number", 'default': 1}
    ],
    "Create": function (colorArray,options) {
        this.colorArray = [...colorArray];
        this.speed = options.speed ?? 1;
        this.interval = 1 / this.speed * 1000;
        this.currentStep = 0;
        this.step = function (callback) {
            if(this.currentStep === this.colorArray.length){
                this.currentStep = 0;
            }
            let outputArr = [];
            for(let i = 0;i < this.colorArray.length;i++){
                outputArr.push(this.colorArray[this.currentStep]);
            }
            this.currentStep++;
            callback(outputArr);
        }
    }
};