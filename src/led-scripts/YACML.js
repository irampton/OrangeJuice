const Color = class {
	constructor( color, type ) {

		//if no type is specified, try to figure it out what it is
		if( type === undefined ) {
			if( Array.isArray( color ) && color.length === 3 ) {
				type = "rgb";
			} else if( typeof color === 'string' ) {
				if( color[0] === "#" ) {
					type = "hex";
				} else if( color.slice( -1 ) === "k" || color.slice( -1 ) === "K" ) {
					type = "kelvin";
				}
			} else if( typeof color === 'number' ) {
				type = "hue";
			}
		}

		switch( type ) {
			case 'rgb':
			case 'RGB':
			case 'rgbArr':
				this.colorArr = color;
				break;
			case 'hsl':
			case 'HSL':
			case 'hslArr':
				this.colorArr = hslToRgb( color );
				break;
			case 'hex':
			case 'HEX':
				this.colorArr = hexToRgb( color );
				break;
			case 'hexText':
				this.colorArr = hexTextToRgb( color );
				break;
			case 'hexArr':
				this.colorArr = hexArrToRgb( color );
				break;
			case 'kelvin':
				this.colorArr = kelvinToRgb( color );
				break;
			case 'hue':
				this.colorArr = hueToRgb( color );
				break;
			default:
				throw "invalid color input";
		}
	}

	hexMode = false;
	roundMode = true;

	//get methods
	getColor() {
		if( this.hexMode ) {
			return rgbToHex( this.colorArr );
		} else {
			if( this.roundMode ) {
				return roundArr( this.colorArr );
			} else {
				return this.colorArr;
			}
		}
	}

	getRGB() {
		if( this.roundMode ) {
			return roundArr( this.colorArr );
		} else {
			return this.colorArr;
		}
	}

	getHex( rgb ) {
		return ( ( this.colorArr[0] & 0xff ) << 16 ) |
			( ( this.colorArr[1] & 0xff ) << 8 ) |
			( this.colorArr[2] & 0xff );
	}

	getHexString( includeHash = true ) {
		if( includeHash ) {
			return "#" + rgbToHex( this.colorArr );
		} else {
			return rgbToHex( this.colorArr );
		}
	}

	getHexArr() {
		return rgbToHexArr( this.colorArr );
	}

	getHSL() {
		if( this.roundMode ) {
			return roundArr( rgbToHsl( this.colorArr ) );
		} else {
			return rgbToHsl( this.colorArr );
		}
	}

	//manipulateMethods
	brightness( percentage ) {
		this.colorArr = brightnessRgb( this.colorArr, percentage );
		return this;
	}

	//alternate method of brightness that give different results
	brightnessHSL( percentage ) {
		this.colorArr = hslToRgb( brightnessHsl( this.getHSL(), percentage ) );
		return this;
	}

	shiftHue( amount ) {
		this.colorArr = shiftHueRgb( this.colorArr, amount );
		return this;
	}

	//Compute
	//amount is 0-1
	lerp( color, amount ) {
		if( !color instanceof Color ) {
			color = new Color( color );
		}

		return new Color( lerpColor( this.colorArr, color.getRGB(), amount ), 'rgb' );
	}
};

//conversions
function rgbToHex( arr ) {
	return '' + toHex( arr[0] ) + toHex( arr[1] ) + toHex( arr[2] );
}

function hexToRgb( hex ) {
	return [
		( hex >> 16 ) & 0xff,
		( hex >> 8 ) & 0xff,
		hex & 0xff
	];
}

function hexTextToRgb( hex ) {
	hex = hex.replace( "#", "" );
	return [parseInt( hex.slice( 0, 2 ), 16 ), parseInt( hex.slice( 2, 4 ), 16 ), parseInt( hex.slice( 4, 6 ), 16 )]
}

function rgbToHexArr( arr ) {
	return [toHex( arr[0] ), toHex( arr[1] ), toHex( arr[2] )];
}

function hexArrToRgb( hexArr ) {
	return [parseInt( hexArr[0], 16 ), parseInt( hexArr[1], 16 ), parseInt( hexArr[2], 16 )]
}

function rgbToHsl( arr ) {
	let r = arr[0];
	let g = arr[1];
	let b = arr[2];
	r /= 255;
	g /= 255;
	b /= 255;
	const l = Math.max( r, g, b );
	const s = l - Math.min( r, g, b );
	const h = s
		? l === r
			? ( g - b ) / s
			: l === g
				? 2 + ( b - r ) / s
				: 4 + ( r - g ) / s
		: 0;
	return [
		60 * h < 0 ? 60 * h + 360 : 60 * h,
		100 * ( s ? ( l <= 0.5 ? s / ( 2 * l - s ) : s / ( 2 - ( 2 * l - s ) ) ) : 0 ),
		( 100 * ( 2 * l - s ) ) / 2,
	];
}

function hslToHex( arr ) {
	let h = arr[0];
	let s = arr[1];
	let l = arr[2];
	l /= 100;
	const a = s * Math.min( l, 1 - l ) / 100;
	const f = n => {
		const k = ( n + h / 30 ) % 12;
		const color = l - a * Math.max( Math.min( k - 3, 9 - k, 1 ), -1 );
		return Math.round( 255 * color ).toString( 16 ).padStart( 2, '0' );   // convert to Hex and prefix "0" if needed
	};
	return `${f( 0 )}${f( 8 )}${f( 4 )}`;
}

function hslToRgb( arr ) {
	let h = arr[0];
	let s = arr[1];
	let l = arr[2];
	l /= 100;
	const a = s * Math.min( l, 1 - l ) / 100;
	const f = n => {
		const k = ( n + h / 30 ) % 12;
		const color = l - a * Math.max( Math.min( k - 3, 9 - k, 1 ), -1 );
		return Math.round( 255 * color );
	};
	return [f( 0 ), f( 8 ), f( 4 )];
}

//implemented from https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html
function kelvinToRgb( kelvin ) {
	if( typeof kelvin === 'string' ) {
		kelvin = kelvin.match( /\d*/g )[0];
	}
	let temperature = kelvin / 100;
	let red, green, blue;

	//Calculate Red:
	if( temperature <= 66 ) {
		red = 255;
	} else {
		red = temperature - 60;
		red = 329.698727446 * Math.pow( red, -0.1332047592 );
		if( red < 0 )
			red = 0;
		if( red > 255 )
			red = 255;
	}

	//Calculate Green:
	if( temperature <= 66 ) {
		green = temperature;
		green = 99.4708025861 * Math.log( green ) - 161.1195681661;
	} else {
		green = temperature - 60
		green = 288.1221695283 * Math.pow( green, -0.0755148492 );
	}
	if( green < 0 )
		green = 0;
	if( green > 255 )
		green = 255;

	//Calculate Blue:
	if( temperature >= 66 ) {
		blue = 255
	} else if( temperature <= 19 ) {
		blue = 0;
	} else {
		blue = temperature - 10
		blue = 138.5177312231 * Math.log( blue ) - 305.0447927307;
		if( blue < 0 )
			blue = 0
		if( blue > 255 )
			blue = 255;
	}
	return [Math.floor( red ), Math.floor( green ), Math.floor( blue )]
}

function hueToRgb( hue ) {
	hue = ( hue + 360 ) % 360;
	var h = hue / 60;
	var c = 255;
	var x = ( 1 - Math.abs( h % 2 - 1 ) ) * 255;
	var color;

	var i = Math.floor( h );
	if( i == 0 ) color = [c, x, 0];
	else if( i == 1 ) color = [x, c, 0];
	else if( i == 2 ) color = [0, c, x];
	else if( i == 3 ) color = [0, x, c];
	else if( i == 4 ) color = [x, 0, c];
	else color = [c, 0, x];

	return color;
}

//Format
function roundArr( inputArray ) {
	let arr = [...inputArray];
	for( let i = 0; i < arr.length; i++ ) {
		arr[i] = Math.round( arr[i] );
	}
	return arr;
}

//Manipulators
function lerpColor( c1, c2, per ) {
	return [
		c1[0] + ( c2[0] - c1[0] ) * per,
		c1[1] + ( c2[1] - c1[1] ) * per,
		c1[2] + ( c2[2] - c1[2] ) * per
	];
}

function brightnessRgb( color, amount ) {
	amount = amount / 100;
	//color should be [r,g,b]
	let output = [color[0] * amount, color[1] * amount, color[2] * amount];
	for( let i = 0; i < 3; i++ ) {
		if( output[i] > 255 ) {
			output[i] = 255;
		}
	}
	return output;
}

function brightnessHsl( color, amount ) {
	amount = amount / 100;
	//color should be [h,s,l]
	color[2] = color[2] * amount;
	if( color[2] > 100 ) {
		color[2] = 100;
	}
	return color;
}

function shiftHueRgb( arr, amount ) {
	let hsl = rgbToHsl( arr );
	hsl[0] += amount;
	return hslToRgb( hsl );
}

//helper
function toHex( number ) {
	let hex = Math.floor( number ).toString( 16 );
	return hex.length === 1 ? "0" + hex : hex;
}

//export
module.exports = {
	Color: Color,
	//conversions
	rgbToHex: rgbToHex,
	hexToRgb: hexToRgb,
	rgbToHexArr: rgbToHexArr,
	hexTextToRgb: hexTextToRgb,
	hexArrToRgb: hexArrToRgb,
	rgbToHsl: rgbToHsl,
	hslToRgb: hslToRgb,
	hslToHex: hslToHex,
	hueToRgb: hueToRgb,
	kelvinToRgb: kelvinToRgb,
	//manipulators
	brightness: brightnessRgb,
	brightnessHsl: brightnessHsl,
	shiftHue: shiftHueRgb,
	//computers
	lerpColor: lerpColor
}