const { Color } = require( '../YACML' );

module.exports = {
	id: "gradient-circle",
	name: "Gradient (Circle)",
	options: [
		{ id: "color_1", name: "Color #1", type: "color", default: "#000000" },
		{ id: "color_2", name: "Color #2", type: "color", default: "#000000" },
		{ id: "distance", name: "Distance", type: "number", default: .5 },
		{ id: "duplicate", name: "Duplicate Colors", type: "checkbox", default: false }
	],
	generate: ( numLEDs, { color_1, color_2, distance, duplicate } ) => {
		let arr = [];
		let color1 = new Color( color_1, 'hexText' );
		let color2 = new Color( color_2, 'hexText' );

		let firstGap = Math.floor( numLEDs * Number( distance ) ) + ( !duplicate ? 1 : 0 );
		let secondGap = numLEDs - firstGap;
		for( let i = 0; i < firstGap; i++ ) {
			arr.push( color1.lerp( color2, i / ( firstGap - 1 ) ).getHex() );
		}
		for( let i = ( duplicate ? 0 : 1 ); i <= secondGap + ( duplicate ? 1 : 0 ); i++ ) {
			arr.push( color2.lerp( color1, i / ( secondGap - ( duplicate ? 2 : 0 ) + 1 ) ).getHex() );
		}

		return arr;
	}
};