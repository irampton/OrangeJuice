const { Color } = require( '../YACML' );

module.exports = {
    'id': "flash",
    'name': "Flash",
    'animate': true,
    'options': [
        { 'id': "time", 'name': "Time", 'type': "number", 'default': 1 },
        { 'id': "color", 'name': "Flash Color", 'type': "color", 'default': "#ffffff" }
    ],
    "Create": function ( colorArray, oldArr, options, MAX_FPS ) {
        this.steps = Math.max( 2, Math.floor( MAX_FPS * options.time ) );
        this.intervalTime = 1 / MAX_FPS * 1000;
        this.interval = null;
        this.oldRgb = oldArr.map( v => new Color( v, "hex" ) );
        this.rgb = colorArray.map( v => new Color( v, "hex" ) );
        const flashColorValue = options.color ?? "#ffffff";
        const flashColorType = typeof flashColorValue === "number" ? "hex" : "hexText";
        this.flashColor = new Color( flashColorValue, flashColorType );
        this.currentStep = 0;
        this.step = function ( callback ) {
            const percent = this.currentStep / (this.steps - 1);
            const faintStrength = 0.3;
            const burstPortion = 0.1;
            const halfBurst = burstPortion / 2;
            const slowEnd = 0.5 - halfBurst;
            const burstPeak = 0.5;
            const burstEnd = 0.5 + halfBurst;
            const slowExp = 3;
            const burstExp = 6;
            const arr = new Array( this.rgb.length );

            if ( percent < slowEnd ) {
                const t = Math.pow( percent / slowEnd, slowExp );
                for ( let i = 0; i < this.rgb.length; i++ ) {
                    const faintOld = this.oldRgb[i].lerp( this.flashColor, faintStrength );
                    arr[i] = this.oldRgb[i].lerp( faintOld, t ).getHex();
                }
            } else if ( percent < burstPeak ) {
                const t = (percent - slowEnd) / halfBurst;
                const eased = 1 - Math.pow( 1 - t, burstExp );
                for ( let i = 0; i < this.rgb.length; i++ ) {
                    const faintOld = this.oldRgb[i].lerp( this.flashColor, faintStrength );
                    arr[i] = faintOld.lerp( this.flashColor, eased ).getHex();
                }
            } else if ( percent < burstEnd ) {
                const t = (percent - burstPeak) / halfBurst;
                const eased = 1 - Math.pow( 1 - t, burstExp );
                for ( let i = 0; i < this.rgb.length; i++ ) {
                    const faintNew = this.rgb[i].lerp( this.flashColor, faintStrength );
                    arr[i] = this.flashColor.lerp( faintNew, eased ).getHex();
                }
            } else {
                const t = Math.pow( (percent - burstEnd) / (1 - burstEnd), slowExp );
                for ( let i = 0; i < this.rgb.length; i++ ) {
                    const faintNew = this.rgb[i].lerp( this.flashColor, faintStrength );
                    arr[i] = faintNew.lerp( this.rgb[i], t ).getHex();
                }
            }

            this.currentStep++;
            if ( this.currentStep >= this.steps ) {
                clearInterval( this.interval );
            }
            callback( arr );
        }
    }
};
