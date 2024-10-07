const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "fade",
    'name': "Fade",
    'animate': true,
    'options': [
        { 'id': "time", 'name': "Time", 'type': "number", 'default': 200 }
    ],
    "Create": function ( colorArray, oldArr, options ) {
        this.steps = Math.floor( options.time / 12 );
        this.intervalTime = options.time / this.steps;
        this.interval = null;
        this.oldRgb = oldArr.map( v => new Color( v, "hex" ) );
        this.rgb = colorArray.map( v => new Color( v, "hex" ) );
        this.currentStep = 0;
        this.step = function ( callback ) {
            let arr = [];
            let percent = this.currentStep / (this.steps - 1);
            for ( let i = 0; i < this.rgb.length; i++ ) {
                arr.push( this.oldRgb[i].lerp( this.rgb[i], percent ).getHex( false ) );
            }
            this.currentStep++;
            if ( this.currentStep >= this.steps ) {
                clearInterval( this.interval );
            }
            callback( arr );
        }
    }
};