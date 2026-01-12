function registerWebSockets( http, {
    getFeatures,
    setFeatures,
    getControllersConfig,
    setControllersConfig,
    getLedScripts,
    matrixScripts,
    buttonMap,
    displayMatrix,
    getScriptGroups,
    setScriptGroups,
    getUserPresets,
    setUserPresets,
    getDisconnectConfigs,
    setDisconnectConfigs,
    setConnectedSystemStats,
    config,
    setLEDs,
    changeMatrix,
    clearAppConfigs,
    setStripDefaults,
    drawLEDs,
    writeConfigToStrips,
    reloadLEDScripts,
    rebuildControllers,
    setHomekitConfig,
    setLiveViewEnabled,
    setLiveViewEmitter
} ) {
    const { Server } = require( "socket.io" );
    const io = new Server( http );

    if ( setLiveViewEmitter ) {
        setLiveViewEmitter( ( payload ) => {
            io.emit( 'liveViewUpdate', payload );
        } );
    }

    io.on( 'connection', function ( socket ) {
        console.log( 'a user connected' );
        socket.on( 'disconnect', function () {
            console.log( 'user disconnected' );
            getDisconnectConfigs().forEach( ( config ) => {
                config.strips.forEach( ( stripIndex ) => {
                    writeConfigToStrips( stripIndex, config );
                } );
                drawLEDs();
            } )
        } );

        //new actually good stuff
        socket.on( 'getScripts', ( callback ) => {
            const ledScripts = getLedScripts();
            let scriptsList = {
                "patterns": [],
                "effects": []
            };
            ledScripts.patterns.list.forEach( ( value ) => {
                scriptsList.patterns.push( {
                    'name': ledScripts.patterns[value].name,
                    'id': ledScripts.patterns[value].id,
                    'options': ledScripts.patterns[value].options
                } );
            } );
            ledScripts.effects.list.forEach( ( value ) => {
                scriptsList.effects.push( {
                    'name': ledScripts.effects[value].name,
                    'id': ledScripts.effects[value].id,
                    'options': ledScripts.effects[value].options
                } );
            } );
            callback( scriptsList );
        } );
        socket.on( 'getLEDScripts', ( callback ) => {
            callback( getLedScripts() );
        } );
        socket.on( 'getMatrixScripts', ( callback ) => {
            callback( matrixScripts );
        } );
        socket.on( 'setLEDs', ( options ) => {
            setLEDs( options );
        } );
        socket.on( 'setMatrix', ( options ) => {
            changeMatrix( options );
        } );
        socket.on( 'clearAppConfigs', () => {
            clearAppConfigs();
            setStripDefaults();
            drawLEDs();
        } );
        socket.on( 'disconnectConfig', ( method, data ) => {
            switch ( method ) {
                case "replace":
                    setDisconnectConfigs( data );
                    config.set( 'disconnectConfigs', data );
                    break;
                case "add": {
                    const next = [ ...getDisconnectConfigs(), data ];
                    setDisconnectConfigs( next );
                    config.set( 'disconnectConfigs', next );
                    break;
                }
                case "remove": {
                    const next = [ ...getDisconnectConfigs() ];
                    next.splice( next.findIndex( ( v ) => v.id = data ), 1 );
                    setDisconnectConfigs( next );
                    config.set( 'disconnectConfigs', next );
                    break;
                }
            }
        } );
        socket.on( 'statsUpdate', ( data ) => {
            setConnectedSystemStats( data );
        } );
        socket.on( 'editStripGroup', ( method, data ) => {
            const next = [ ...getScriptGroups() ];
            switch ( method ) {
                case "add":
                    next.push( data );
                    break;
                case "remove":
                    next.splice( data, 1 );
                    break;
            }
            setScriptGroups( next );
            config.set( 'scriptGroups', next );
        } );
        socket.on( 'getStripGroups', ( callback ) => {
            callback( getScriptGroups() );
        } );
        socket.on( 'editPresets', ( method, ledConfig, index ) => {
            const next = [ ...getUserPresets() ];
            switch ( method ) {
                case "add":
                    next.push( ledConfig );
                    break;
                case "remove":
                    next.splice( index, 1 );
                    break;
                case "update":
                    next[index] = ledConfig;
                    break;
            }
            setUserPresets( next );
            config.set( 'userPresets', next );
        } );
        socket.on( 'getPresets', ( callback ) => {
            callback( getUserPresets() );
        } );
        socket.on( 'getSettings', ( callback ) => {
            let send = {
                features: getFeatures(),
                controllers: getControllersConfig(),
                "homekit": config.get( 'homekit' ),
                buttonMap,
                displayMatrix
            };
            callback( send );
        } );
        socket.on( 'enableLiveView', () => {
            if ( setLiveViewEnabled ) {
                setLiveViewEnabled();
            }
        } );
        socket.on( 'setSettings', ( item, data ) => {
            switch ( item ) {
                case "features":
                    setFeatures( data );
                    config.set( "features", data );
                    break;
                case "controllers":
                    config.set( "controllers", data );
                    rebuildControllers( data );
                    setControllersConfig( data );
                    break;
                case "homekit":
                    if ( setHomekitConfig ) {
                        setHomekitConfig( data );
                    } else {
                        config.set( "homekit", data );
                    }
                    break;
            }
        } );
        socket.on( 'reloadScripts', ( callback ) => {
            reloadLEDScripts();

            function sendCallback() {
                const ledScripts = getLedScripts();
                if ( ledScripts.patterns?.list.length > 0 && ledScripts.effects?.list.length > 0 ) {
                    callback( ledScripts );
                } else {
                    setTimeout( sendCallback, 50 );
                }
            }

            sendCallback();
        } );
    } );
}

module.exports = registerWebSockets;
