const LerpEffect = require( "./lerp" );

module.exports = {
    id: "lerp-chase",
    name: "Lerp Chase",
    animate: true,
    options: [
        { id: "reverse", name: "Reverse", type: "checkbox", default: false },
        { id: "speed", name: "Speed", type: "number", default: 1 },
        { id: "distance", name: "Distance", type: "number", default: 1 },
        {
            id: "order", name: "Color Order", type: "select", default: 'linear', options: [
                { value: "linear", name: "Linear" },
                { value: "random", name: "Random" }
            ]
        }
    ],
    Create: function ( colorArray, { reverse, speed, distance, order } ) {
        this.reverse = reverse;
        this.speed = speed;
        this.distance = distance;
        this.lerpEffect = new LerpEffect.Create( colorArray, {
            speed: colorArray.length / 24 * this.distance,
            minTime: 0,
            maxTime: 0,
            order
        } );
        this.colorArray = [];
        for ( let i = 0; i < colorArray.length; i++ ) {
            this.lerpEffect.step( ( arr ) => {
                this.colorArray.push( arr[0] );
            } );
        }
        if ( this.reverse ) {
            this.colorArray.reverse();
        }
        this.interval = 1 / this.speed * 1000;
        this.step = function ( callback ) {
            if ( this.reverse ) {
                this.colorArray.pop();
                this.lerpEffect.step( ( arr ) => {
                    this.colorArray.unshift( arr[0] );
                } );
            } else {
                this.colorArray.shift();
                this.lerpEffect.step( ( arr ) => {
                    this.colorArray.push( arr[0] );
                } );
            }
            callback( this.colorArray );
        }
    }
};