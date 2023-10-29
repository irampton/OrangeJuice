const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "breath",
    'name': "Breath",
    'animate': true,
    'options': [
        { 'id': "speed", 'name': "Speed", 'type': "number", 'default': 5 },
        { 'id': "minBright", 'name': "Min Brightness", 'type': "number", 'default': 50 },
        { 'id': "maxBright", 'name': "Max Brightness", 'type': "number", 'default': 100 }
    ],
    "Create": function ( colorArray, options ) {
        this.patternArray = [...colorArray];
        this.steps = 24;
        this.minBright = Number( options.minBright );
        this.brightGap = Number( options.maxBright ) - this.minBright;
        this.reverse = false;
        this.fadeInterval = Number( options.speed );
        this.fadeAt = this.fadeInterval;
        this.interval = 1000 / this.steps;
        this.step = function ( callback ) {
            let out = [...this.patternArray];
            this.fadeAt -= 1 / this.steps;
            if ( this.fadeAt <= 0 ) {
                this.fadeAt = this.fadeInterval;
                this.reverse = !this.reverse;
            }
            const fadeAmount = (this.reverse ? 1 - this.fadeAt / this.fadeInterval : this.fadeAt / this.fadeInterval) * this.brightGap + this.minBright;
            callback( out.map( v => new Color( v, 'hex' ).brightness( fadeAmount ).getHex( false ) ) );
        }
    }
}