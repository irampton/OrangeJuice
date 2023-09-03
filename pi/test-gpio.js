const { RotaryEncoder } = require( 'gpio-components' );

const rotaryEncoderConfig = {
    pinA: 19,
    pinB: 26,
    onIncrement: () => console.log( 'Counterclockwise!' ),
    onDecrement: () => console.log( 'Clockwise' ),
};

const encoder = new RotaryEncoder( rotaryEncoderConfig );

encoder.watch();