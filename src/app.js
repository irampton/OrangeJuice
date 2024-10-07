const config = require( './config-manager' );
let ledScripts = require( "./led-scripts/led-scripts.js" );
const matrixScripts = require( "./led-scripts/matrix-scripts.js" );
const processSubgroups = require("./subgroups.js");

//grab data from config
let features = config.get( "features" );
let controllersConfig = config.get( "controllers" );
let stripConfig = config.get( "strips" );
const buttonMap = config.get( 'buttonConfigs' );
let disconnectConfigs = config.get( 'disconnectConfigs' );
const displayMatrix = config.get( "displayMatrix" );
let scriptGroups = config.get( 'scriptGroups' ) ?? [];
let userPresets = config.get( 'userPresets' ) ?? [];

//general
let globalMatrixBrightness = 20;
let connectedSystemStats = { "cpu": "100" };
let weatherData = {
    "indoor": {},
    "outdoor": {}
};
let numPixels = new Array( controllersConfig.length ).fill( 0 );
let currentLEDs = {
    "strips": []
};
stripConfig.forEach( ( strip, index ) => {
    numPixels[strip.controller] += strip.length;
    currentLEDs.strips.push( blankStrip( {
        "id": index,
        "name": strip.name,
        "length": strip.length,
        "controller": strip.controller
    } ) );
} );

let controllers = [];
//set up controllers
try {
    let setGPIO = false;
    controllersConfig.forEach( ( c, i ) => {
        //only 2 GPIO pins can be used at a time.
        switch ( c.type ) {
            case "GPIO":
                if ( setGPIO === "next" ) {
                    setGPIO = true;
                } else if ( setGPIO ) {
                    throw "Only 2 GPIO pins can be used. They must be next to each other in the config file.";
                } else {
                    let arr = [
                        {
                            numPixels: numPixels[i],
                            pin: c.pin
                        }
                    ]
                    if ( controllersConfig[i + 1]?.type === "GPIO" ) {
                        setGPIO = "next";
                        arr.push( {
                            numPixels: numPixels[i + 1],
                            pin: controllersConfig[i + 1].pin
                        } );
                    } else {
                        setGPIO = true;
                    }
                    controllers.push( ...new (require( "./controllers/led-pin-controller" ))( arr ) );
                }
                break;
            case "ESP32":
                controllers.push( new (require( "./controllers/led-esp32-controller" ))( numPixels[i], c.url ) );
                break;
        }
    } );
} catch ( e ) {
    console.error( `Failed to initialize LED controllers: ${e}` );
    process.exit( 1 );
}

//catch all errors
process.on( 'uncaughtException', function ( err ) {
    console.log( new Date().toString(), " - Got an error:" );
    console.log( err )
} );

//enable add-ons
if ( features.hostWebControl || features.webAPIs || features.gpioButtonsOnWeb ) {
    const express = require( 'express' );
    const app = express();
    const http = require( 'http' ).createServer( app );
    const port = 7974;

    if ( features.hostWebControl ) {
        app.use( express.static( 'web' ) );
    }

    if ( features.webAPIs ) {
        //web listeners
        app.get( '/rainbowMode', ( req, res ) => {
            let options = {
                "trigger": 'GET',
                "pattern": 'rainbow',
                "patternOptions": { "multiplier": 1 },
                "effect": "chase",
                "effectOptions": { "reverse": true, "speed": 1 },
                "strips": [1],
                //"transition": 'fade',
                "transitionOptions": { "time": 25 }
            }
            setLEDs( options );
            res.send( 'done' );
        } );
        app.get( '/lightsOff', ( req, res ) => {
            let options = {
                "trigger": 'GET',
                "pattern": 'off',
                "patternOptions": {},
                "effect": "",
                "strips": [0, 1],
                "transition": 'fade',
                "transitionOptions": { "time": 25 }
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

        if ( features.matrixDisplay ) {
            app.get( '/matrixOff', ( req, res ) => {
                let options = {
                    "id": "off"
                }
                changeMatrix( options );
                res.send( 'done' );
            } );
            app.get( '/matrixOn', ( req, res ) => {
                let options = {
                    "id": "tempe"
                }
                changeMatrix( { 'id': displayMatrix.default } );
                res.send( 'done' );
            } );
        }
    }

    //set the button config to also have a web api
    if ( features.gpioButtonsOnWeb ) {
        buttonMap.forEach( ( config, index ) => {
            app.get( `/button/${index}`, ( req, res ) => {
                if ( config.pattern ) {
                    const options = {
                        "trigger": 'webAPI',
                        "pattern": config.pattern,
                        "patternOptions": config?.patternOptions,
                        "effect": config?.effect,
                        "effectOptions": config?.effectOptions,
                        "strips": config?.strips,
                        //"transition": 'fade',
                        //"transitionOptions": {"time": 25}
                    }
                    setLEDs( options );
                }
                if ( config.matrix ) {
                    changeMatrix( { id: config.matrix } );
                }
                res.send( 'done' );
            } );
        } );
    }

    //websockets
    if ( features.hostWebControl || features.ioStatsUpdate ) {
        const { Server } = require( "socket.io" );
        const io = new Server( http );

        io.on( 'connection', function ( socket ) {
            console.log( 'a user connected' );
            socket.on( 'disconnect', function () {
                console.log( 'user disconnected' );
                disconnectConfigs.forEach( ( config ) => {
                    config.strips.forEach( ( stripIndex ) => {
                        writeConfigToStrips( stripIndex, config );
                    } );
                    drawLEDs();
                } )
            } );

            //new actually good stuff
            socket.on( 'getStripConfig', ( callback ) => {
                callback( stripConfig );
            } );
            socket.on( 'getScripts', ( callback ) => {
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
                callback( ledScripts );
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
                        disconnectConfigs = data;
                        config.set( 'disconnectConfigs', data );
                        break;
                    case "add":
                        disconnectConfigs.push( data );
                        config.set( 'disconnectConfigs', disconnectConfigs );
                        break;
                    case "remove":
                        disconnectConfigs.splice( disconnectConfigs.findIndex( ( v ) => v.id = data ), 1 );
                        config.set( 'disconnectConfigs', disconnectConfigs );
                        break;
                }
            } );
            socket.on( 'statsUpdate', ( data ) => {
                connectedSystemStats = data;
            } );
            socket.on( 'startDemo', ( data ) => {
                socket.broadcast.emit( 'startDemo' );
            } );
            socket.on( 'pauseDemo', ( data ) => {
                socket.broadcast.emit( 'pauseDemo' );
            } );
            socket.on( 'editStripGroup', ( method, data ) => {
                switch ( method ) {
                    case "add":
                        scriptGroups.push( data );
                        break;
                    case "remove":
                        scriptGroups.splice( data, 1 );
                        break;
                }
                config.set( 'scriptGroups', scriptGroups );
            } );
            socket.on( 'getStripGroups', ( callback ) => {
                callback( scriptGroups );
            } );
            socket.on( 'editPresets', ( method, ledConfig, index ) => {
                switch ( method ) {
                    case "add":
                        userPresets.push( ledConfig );
                        break;
                    case "remove":
                        userPresets.splice( index, 1 );
                        break;
                    case "update":
                        userPresets[index] = ledConfig;
                        break;
                }
                config.set( 'userPresets', userPresets );
            } );
            socket.on( 'getPresets', ( callback ) => {
                callback( userPresets );
            } );
            socket.on( 'getSettings', ( callback ) => {
                let send = {
                    features,
                    "homekit": config.get( 'homekit' ),
                    stripConfig,
                    buttonMap,
                    displayMatrix
                };
                callback( send );
            } );
            socket.on( 'setSettings', ( item, data ) => {
                switch ( item ) {
                    case "strips":
                        stripConfig = data;
                        config.set( "strips", stripConfig );
                        break;
                    case "homekit":
                        config.set( "homekit", data );
                        break;
                }
            } );
            socket.on( 'reloadScripts', ( callback ) => {
                reloadLEDScripts();

                function sendCallback() {
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

    http.listen( port, () => console.log( `listening on port ${port}` ) );
}

if ( features.weatherSensor || features.weatherFetch ) {
    require( "./connections/weatherData.js" ).setData( weatherData, {
        useSensor: features.weatherSensor,
        fetchOnlineData: features.weatherFetch,
        sensorType: features.sensorType
    } );
}

if ( features.gpioButtons ) {
    const GPIO = require( "./connections/GPIO-control" );

    //set up physical buttons
    buttonMap.forEach( ( config, index ) => {
        GPIO.initButton( index, () => {
            if ( config.pattern ) {
                const options = {
                    "trigger": 'button',
                    "pattern": config.pattern,
                    "patternOptions": config?.patternOptions,
                    "effect": config?.effect,
                    "effectOptions": config?.effectOptions,
                    "strips": config?.strips,
                    //"transition": 'fade',
                    //"transitionOptions": {"time": 25}
                }
                setLEDs( options );
            }
            if ( config.matrix ) {
                changeMatrix( { id: config.matrix } );
            }
        } )
    } );
    GPIO.initDial( 0, () => {
        globalMatrixBrightness++;
        if ( globalMatrixBrightness > 100 ) {
            globalMatrixBrightness = 100;
        }
    }, () => {
        globalMatrixBrightness--;
        if ( globalMatrixBrightness < 0 ) {
            globalMatrixBrightness = 0;
        }
    } );
}

//set up homekit
if ( features.homekit ) {
    const HomeKit = require( './connections/homekit.js' );
    const homeKitConfig = config.get( "homekit" );
    let rewrite = false;
    homeKitConfig.forEach( ( cfg, i ) => {
        new HomeKit( { number: i, ...cfg }, setLEDs, { weatherData } );
        if ( !(cfg.username || cfg.pincode) ) {
            rewrite = true;
        }
    } )
    config.set( 'homekit', homeKitConfig );
}

//set up matrix
let matrixInterval;

if ( features.matrixDisplay ) {
    setTimeout( () => {
        changeMatrix( { 'id': displayMatrix.default } )
    }, 500 );
}

//helper functions
let drawOnInterval = false;

function newLEDarr( size, color ) {
    let arr = [];
    for ( let i = 0; i < size; i++ ) {
        arr.push( color );
    }
    return arr;
}

function clearAppConfigs( noClear ) {
    noClear = noClear ?? [];
    currentLEDs.strips.forEach( ( strip, index ) => {
        if ( strip.trigger === "app" && !noClear.includes( index ) ) {
            clearInterval( strip.effectTimout );
            clearInterval( strip.transitionInterval );
            clearTimeout( strip.transitionTimeout );
            currentLEDs.strips[index] = blankStrip( strip );
        }
    } )
}

function reloadLEDScripts() {
    console.log( "reloading LED scripts" );
    let test = new RegExp( /\/led-scripts\// );
    let loadedScripts = Object.keys( require.cache ).filter( k => test.test( k.replace( /\\/g, "/" ) ) );
    loadedScripts.forEach( k => delete require.cache[k] );
    ledScripts = require( "./led-scripts/led-scripts" );
}

function blankStrip( strip ) {
    return {
        "id": strip.id,
        "name": strip.name,
        "length": strip.length,
        "controller": strip.controller,
        "arr": newLEDarr( strip.length, "000000" ),
        "trigger": "",
        "effect": {},
        "effectTimout": null,
        "default": strip.default
    };
}

function writeConfigToStrips( stripIndex, options ) {
    //clear any outstanding effects
    let oldColorArr = [];
    if ( currentLEDs.strips[stripIndex].effect ) {
        clearInterval( currentLEDs.strips[stripIndex].effectTimout );
        currentLEDs.strips[stripIndex].effect = {};
    }
    if ( currentLEDs.strips[stripIndex].transition ) {
        clearInterval( currentLEDs.strips[stripIndex].transition.interval );
    }
    if ( options.transition ) {
        oldColorArr = currentLEDs.strips[stripIndex].arr;
        if ( oldColorArr.length === 0 ) {
            oldColorArr = newLEDarr( currentLEDs.strips[stripIndex].length, "000000" );
        }
    }
    //clear strip config completely
    currentLEDs.strips[stripIndex] = blankStrip( currentLEDs.strips[stripIndex] );
    //generate pattern
    currentLEDs.strips[stripIndex].arr = ledScripts.patterns[options.pattern].generate( stripConfig[stripIndex].configuredLength ?? stripConfig[stripIndex].length, options.patternOptions );
    //set trigger
    currentLEDs.strips[stripIndex].trigger = options.trigger;
    if ( options.transition ) {
        let newColorArr = currentLEDs.strips[stripIndex].arr;
        currentLEDs.strips[stripIndex].arr = oldColorArr;
        currentLEDs.strips[stripIndex].transition = new ledScripts.transitions[options.transition].Create( newColorArr, oldColorArr, options.transitionOptions );
        currentLEDs.strips[stripIndex].transition.interval = setInterval( () => {
            if ( currentLEDs.strips[stripIndex].transition ) {
                currentLEDs.strips[stripIndex].transition.step( ( arr ) => {
                    currentLEDs.strips[stripIndex].arr = arr;
                    if ( !drawOnInterval ) {
                        drawLEDs();
                    }
                } )
            }
        }, currentLEDs.strips[stripIndex].transition.intervalTime );
    }
    //if there is an effect, apply & set it up
    if ( options.effect ) {
        //create the new effect
        currentLEDs.strips[stripIndex].effect = new ledScripts.effects[options.effect].Create(
            currentLEDs.strips[stripIndex].arr,
            {
                ...options.effectOptions,
                numLEDs: stripConfig[stripIndex].configuredLength ?? stripConfig[stripIndex].length
            } );
        //run the effect once
        currentLEDs.strips[stripIndex].effect.step( ( arr ) => {
            currentLEDs.strips[stripIndex].arr = arr;
        } );
        //set the effect to run continuously
        currentLEDs.strips[stripIndex].effectTimout = setInterval( () => {
            currentLEDs.strips[stripIndex].effect.step( ( arr ) => {
                currentLEDs.strips[stripIndex].arr = arr;
                if ( !drawOnInterval ) {
                    drawLEDs();
                }
            } )
        }, currentLEDs.strips[stripIndex].effect.interval );
    }

    //figure out how many effects are being run, and if needed, switch to interval drawing
    const effectsList = currentLEDs.strips.filter( e => e.effect.interval < 500 );
    if ( effectsList.length >= 2 ) {
        if ( !drawOnInterval ) {
            drawOnInterval = setInterval( () => {
                drawLEDs()
            }, 1000 / 24 ); // 24 times a second
        }
    } else {
        clearInterval( drawOnInterval );
        drawOnInterval = false;
    }
}

function setStripDefaults() {
    currentLEDs.strips.forEach( ( strip ) => {
        if ( strip.default ) {
            writeConfigToStrips( strip.id, strip.default );
        } else {
            blankStrip( strip );
        }
    } )
}

function setLEDs( options ) {
    //clear all other app scripts
    if ( options.trigger === "app" ) {
        clearAppConfigs( options.strips );
        setStripDefaults();
    }
    //write the config to each strip separately
    options.strips.forEach( ( stripIndex ) => {
        if ( options.trigger === "default" ) {
            currentLEDs.strips[stripIndex].default = options;
        }
        writeConfigToStrips( stripIndex, options );
    } );
    //after all the strips are set, draw the colors to the strip
    drawLEDs();
}

//function that handles all writing to the LEDs
function drawLEDs() {
    let arr = new Array( controllers.length ).fill( 0 ).map( e => [] );
    currentLEDs.strips.forEach( strip => {
        let tempArr = strip.arr;
        if ( stripConfig[strip.id].modifier ) {
            tempArr = ledScripts.modifiers[stripConfig[strip.id].modifier].modify( strip.arr, stripConfig[strip.id].modifierOptions );
        }
        if (stripConfig[strip.id].subgroups){
            tempArr = processSubgroups(tempArr, stripConfig[strip.id]);
        }
        for ( let i = 0; i < stripConfig[strip.id].length; i++ ) {
            arr[strip.controller].push( tempArr[i] );
        }
    } );
    controllers.forEach( ( c, i ) => {
        c.updateLEDs( arr[i] );
    } );
}

function changeMatrix( options ) {
    clearInterval( matrixInterval );
    options.strip = options.strip || displayMatrix.strip;

    function runMatrix() {
        matrixScripts[options.id].generate( options.strip, setLEDs, {
            connectedSystemStats,
            weatherData,
            globalBrightness: globalMatrixBrightness
        } );
    }

    runMatrix();
    if ( options.id !== "off" ) {
        matrixInterval = setInterval( runMatrix, matrixScripts[options.id].timeout );
    }
}