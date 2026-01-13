const { Color } = require( '../../YACML' );

module.exports = {
    'id': "fade",
    'name': "Fade",
    'animate': true,
    'options': [
        { 'id': "time", 'name': "Time", 'type': "number", 'default': 200 }
    ],
    "Create": function ( colorArray, oldArr, options, MAX_FPS ) {
        this.steps = Math.floor( MAX_FPS * options.time );
        this.intervalTime = 1 / MAX_FPS * 1000;
        this.interval = null;
        this.oldRgb = oldArr.map( v => new Color( v, "hex" ) );
        this.rgb = colorArray.map( v => new Color( v, "hex" ) );
        this.currentStep = 0;
        this.step = function ( callback ) {
            let arr = [];
            let percent = this.currentStep / (this.steps - 1);
            for ( let i = 0; i < this.rgb.length; i++ ) {
                arr.push( this.oldRgb[i].lerp( this.rgb[i], percent ).getHex() );
            }
            this.currentStep++;
            if ( this.currentStep >= this.steps ) {
                clearInterval( this.interval );
            }
            callback( arr );
        }
    }
};