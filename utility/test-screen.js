var i2c = require( 'i2c-bus' );
var oled = require( 'oled-rpi-i2c-bus' );
const font = require( 'oled-font-5x7' );

const opts = {
    width: 128,
    height: 64,
    address: 0x3C,
    bus: 1,
    driver: "SSD1306"
};

const i2cBus = i2c.openSync( opts.bus );
const display = new oled( i2cBus, opts );
display.drawRect = ( x, y, dx, dy, color, sync ) => {
    display.drawLine( x, y, x + dx, y, color, sync );
    display.drawLine( x, y, x, y + dy, color, sync );
    display.drawLine( x + dx, y, x + dx, y + dy, color, sync );
    display.drawLine( x, y + dy, x + dx, y + dy, color, sync );
};

function drawTextLine( text, line, box ) {
    display.setCursor( 2, line * 11 + 2 );
    display.writeString( font, 1, text, 1, false, false );

    if ( box ) {
        let length = 7 * text.length + 1;
        if ( length > 128 ) {
            length = 128;
        }
        display.drawRect( 0, line * 11, length, 11, 1, false );
    }
}

function drawMenu( list, top, selected ) {
    display.clearDisplay( false );
    for ( let i = top; i < Math.min( list.length, top + menu.height ); i++ ) {
        drawTextLine( options[i], i - top, i === selected );
    }
    display.update();
}

let menu = {
    top: 0,
    selected: 0,
    height: 6
};

let options = [
    'Temperature Clock',
    'Temp. Clock',
    'Humidity Clock',
    'Weather Info',
    'Weather',
    'System Info',
    'Off',
    'Your Mom',
    'hello',
    'Somebody',
    'Once',
    'told',
    'me',
    'the',
    'world',
    'was',
    'gonna',
    'roll',
    'me'
];

function refreshMenu() {
    setTimeout( () => {
        drawMenu( options, menu.top, menu.selected );
    }, 0 )
}
drawMenu( options, menu.top, menu.selected );

function moveSelection( amount ) {
    menu.selected += amount;
    if ( menu.selected < 0 ) {
        menu.selected = 0;
    }
    if ( menu.selected >= options.length ) {
        menu.selected = options.length - 1;
    }
    if ( menu.selected < menu.top ) {
        menu.top = menu.top - menu.height;
        if ( menu.top < 0 ) {
            menu.top = 0;
        }
    }
    if ( menu.selected >= menu.top + menu.height ) {
        menu.top += menu.height;
        if ( menu.top >= options.length ) {
            menu.top = options.length - menu.height;
        }
    }
}

const { RotaryEncoder, Switch } = require( './gpio-library.js' );

let encoder = new RotaryEncoder( {
    pinA: 26,
    pinB: 19,
    cw: () => {
        moveSelection( 1 );
        refreshMenu();
    },
    ccw: () => {
        moveSelection( -1 );
        refreshMenu();
    }
} );

let selector = new Switch( {
    pin: 13, onPress: () => {
        console.log( options[menu.selected]);
    }
} );