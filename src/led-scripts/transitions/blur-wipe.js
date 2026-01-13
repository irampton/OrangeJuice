const { Color } = require( '../YACML' );

module.exports = {
	'id': "blur-wipe",
	'name': "Blur Wipe",
	'animate': true,
	'options': [
		{ 'id': "time", 'name': "Time", 'type': "number", 'default': 1 },
		{ 'id': "blurPercent", 'name': "Blur Percent", 'type': "number", 'default': 10 }
	],
	"Create": function( colorArray, oldArr, options, MAX_FPS ) {
		this.steps = Math.max( 2, Math.floor( MAX_FPS * options.time ) );
		this.intervalTime = 1 / MAX_FPS * 1000;
		this.interval = null;
		this.oldRgb = oldArr.map( v => new Color( v, "hex" ) );
		this.rgb = colorArray.map( v => new Color( v, "hex" ) );
		this.blurPercent = Math.max( 0, Number( options.blurPercent ) || 0 );
		this.currentStep = 0;
		this.step = function( callback ) {
			if( this.currentStep >= this.steps - 1 ) {
				const arr = this.rgb.map( color => color.getHex() );
				this.currentStep++;
				clearInterval( this.interval );
				callback( arr );
				return;
			}
			const percent = this.currentStep / ( this.steps - 1 );
			const blurSize = Math.round( this.rgb.length * ( this.blurPercent / 100 ) );
			const effectiveLength = this.rgb.length + blurSize;
			const cut = Math.max( 0, Math.min( effectiveLength, percent * effectiveLength ) );
			const start = cut - blurSize;
			const end = cut;
			const span = end - start;
			const arr = new Array( this.rgb.length );

			for( let i = 0; i < this.rgb.length; i++ ) {
				if( blurSize <= 0 ) {
					arr[i] = i < cut ? this.rgb[i].getHex() : this.oldRgb[i].getHex();
					continue;
				}
				if( i < start ) {
					arr[i] = this.rgb[i].getHex();
					continue;
				}
				if( i > end ) {
					arr[i] = this.oldRgb[i].getHex();
					continue;
				}
				const t = span <= 0 ? 1 : ( i - start ) / span;
				arr[i] = this.rgb[i].lerp( this.oldRgb[i], t ).getHex();
			}

			this.currentStep++;
			if( this.currentStep >= this.steps ) {
				clearInterval( this.interval );
			}
			callback( arr );
		}
	}
};
