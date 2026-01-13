const { Color } = require( '../YACML' );

module.exports = {
	'id': "dip-to-black",
	'name': "Dip To Black",
	'animate': true,
	'options': [
		{ 'id': "time", 'name': "Time", 'type': "number", 'default': 1 }
	],
	"Create": function( colorArray, oldArr, options, MAX_FPS ) {
		this.steps = Math.max( 2, Math.floor( MAX_FPS * options.time ) );
		this.intervalTime = 1 / MAX_FPS * 1000;
		this.interval = null;
		this.oldRgb = oldArr.map( v => new Color( v, "hex" ) );
		this.rgb = colorArray.map( v => new Color( v, "hex" ) );
		this.currentStep = 0;
		this.step = function( callback ) {
			let arr = [];
			let percent = this.currentStep / ( this.steps - 1 );
			if( percent < 0.5 ) {
				let dipPercent = ( percent / 0.5 );
				let brightness = ( 1 - dipPercent ) * 100;
				for( let i = 0; i < this.oldRgb.length; i++ ) {
					arr.push( new Color( this.oldRgb[i].getRGB(), "rgb" ).brightness( brightness ).getHex() );
				}
			} else {
				let risePercent = ( percent - 0.5 ) / 0.5;
				let brightness = risePercent * 100;
				for( let i = 0; i < this.rgb.length; i++ ) {
					arr.push( new Color( this.rgb[i].getRGB(), "rgb" ).brightness( brightness ).getHex() );
				}
			}
			this.currentStep++;
			if( this.currentStep >= this.steps ) {
				clearInterval( this.interval );
			}
			callback( arr );
		}
	}
};
