const LerpEffect = require("./lerp-random");

module.exports = {
    'id': "lerp-chase-random",
    'name': "Lerp Chase (Random)",
    'animate': true,
    'options': [
        { 'id': "reverse", 'name': "Reverse", 'type': "checkbox", 'default': false },
        { 'id': "speed", 'name': "Speed", 'type': "number", 'default': 1 },
        { 'id': "distance", 'name': "Distance", 'type': "number", 'default': 1 }
    ],
    "Create": function ( colorArray, options ) {
        this.reverse = options.reverse;
        this.speed = options.speed;
        this.distance = options.distance;
        this.lerpEffect = new LerpEffect.Create(colorArray, {
            speed: colorArray.length / 24 * this.distance,
            minTime: 0,
            maxTime: 0
        });
        this.colorArray = [];
        for(let i = 0; i < colorArray.length; i++){
            this.lerpEffect.step((arr)=>{
                this.colorArray.push(arr[0]);
            });
        }
        if(this.reverse) {
            this.colorArray.reverse();
        }
        this.interval = 1 / this.speed * 1000;
        this.step = function ( callback ) {
            if ( this.reverse ) {
                this.colorArray.pop();
                this.lerpEffect.step((arr)=>{
                    this.colorArray.unshift(arr[0]);
                });
            } else {
                this.colorArray.shift();
                this.lerpEffect.step((arr)=>{
                    this.colorArray.push(arr[0]);
                });
            }
            callback( this.colorArray );
        }
    }
};