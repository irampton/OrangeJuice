const config = require( './config-manager' );
let ledScripts = require( "./led-scripts/led-scripts.js" );
const matrixScripts = require( "./led-scripts/matrix-scripts.js" );
const processSubgroups = require( "./subgroups.js" );
const path = require( 'path' );

//grab data from config
let features = config.get( "features" );
let controllersConfig = config.get( "controllers" ) || [];
let stripConfig = [];
const buttonMap = config.get( 'buttonConfigs' );
let disconnectConfigs = config.get( 'disconnectConfigs' );
const displayMatrix = config.get( "displayMatrix" );
let scriptGroups = config.get( 'scriptGroups' ) ?? [];
let userPresets = config.get( 'userPresets' ) ?? [];

const MAX_FPS = 48;

//general
let globalMatrixBrightness = 20;
let connectedSystemStats = { "cpu": "100" };
let weatherData = {
    "indoor": {},
    "outdoor": {}
};
let numPixels = [];
let currentLEDs = {
    "strips": []
};
let controllers = [];
let controllerUpdates = [];
let drawOnInterval = false;
let drawTimeout = null;
let drawOnTimeout = false;
let homekitInstances = [];
let enableLiveView = false;
let liveViewTimeout = null;
let emitLiveViewUpdate = null;

function setLiveViewEnabled() {
    enableLiveView = true;
    if ( liveViewTimeout ) {
        clearTimeout( liveViewTimeout );
    }
    liveViewTimeout = setTimeout( () => {
        enableLiveView = false;
    }, 10000 );
}

function setLiveViewEmitter( emitter ) {
    emitLiveViewUpdate = emitter;
}

function buildStripConfig( controllersList ) {
    let strips = [];
    controllersList.forEach( ( controller, controllerIndex ) => {
        ( controller.strips || [] ).forEach( ( strip ) => {
            strips.push( {
                ...strip,
                controller: controllerIndex
            } );
        } );
    } );
    return strips;
}

function rebuildControllersAndStrips( controllersList, options = {} ) {
    const { exitOnFailure = false } = options;
    if ( stripConfig.length ) {
        turnAllLightsOff();
    }
    const nextControllersConfig = controllersList || controllersConfig || [];
    const nextStripConfig = buildStripConfig( nextControllersConfig );
    const nextNumPixels = nextControllersConfig.map( controller => {
        return ( controller.strips || [] ).reduce( ( total, strip ) => total + ( strip.length || 0 ), 0 );
    } );
    const nextCurrentLEDs = {
        "strips": nextStripConfig.map( ( strip, index ) => blankStrip( {
            "id": index,
            "name": strip.name,
            "length": strip.length,
            "controller": strip.controller
        } ) )
    };
    const nextControllers = [];
    try {
        let setGPIO = false;
        nextControllersConfig.forEach( ( c, i ) => {
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
                                numPixels: nextNumPixels[i],
                                pin: c.pin
                            }
                        ]
                        if ( nextControllersConfig[i + 1]?.type === "GPIO" ) {
                            setGPIO = "next";
                            arr.push( {
                                numPixels: nextNumPixels[i + 1],
                                pin: nextControllersConfig[i + 1].pin
                            } );
                        } else {
                            setGPIO = true;
                        }
                        nextControllers.push( ...new (require( "./controllers/led-pin-controller" ))( arr ) );
                    }
                    break;
                case "WebSocket":
                    nextControllers.push( new (require( "./controllers/led-esp32-controller" ))( nextNumPixels[i], c.url ) );
                    break;
                case "Mock":
                    nextControllers.push( ...new (require( "./controllers/led-mock-controller" ))( nextNumPixels[i] ) );
                    break;
            }
        } );
    } catch ( e ) {
        console.error( `Failed to initialize LED controllers: ${e}` );
        if ( exitOnFailure ) {
            process.exit( 1 );
        }
        return false;
    }
    controllersConfig = nextControllersConfig;
    stripConfig = nextStripConfig;
    numPixels = nextNumPixels;
    currentLEDs = nextCurrentLEDs;
    controllers = nextControllers;
    controllerUpdates = new Array( nextControllers.length ).fill( true );
    clearInterval( drawOnInterval );
    drawOnInterval = false;
    if ( stripConfig.length ) {
        turnAllLightsOff();
    } else {
        drawLEDs();
    }
    return true;
}

rebuildControllersAndStrips( controllersConfig, { exitOnFailure: true } );

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

    const webRoot = path.join( __dirname, 'vue/dist' );

    if ( features.hostWebControl ) {
        app.use( express.static( webRoot ) );
    }

    if ( features.webAPIs ) {
        const registerWebAPIs = require( './connections/webAPIs' );
        registerWebAPIs( app, {
            setLEDs,
            turnAllLightsOff,
            userPresets,
        } );
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
                        //"transitionOptions": {"time": .7}
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

    if ( features.hostWebControl ) {
        app.get( '*', ( req, res ) => {
            res.sendFile( path.join( webRoot, 'index.html' ) );
        } );
    }

    //websockets
    if ( features.hostWebControl || features.ioStatsUpdate ) {
        const registerWebSockets = require( "./connections/webSockets" );
        registerWebSockets( http, {
            getFeatures: () => features,
            setFeatures: ( next ) => { features = next; },
            getControllersConfig: () => controllersConfig,
            setControllersConfig: ( next ) => { controllersConfig = next; },
            getStripConfig: () => stripConfig,
            getLedScripts: () => ledScripts,
            matrixScripts,
            buttonMap,
            displayMatrix,
            getScriptGroups: () => scriptGroups,
            setScriptGroups: ( next ) => { scriptGroups = next; },
            getUserPresets: () => userPresets,
            setUserPresets: ( next ) => { userPresets = next; },
            getDisconnectConfigs: () => disconnectConfigs,
            setDisconnectConfigs: ( next ) => { disconnectConfigs = next; },
            setConnectedSystemStats: ( next ) => { connectedSystemStats = next; },
            config,
            setLEDs,
            changeMatrix,
            clearAppConfigs,
            setStripDefaults,
            drawLEDs,
            writeConfigToStrips,
            reloadLEDScripts,
            rebuildControllersAndStrips,
            setHomekitConfig: setupHomekit,
            setLiveViewEnabled,
            setLiveViewEmitter
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
                    //"transitionOptions": {"time": .7}
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

function destroyHomekitInstances() {
    if ( !homekitInstances.length ) {
        return;
    }
    homekitInstances.forEach( instance => {
        instance?.destroy?.();
    } );
    homekitInstances = [];
}

function setupHomekit( homeKitConfig ) {
    const nextConfig = homeKitConfig || [];
    if ( !features.homekit ) {
        config.set( 'homekit', nextConfig );
        return nextConfig;
    }
    destroyHomekitInstances();
    const HomeKit = require( './connections/homekit.js' );
    const rebuiltConfig = nextConfig.map( ( cfg, i ) => {
        const instance = new HomeKit( { number: i, ...cfg }, setLEDs, { weatherData } );
        homekitInstances.push( instance );
        return instance?.config ?? cfg;
    } );
    config.set( 'homekit', rebuiltConfig );
    return rebuiltConfig;
}

//set up homekit
setupHomekit( config.get( "homekit" ) );

//set up matrix
let matrixInterval;

if ( features.matrixDisplay ) {
    setTimeout( () => {
        changeMatrix( { 'id': displayMatrix.default } )
    }, 500 );
}

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
            controllerUpdates[stripConfig[index].controller] = true;
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
        currentLEDs.strips[stripIndex].transition = new ledScripts.transitions[options.transition].Create( newColorArr, oldColorArr, options.transitionOptions, MAX_FPS );
        currentLEDs.strips[stripIndex].transition.interval = setInterval( () => {
            if ( currentLEDs.strips[stripIndex].transition ) {
                currentLEDs.strips[stripIndex].transition.step( ( arr ) => {
                    currentLEDs.strips[stripIndex].arr = arr;
                    controllerUpdates[stripConfig[stripIndex].controller] = true;
                    drawLEDs();
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
                controllerUpdates[stripConfig[stripIndex].controller] = true;
                drawLEDs();
            } )
        }, currentLEDs.strips[stripIndex].effect.interval );
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

function turnAllLightsOff() {
    if ( !stripConfig.length ) {
        return;
    }
    stripConfig.forEach( ( strip, stripIndex ) => {
        controllerUpdates[strip.controller] = true;
        writeConfigToStrips( stripIndex, {
            "trigger": "system",
            "pattern": "off",
            "patternOptions": {},
            "effect": "",
            "effectOptions": {}
        } );
    } );
    drawLEDs();
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
        controllerUpdates[stripConfig[stripIndex].controller] = true;
        writeConfigToStrips( stripIndex, options );
    } );
    //after all the strips are set, draw the colors to the strip
    drawLEDs();
}

//function that handles all writing to the LEDs
function drawLEDs() {
    if ( drawTimeout ) {
        drawOnTimeout = true;
        return;
    }
    drawTimeout = setTimeout( () => {
        drawTimeout = null;
        if(drawOnTimeout){
            drawOnTimeout = false;
            drawLEDs();
        }
    }, 1000 / MAX_FPS ) // don't draw more than MAX_FPS times a second
    let arr = new Array( controllers.length ).fill( 0 ).map( e => [] );
    currentLEDs.strips.forEach( strip => {
        let tempArr = strip.arr;
        if ( stripConfig[strip.id].modifier ) {
            tempArr = ledScripts.modifiers[stripConfig[strip.id].modifier].modify( strip.arr, stripConfig[strip.id].modifierOptions );
        }
        if ( stripConfig[strip.id].subgroups ) {
            tempArr = processSubgroups( tempArr, stripConfig[strip.id] );
        }
        for ( let i = 0; i < stripConfig[strip.id].length; i++ ) {
            arr[strip.controller].push( tempArr[i] );
        }
    } );
    controllers.forEach( ( c, i ) => {
        if ( controllerUpdates[i] ) {
            c.updateLEDs( arr[i] );
            if ( enableLiveView && emitLiveViewUpdate ) {
                emitLiveViewUpdate( {
                    controllerIndex: i,
                    colors: arr[i]
                } );
            }
        }
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
