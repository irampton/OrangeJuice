const { Color, hexTextToRgb } = require( '../../YACML' );

module.exports = {
	id: "fill",
	name: "Fill",
	options: [
		{ id: "colors", name: "Colors", type: "colorArray", default: ["000000"] },
		{ id: "brightness", name: "Brightness", type: "number", default: 100 },
	],
	generate: ( numLEDs, { colors, brightness } ) => {
		let ogArr = [];
		for( let i = 0; i < colors.length; i++ ) {
			ogArr.push( new Color( colors[i], 'hexText' ).brightness( Number( brightness ) ).getHex() );
		}

		let arr = [];
		do {
			arr.push( ...ogArr );
		} while( arr.length < numLEDs )
		return arr;
	}
};

