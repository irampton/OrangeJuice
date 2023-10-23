const { Gpio } = require( "onoff" );

class RotaryEncoder {
    secondSignal = false;
    timeout = null;
    prevA = null;

    constructor( {
                     pinA,
                     pinB,
                     cw = () => false,
                     ccw = () => false,
                     always = () => false
                 } ) {
        this.pinA = new Gpio( pinA, 'in', 'both' );
        this.pinB = new Gpio( pinB, 'in', 'both' );
        this.CW = cw;
        this.CCW = ccw;
        this.always = always;
        this.#watch();
    }

    cleanup() {
        this.pinA.unexport();
        this.pinB.unexport();
    }

    #watch() {
        this.pinA.watch( ( err, valueA ) => {
            if ( !this.secondSignal || valueA === this.prevA ) {
                this.secondSignal = true;
                this.timeout = setTimeout( () => {
                    this.secondSignal = false
                    this.prevA = null;
                }, 30 );
            } else {
                clearTimeout( this.timeout );
                let valueB = this.pinB.readSync();
                if ( valueA !== valueB ) {
                    this.CW();
                } else {
                    this.CCW();
                }
                this.always();
                this.secondSignal = false;
            }
            this.prevA = valueA;
        } );
    }
}

class Switch {
    constructor( {
                     pin,
                     onPress = () => false,
                     edge = 'rising'
                 } ) {
        this.pin = new Gpio( pin, 'in', edge );
        this.press = onPress;
        this.#watch();
    }

    cleanup() {
        this.pin.unexport();
    }

    #watch() {
        this.pin.watch( ( err ) => {
            this.press();
        } );
    }
}

module.exports = { RotaryEncoder, Switch }