const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "color",
    'name': "Color",
    'animate': false,
    'options': [
        { 'id': "red", 'name': "Red Percent", 'type': "number", 'default': 100, "min": 0, "max": 100 },
        { id: "redTo", name: "Map Red To:", type: "select", default: 0, options: [
                { value: 0, name: "Red" },
                { value: 1, name: "Green" },
                { value: 2, name: "Blue" },
            ]
        },
        { 'id': "green", 'name': "Green Percent", 'type': "number", 'default': 100, "min": 0, "max": 100 },
        { id: "greenTo", name: "Map Green To:", type: "select", default: 1, options: [
                { value: 0, name: "Red" },
                { value: 1, name: "Green" },
                { value: 2, name: "Blue" },
            ]
        },
        { 'id': "blue", 'name': "Blue Percent", 'type': "number", 'default': 100, "min": 0, "max": 100 },
        { id: "blueTo", name: "Map Blue To:", type: "select", default: 2, options: [
                { value: 0, name: "Red" },
                { value: 1, name: "Green" },
                { value: 2, name: "Blue" },
            ]
        }

    ],
    'modify': ( arr, options ) => {
        let tempArr = [ ...arr ];
        for ( let i = 0; i < tempArr.length; i++ ) {
            let color = new Color( tempArr[i], 'hex' ).getRGB();
            let newColor = [];
            newColor[0] = color[Number(options.redTo)] * options.red / 100;
            newColor[1] = color[Number(options.greenTo)] * options.green / 100;
            newColor[2] = color[Number(options.blueTo)] * options.blue / 100;
            tempArr[i] = new Color( newColor ).getHex( false );
        }
        return tempArr;
    }
};

function toHex( number ) {
    let hex = number.toString( 16 );
    return hex.length === 1 ? "0" + hex : hex;
}