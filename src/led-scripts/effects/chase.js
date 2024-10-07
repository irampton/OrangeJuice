module.exports = {
    id: "chase",
    name: "Chase",
    animate: true,
    options: [
        { id: "speed", name: "Speed", type: "number", default: 1 },
        { id: "reverse", name: "Reverse", type: "checkbox", default: false },
        { id: "scale", name: "Scale to Size", type: "number", default: 0 },
    ],
    Create: function ( colorArray, { numLEDs, reverse, speed, scale } ) {
        this.colorArray = [...colorArray];
        this.reverse = reverse ?? false;
        this.speed = speed ?? 1;
        this.scale = scale ?? false;
        this.interval = 1 / this.speed * 1000;
        this.step = function ( callback ) {
            if ( this.reverse ) {
                this.colorArray.unshift( this.colorArray.pop() );
            } else {
                this.colorArray.push( this.colorArray.shift() );
            }
            if ( this.scale ) {
                let out = [];
                for ( let i = 0; i < this.colorArray.length; i += this.colorArray.length / (numLEDs * this.scale) ) {
                    out.push( this.colorArray[Math.floor( i )] );
                }
                callback( out );
            } else {
                callback( this.colorArray );
            }
        }
    }
};