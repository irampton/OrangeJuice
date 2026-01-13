const { Color } = require( '../YACML' );

module.exports = {
    'id': "dip-to-color",
    'name': "Dip To Color",
    'animate': true,
    'options': [
        { 'id': "time", 'name': "Time", 'type': "number", 'default': 1 },
        { 'id': "color", 'name': "Dip Color", 'type': "color", 'default': "#ffffff" }
    ],
    "Create": function ( colorArray, oldArr, options, MAX_FPS ) {
        this.steps = Math.max( 2, Math.floor( MAX_FPS * options.time ) );
        this.intervalTime = 1 / MAX_FPS * 1000;
        this.interval = null;
        this.oldRgb = oldArr.map( v => new Color( v, "hex" ) );
        this.rgb = colorArray.map( v => new Color( v, "hex" ) );
        const dipColorValue = options.color ?? "ffffff";
        const dipColorType = typeof dipColorValue === "number" ? "hex" : "hexText";
        this.dipColor = new Color( dipColorValue, dipColorType );
        this.currentStep = 0;
        this.step = function ( callback ) {
            let arr = [];
            let percent = this.currentStep / (this.steps - 1);
            if ( percent < 0.5 ) {
                let dipPercent = (percent / 0.5);
                for ( let i = 0; i < this.oldRgb.length; i++ ) {
                    arr.push( this.oldRgb[i].lerp( this.dipColor, dipPercent ).getHex() );
                }
            } else {
                let risePercent = (percent - 0.5) / 0.5;
                for ( let i = 0; i < this.rgb.length; i++ ) {
                    arr.push( this.dipColor.lerp( this.rgb[i], risePercent ).getHex() );
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
