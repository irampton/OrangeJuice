module.exports = {
    'id': "wipe",
    'name': "Wipe",
    'animate': true,
    'options': [
        {'id': "speed", 'name': "Speed", 'type': "number", 'default': 1}
    ],
    "Create": function (colorArray,options) {
        this.numLeds = colorArray.length;
        this.baseColorArray = [...colorArray];
        this.colorArray = [];
        for(let i = 0; i < this.numLeds;i++){
            this.colorArray.push(colorArray[0]);
        }
        this.speed = options.speed ?? 1;
        this.interval = 1 / this.speed * 1000 / colorArray.length;
        this.currentStep = 1;
        this.currentLight = 0;
        this.step = function (callback) {
            if(this.currentStep === this.numLeds){
                this.currentStep = 0;
            }
            if(this.currentLight === this.numLeds){
                this.currentLight = 0;
                this.currentStep++;
            }
            this.colorArray[this.currentLight] = this.baseColorArray[this.currentStep];
            this.currentLight++;
            callback(this.colorArray);
        }
    }
};