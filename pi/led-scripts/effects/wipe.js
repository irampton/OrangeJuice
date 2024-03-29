module.exports = {
    'id': "wipe",
    'name': "Wipe",
    'animate': true,
    'options': [
        { 'id': "speed", 'name': "Speed", 'type': "number", 'default': 1 }
    ],
    "Create": function ( colorArray, { speed, numLEDs} ) {
        this.numLeds = numLEDs;
        this.baseColorArray = [...colorArray];
        this.colorArray = [];
        for ( let i = 0; i < this.numLeds; i++ ) {
            this.colorArray.push( colorArray[0] );
        }
        this.speed = speed ?? 1;
        this.interval = 1 / this.speed * 1000 / colorArray.length;
        this.currentStep = 0;
        this.currentLight = this.numLeds - 1;
        this.step = function ( callback ) {
            if ( this.currentLight >= this.numLeds ) {
                this.currentLight = 0;
                this.currentStep++;
            }
            if ( this.currentStep >= this.baseColorArray.length ) {
                this.currentStep = 0;
            }
            this.colorArray[this.currentLight] = this.baseColorArray[this.currentStep];
            this.currentLight++;
            callback( this.colorArray );
        }
    }
};