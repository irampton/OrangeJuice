const { RotaryEncoder, Switch } = require( 'gpio-components' );

const buttonPins = [24, 25, 12, 16, 20, 21];
let buttonArr = [];
buttonPins.forEach( ( pinNum, index ) => buttonArr.push(
    {
        name: index,
        pinNum: pinNum,
        handler: null
    }
) );

const dialPins = [[26, 19]];
let dialArr = [];
dialPins.forEach( ( pins, index ) => dialArr.push(
    {
        name: index,
        a: pins[0],
        b: pins[1],
        handler: null
    }
) );

module.exports = {
    numButtons: 6,
    initButton: ( index, callback ) => {
        if ( buttonArr[index].handler ) {
            buttonArr[index].handler.cleanUp();
        }
        buttonArr[index].handler = new Switch( {
            pin: buttonArr[index].pinNum,
            onPress: () => callback()
        } );
        buttonArr[index].handler.watch();
    },
    numDials: 1,
    initDial: ( index, CW, CCW ) => {
        if ( dialArr[index].handler ) {
            dialArr[index].handler.cleanUp();
        }
        dialArr[index].handler = new RotaryEncoder( {
            pinA: dialArr[index].a,
            pinB: dialArr[index].b,
            onIncrement: () => CW(),
            onDecrement: () => CCW()
        } );
        dialArr[index].handler.watch();
    }
}



