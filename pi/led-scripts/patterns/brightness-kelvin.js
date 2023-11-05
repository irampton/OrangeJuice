const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    id: "brightness-kelvin",
    name: "Color Temperature",
    options: [
        { id: "kelvin", name: "Temperature (k)", type: "number", default: 6500, min: 1000, max: 40000 },
        { id: "brightness", name: "Brightness", type: "number", default: 100 }
    ],
    generate: ( numLEDs, { kelvin, brightness } ) => {
        return new Array(numLEDs).fill(new Color( kelvin, 'kelvin' ).brightness( brightness ).getHex( false ));
    }
};