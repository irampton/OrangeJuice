function registerWebAPIs( app, {
    setLEDs,
    userPresets,
    stripConfig,
} ) {
    //web listeners
    app.get( '/lightsOff', ( req, res ) => {
        const allStripIds = ( stripConfig || [] ).map( ( strip, index ) => index );
        let options = {
            "trigger": 'GET',
            "pattern": 'off',
            "patternOptions": {},
            "effect": "",
            "strips": allStripIds,
            "transition": 'fade',
            "transitionOptions": { "time": .7 }
        }
        setLEDs( options );
        res.send( 'done' );
    } );
    //preset control (for shortcut)
    app.get( '/presets', ( req, res ) => {
        res.send( userPresets.map( p => p.name ) );
    } );
    app.get( '/setPreset', ( req, res ) => {
        let name = req.headers?.preset || req.query?.preset;
        try {
            let preset = structuredClone( userPresets.find( p => p.name === name ) );
            preset.trigger = "webAPI";
            setLEDs( preset );
            res.send( 'done' );
        } catch ( e ) {
            res.status( 400 ).send( "Preset not found" );
        }
    } );
}

module.exports = registerWebAPIs;
